package host

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"sync"
	"time"
)

type PluginHost struct {
	config         Config
	pluginsMu      sync.RWMutex
	plugins        map[string]*Plugin
    commandsMu     sync.RWMutex
    commands       map[string]Command
    eventHub       *EventHub
    installManager *InstallationManager
}

func NewPluginHost(cfg Config) *PluginHost {
	return &PluginHost{
		config:  cfg,
        plugins: make(map[string]*Plugin),
        commands: make(map[string]Command),
        eventHub: NewEventHub(),
	}
}

func (h *PluginHost) LoadPlugins() error {
	dir := h.config.PluginsDir
	entries, err := os.ReadDir(dir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		manifestPath := filepath.Join(dir, e.Name(), "manifest.json")
		manifestBytes, err := os.ReadFile(manifestPath)
		if err != nil {
			continue
		}
		var m Manifest
		if err := json.Unmarshal(manifestBytes, &m); err != nil {
			continue
		}
		if m.ID == "" || m.Name == "" || m.Version == "" {
			continue
		}
		h.pluginsMu.Lock()
		h.plugins[m.ID] = &Plugin{Manifest: m, Enabled: true} // 默认启用
		h.pluginsMu.Unlock()
	}
	return nil
}

func (h *PluginHost) CountPlugins() int {
	h.pluginsMu.RLock()
	defer h.pluginsMu.RUnlock()
	return len(h.plugins)
}

func (h *PluginHost) getPlugin(id string) (*Plugin, bool) {
	h.pluginsMu.RLock()
	defer h.pluginsMu.RUnlock()
	p, ok := h.plugins[id]
	return p, ok
}

func (h *PluginHost) hasPermission(pluginID, perm string) bool {
	if pluginID == "" {
		return false
	}
	p, ok := h.getPlugin(pluginID)
	if !ok {
		return false
	}
	for _, pstr := range p.Manifest.Permissions {
		if pstr == perm || pstr == "*" {
			return true
		}
	}
	return false
}

func (h *PluginHost) listVaultFiles() ([]string, error) {
	root := h.config.VaultDir
	var paths []string
	err := filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		if d.IsDir() {
			return nil
		}
		rel, err := filepath.Rel(root, path)
		if err != nil {
			return nil
		}
		paths = append(paths, rel)
		return nil
	})
	if os.IsNotExist(err) {
		return []string{}, nil
	}
	return paths, err
}

func (h *PluginHost) readVaultFile(relPath string) ([]byte, error) {
	root := h.config.VaultDir
	path := filepath.Join(root, filepath.Clean(relPath))
	data, err := os.ReadFile(path)
	if os.IsNotExist(err) {
		return nil, fmt.Errorf("not found")
	}
	return data, err
}

func (h *PluginHost) writeVaultFile(relPath string, data []byte) error {
	root := h.config.VaultDir
	path := filepath.Join(root, filepath.Clean(relPath))
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	return os.WriteFile(path, data, 0o644)
}

func (h *PluginHost) listCommands() []Command {
    h.commandsMu.RLock()
    defer h.commandsMu.RUnlock()
    cmds := make([]Command, 0, len(h.commands))
    for _, c := range h.commands {
        cmds = append(cmds, c)
    }
    return cmds
}

func (h *PluginHost) registerCommand(c Command) {
    key := c.PluginID + ":" + c.ID
    h.commandsMu.Lock()
    h.commands[key] = c
    h.commandsMu.Unlock()
}

func (h *PluginHost) invokeCommand(pluginID, commandID string) bool {
    key := pluginID + ":" + commandID
    h.commandsMu.RLock()
    _, ok := h.commands[key]
    h.commandsMu.RUnlock()
    if ok {
        h.Broadcast(Event{Type: "command.invoked", Data: map[string]string{"pluginId": pluginID, "commandId": commandID}})
    }
    return ok
}

func (h *PluginHost) Broadcast(ev Event) {
    if h.eventHub != nil {
        h.eventHub.Broadcast(ev)
    }
}

// enablePlugin 启用插件
func (h *PluginHost) enablePlugin(pluginID string) error {
    h.pluginsMu.Lock()
    defer h.pluginsMu.Unlock()
    
    plugin, exists := h.plugins[pluginID]
    if !exists {
        return fmt.Errorf("plugin not found: %s", pluginID)
    }
    
    plugin.Enabled = true
    h.Broadcast(Event{Type: "plugin.enabled", Data: map[string]string{"pluginId": pluginID}})
    return nil
}

// disablePlugin 禁用插件
func (h *PluginHost) disablePlugin(pluginID string) error {
    h.pluginsMu.Lock()
    defer h.pluginsMu.Unlock()
    
    plugin, exists := h.plugins[pluginID]
    if !exists {
        return fmt.Errorf("plugin not found: %s", pluginID)
    }
    
    plugin.Enabled = false
    h.Broadcast(Event{Type: "plugin.disabled", Data: map[string]string{"pluginId": pluginID}})
    return nil
}

// backupPlugin 备份插件到zip文件
func (h *PluginHost) backupPlugin(pluginID string) (string, error) {
    h.pluginsMu.RLock()
    plugin, exists := h.plugins[pluginID]
    h.pluginsMu.RUnlock()
    
    if !exists {
        return "", fmt.Errorf("plugin not found: %s", pluginID)
    }
    
    // 创建备份目录
    backupDir := filepath.Join(h.config.RootDir, "backups")
    if err := os.MkdirAll(backupDir, 0o755); err != nil {
        return "", fmt.Errorf("failed to create backup directory: %w", err)
    }
    
    // 生成备份文件名
    timestamp := time.Now().Format("20060102-150405")
    backupFileName := fmt.Sprintf("%s-v%s-%s.zip", pluginID, plugin.Manifest.Version, timestamp)
    backupPath := filepath.Join(backupDir, backupFileName)
    
    // 创建zip文件
    zipFile, err := os.Create(backupPath)
    if err != nil {
        return "", fmt.Errorf("failed to create backup file: %w", err)
    }
    defer zipFile.Close()
    
    zipWriter := zip.NewWriter(zipFile)
    defer zipWriter.Close()
    
    // 添加插件目录中的所有文件到zip
    pluginDir := filepath.Join(h.config.PluginsDir, pluginID)
    err = filepath.WalkDir(pluginDir, func(path string, d fs.DirEntry, err error) error {
        if err != nil {
            return err
        }
        
        if d.IsDir() {
            return nil
        }
        
        // 获取相对路径
        relPath, err := filepath.Rel(pluginDir, path)
        if err != nil {
            return err
        }
        
        // 读取文件内容
        fileData, err := os.ReadFile(path)
        if err != nil {
            return err
        }
        
        // 添加到zip
        zipFileWriter, err := zipWriter.Create(relPath)
        if err != nil {
            return err
        }
        
        _, err = zipFileWriter.Write(fileData)
        return err
    })
    
    if err != nil {
        os.Remove(backupPath) // 清理失败的备份文件
        return "", fmt.Errorf("failed to create backup: %w", err)
    }
    
    // 更新插件备份路径
    h.pluginsMu.Lock()
    plugin.BackupPath = backupPath
    h.pluginsMu.Unlock()
    
    h.Broadcast(Event{Type: "plugin.backed_up", Data: map[string]string{
        "pluginId": pluginID, 
        "backupPath": backupPath,
    }})
    
    return backupPath, nil
}

