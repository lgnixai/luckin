package host

import (
	"encoding/json"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"sync"
)

type PluginHost struct {
	config    Config
	pluginsMu sync.RWMutex
	plugins   map[string]*Plugin
    commandsMu sync.RWMutex
    commands   map[string]Command
    eventHub   *EventHub
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
		h.plugins[m.ID] = &Plugin{Manifest: m}
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

