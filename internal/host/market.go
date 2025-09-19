package host

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
)

type MarketItem struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Version string `json:"version"`
	URL     string `json:"url"`
	SHA256  string `json:"sha256"`
	Desc    string `json:"description,omitempty"`
}

func (h *PluginHost) fetchMarketIndex() ([]MarketItem, error) {
	src := h.config.MarketIndex
	if src == "" {
		// Use local fallback from /plugins/index.json if exists
		p := filepath.Join(h.config.PluginsDir, "index.json")
		b, err := os.ReadFile(p)
		if err != nil {
			if os.IsNotExist(err) {
				return []MarketItem{}, nil
			}
			return nil, err
		}
		var items []MarketItem
		if err := json.Unmarshal(b, &items); err != nil {
			return nil, err
		}
		return items, nil
	}
	// Remote fetch
	resp, err := http.Get(src)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	b, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	var items []MarketItem
	if err := json.Unmarshal(b, &items); err != nil {
		return nil, err
	}
	return items, nil
}

func (h *PluginHost) installPluginFromURL(id, url, wantSHA string) error {
	// 安全验证
	validator := NewPluginValidator(DefaultSecurityConfig())

	// 验证安装请求
	validationResult := validator.ValidateInstallRequest(id, url, wantSHA)
	if !validationResult.Valid {
		return fmt.Errorf("validation failed: %v", validationResult.Errors)
	}

	// 开始安装管理
	if h.installManager == nil {
		h.installManager = NewInstallationManager(3)
	}

	if err := h.installManager.StartInstallation(id); err != nil {
		return fmt.Errorf("installation start failed: %w", err)
	}
	defer func() {
		if r := recover(); r != nil {
			h.installManager.CompleteInstallation(id, fmt.Errorf("installation panicked: %v", r))
			panic(r)
		}
	}()

	// 下载插件
	resp, err := http.Get(url)
	if err != nil {
		h.installManager.CompleteInstallation(id, err)
		return fmt.Errorf("download failed: %w", err)
	}
	defer resp.Body.Close()

	// 检查响应状态
	if resp.StatusCode != http.StatusOK {
		err := fmt.Errorf("download failed with status: %d", resp.StatusCode)
		h.installManager.CompleteInstallation(id, err)
		return err
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		h.installManager.CompleteInstallation(id, err)
		return fmt.Errorf("read response failed: %w", err)
	}

	// 检查文件大小
	if err := validator.CheckPluginSize(int64(len(data))); err != nil {
		h.installManager.CompleteInstallation(id, err)
		return fmt.Errorf("size validation failed: %w", err)
	}

	// 验证文件完整性
	if err := validator.VerifyFileIntegrity(data, wantSHA); err != nil {
		h.installManager.CompleteInstallation(id, err)
		return fmt.Errorf("integrity verification failed: %w", err)
	}
	// 解析并验证清单
	var mf Manifest
	if err := json.Unmarshal(data, &mf); err != nil {
		installErr := fmt.Errorf("failed to parse manifest: %w", err)
		h.installManager.CompleteInstallation(id, installErr)
		return installErr
	}

	// 验证清单内容
	manifestValidation := validator.ValidateManifest(&mf)
	if !manifestValidation.Valid {
		installErr := fmt.Errorf("manifest validation failed: %v", manifestValidation.Errors)
		h.installManager.CompleteInstallation(id, installErr)
		return installErr
	}

	// 验证ID匹配
	if mf.ID != id {
		installErr := fmt.Errorf("manifest ID '%s' does not match requested ID '%s'", mf.ID, id)
		h.installManager.CompleteInstallation(id, installErr)
		return installErr
	}

	if mf.ID != "" {
		// 创建插件目录
		dir := filepath.Join(h.config.PluginsDir, mf.ID)
		if err := os.MkdirAll(dir, 0o755); err != nil {
			installErr := fmt.Errorf("failed to create plugin directory: %w", err)
			h.installManager.CompleteInstallation(id, installErr)
			return installErr
		}

		// 写入清单文件
		manifestPath := filepath.Join(dir, "manifest.json")
		if err := os.WriteFile(manifestPath, data, 0o644); err != nil {
			installErr := fmt.Errorf("failed to write manifest file: %w", err)
			h.installManager.CompleteInstallation(id, installErr)
			return installErr
		}

        // 注册插件
        h.pluginsMu.Lock()
        h.plugins[mf.ID] = &Plugin{Manifest: mf, Enabled: true}
        h.pluginsMu.Unlock()

		// 完成安装
		h.installManager.CompleteInstallation(id, nil)
		return nil
	}

	installErr := fmt.Errorf("unsupported plugin package format")
	h.installManager.CompleteInstallation(id, installErr)
	return installErr
}

func (h *PluginHost) uninstallPlugin(id string) error {
    // 先备份插件
    backupPath, backupErr := h.backupPlugin(id)
    if backupErr != nil {
        // 备份失败，记录警告但继续卸载
        fmt.Printf("Warning: Failed to backup plugin %s before uninstall: %v\n", id, backupErr)
    } else {
        fmt.Printf("Plugin %s backed up to: %s\n", id, backupPath)
    }
    
    // 删除插件目录
    dir := filepath.Join(h.config.PluginsDir, id)
    if err := os.RemoveAll(dir); err != nil {
        return fmt.Errorf("failed to remove plugin directory: %w", err)
    }
    
    // 从内存中移除插件
    h.pluginsMu.Lock()
    delete(h.plugins, id)
    h.pluginsMu.Unlock()
    
    // 广播卸载事件
    h.Broadcast(Event{Type: "plugin.uninstalled", Data: map[string]string{
        "pluginId": id,
        "backupPath": backupPath,
    }})
    
    return nil
}
