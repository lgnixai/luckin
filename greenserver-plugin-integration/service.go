package plugin

import (
	"archive/zip"
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/lgnixai/wmcms/pkg/logger"
)

// Service 插件服务接口
type Service interface {
	// Plugin management
	GetAllPlugins() ([]*PluginResponse, error)
	GetPlugin(pluginID string) (*PluginResponse, error)
	EnablePlugin(pluginID string) error
	DisablePlugin(pluginID string) error
	BackupPlugin(pluginID string) (string, error)
	LoadPluginsFromDisk() error

	// Installation management
	InstallPlugin(req *PluginInstallRequest) error
	UninstallPlugin(pluginID string) error
	GetInstallationStatus(pluginID string) (*InstallationStatusResponse, error)

	// Permission management
	HasPermission(pluginID, permission string) bool
	GetPluginPermissions(pluginID string) ([]string, error)

	// Command management
	RegisterCommand(pluginID string, req *CommandRegisterRequest) error
	GetAllCommands() ([]*CommandResponse, error)
	InvokeCommand(pluginID, commandID string) error

	// Vault operations
	ListVaultFiles(userID uint) ([]string, error)
	ReadVaultFile(userID uint, path string) (*VaultReadResponse, error)
	WriteVaultFile(userID uint, req *VaultWriteRequest) error

	// Market operations
	GetMarketItems() ([]*MarketItem, error)

	// Event management
	Broadcast(event *EventData)
	Subscribe(ctx context.Context) <-chan *EventData
}

// ServiceImpl 插件服务实现
type ServiceImpl struct {
	repo          Repository
	pluginsDir    string
	vaultDir      string
	marketURL     string
	eventHub      *EventHub
	installations map[string]*PluginInstallation
	installMutex  sync.RWMutex
}

// EventHub 事件中心
type EventHub struct {
	subscribers []chan *EventData
	mutex       sync.RWMutex
}

// NewEventHub 创建事件中心
func NewEventHub() *EventHub {
	return &EventHub{
		subscribers: make([]chan *EventData, 0),
	}
}

// Subscribe 订阅事件
func (h *EventHub) Subscribe(ctx context.Context) <-chan *EventData {
	ch := make(chan *EventData, 10)
	h.mutex.Lock()
	h.subscribers = append(h.subscribers, ch)
	h.mutex.Unlock()

	// 监听上下文取消，清理订阅
	go func() {
		<-ctx.Done()
		h.mutex.Lock()
		for i, sub := range h.subscribers {
			if sub == ch {
				h.subscribers = append(h.subscribers[:i], h.subscribers[i+1:]...)
				close(ch)
				break
			}
		}
		h.mutex.Unlock()
	}()

	return ch
}

// Broadcast 广播事件
func (h *EventHub) Broadcast(event *EventData) {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	for _, ch := range h.subscribers {
		select {
		case ch <- event:
		default:
			// 如果通道满了，跳过这个订阅者
		}
	}
}

// NewService 创建插件服务实例
func NewService(repo Repository, pluginsDir, vaultDir, marketURL string) Service {
	return &ServiceImpl{
		repo:          repo,
		pluginsDir:    pluginsDir,
		vaultDir:      vaultDir,
		marketURL:     marketURL,
		eventHub:      NewEventHub(),
		installations: make(map[string]*PluginInstallation),
	}
}

// Plugin management
func (s *ServiceImpl) GetAllPlugins() ([]*PluginResponse, error) {
	plugins, err := s.repo.GetAllPlugins()
	if err != nil {
		return nil, err
	}

	responses := make([]*PluginResponse, 0, len(plugins))
	for _, plugin := range plugins {
		response := s.convertToPluginResponse(plugin)
		responses = append(responses, response)
	}

	return responses, nil
}

func (s *ServiceImpl) GetPlugin(pluginID string) (*PluginResponse, error) {
	plugin, err := s.repo.GetPluginByID(pluginID)
	if err != nil {
		return nil, err
	}

	return s.convertToPluginResponse(plugin), nil
}

func (s *ServiceImpl) EnablePlugin(pluginID string) error {
	err := s.repo.EnablePlugin(pluginID)
	if err != nil {
		return err
	}

	s.Broadcast(&EventData{
		Type: "plugin.enabled",
		Data: map[string]interface{}{"pluginId": pluginID},
	})

	return nil
}

func (s *ServiceImpl) DisablePlugin(pluginID string) error {
	err := s.repo.DisablePlugin(pluginID)
	if err != nil {
		return err
	}

	s.Broadcast(&EventData{
		Type: "plugin.disabled",
		Data: map[string]interface{}{"pluginId": pluginID},
	})

	return nil
}

func (s *ServiceImpl) BackupPlugin(pluginID string) (string, error) {
	plugin, err := s.repo.GetPluginByID(pluginID)
	if err != nil {
		return "", err
	}

	// 创建备份目录
	backupDir := filepath.Join(s.pluginsDir, "..", "backups")
	if err := os.MkdirAll(backupDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create backup directory: %w", err)
	}

	// 生成备份文件名
	timestamp := time.Now().Format("20060102-150405")
	backupFileName := fmt.Sprintf("%s-v%s-%s.zip", pluginID, plugin.Version, timestamp)
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
	pluginDir := filepath.Join(s.pluginsDir, pluginID)
	err = filepath.WalkDir(pluginDir, func(path string, d os.DirEntry, err error) error {
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
	plugin.BackupPath = backupPath
	if err := s.repo.UpdatePlugin(plugin); err != nil {
		logger.Error("Failed to update plugin backup path", err)
	}

	s.Broadcast(&EventData{
		Type: "plugin.backed_up",
		Data: map[string]interface{}{
			"pluginId":   pluginID,
			"backupPath": backupPath,
		},
	})

	return backupPath, nil
}

func (s *ServiceImpl) LoadPluginsFromDisk() error {
	entries, err := os.ReadDir(s.pluginsDir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		manifestPath := filepath.Join(s.pluginsDir, entry.Name(), "manifest.json")
		manifestBytes, err := os.ReadFile(manifestPath)
		if err != nil {
			continue
		}

		var manifest map[string]interface{}
		if err := json.Unmarshal(manifestBytes, &manifest); err != nil {
			continue
		}

		pluginID := getStringFromMap(manifest, "id")
		name := getStringFromMap(manifest, "name")
		version := getStringFromMap(manifest, "version")
		author := getStringFromMap(manifest, "author")
		description := getStringFromMap(manifest, "description")

		if pluginID == "" || name == "" || version == "" {
			continue
		}

		// 检查插件是否已存在
		existingPlugin, err := s.repo.GetPluginByID(pluginID)
		if err == nil && existingPlugin != nil {
			continue // 插件已存在，跳过
		}

		// 创建新插件记录
		plugin := &Plugin{
			PluginID:    pluginID,
			Name:        name,
			Version:     version,
			Author:      author,
			Description: description,
			Enabled:     true,
		}

		if err := s.repo.CreatePlugin(plugin); err != nil {
			logger.Error("Failed to create plugin from disk: "+pluginID, err)
			continue
		}

		// 处理权限
		if permissions, ok := manifest["permissions"].([]interface{}); ok {
			for _, perm := range permissions {
				if permStr, ok := perm.(string); ok {
					if err := s.repo.AddPluginPermission(pluginID, permStr); err != nil {
						logger.Error("Failed to add plugin permission for "+pluginID+":"+permStr, err)
					}
				}
			}
		}
	}

	return nil
}

// Installation management
func (s *ServiceImpl) InstallPlugin(req *PluginInstallRequest) error {
	// 创建安装记录
	installation := &PluginInstallation{
		PluginID:  req.ID,
		Status:    "installing",
		Progress:  0,
		Message:   "开始下载插件",
		SourceURL: req.URL,
		SHA256:    req.SHA256,
	}

	if err := s.repo.CreateInstallation(installation); err != nil {
		return err
	}

	s.installMutex.Lock()
	s.installations[req.ID] = installation
	s.installMutex.Unlock()

	// 异步执行安装
	go s.performInstallation(req)

	return nil
}

func (s *ServiceImpl) performInstallation(req *PluginInstallRequest) {
	installation, exists := s.getInstallation(req.ID)
	if !exists {
		return
	}

	// 更新状态
	updateStatus := func(status string, progress int, message string) {
		installation.Status = status
		installation.Progress = progress
		installation.Message = message
		s.repo.UpdateInstallation(installation)

		s.Broadcast(&EventData{
			Type: "plugin.installation.progress",
			Data: map[string]interface{}{
				"pluginId": req.ID,
				"status":   status,
				"progress": progress,
				"message":  message,
			},
		})
	}

	// 下载文件
	updateStatus("downloading", 10, "正在下载插件文件")
	tempFile, err := s.downloadFile(req.URL)
	if err != nil {
		updateStatus("failed", 0, fmt.Sprintf("下载失败: %v", err))
		return
	}
	defer os.Remove(tempFile)

	// 校验文件
	if req.SHA256 != "" {
		updateStatus("verifying", 30, "正在校验文件")
		if err := s.verifyFile(tempFile, req.SHA256); err != nil {
			updateStatus("failed", 0, fmt.Sprintf("文件校验失败: %v", err))
			return
		}
	}

	// 解压文件
	updateStatus("extracting", 50, "正在解压插件文件")
	pluginDir := filepath.Join(s.pluginsDir, req.ID)
	if err := s.extractZip(tempFile, pluginDir); err != nil {
		updateStatus("failed", 0, fmt.Sprintf("解压失败: %v", err))
		return
	}

	// 读取manifest文件
	updateStatus("configuring", 80, "正在配置插件")
	manifestPath := filepath.Join(pluginDir, "manifest.json")
	if err := s.loadPluginFromManifest(manifestPath); err != nil {
		updateStatus("failed", 0, fmt.Sprintf("配置插件失败: %v", err))
		return
	}

	// 完成安装
	now := time.Now()
	installation.Status = "installed"
	installation.Progress = 100
	installation.Message = "安装完成"
	installation.InstalledAt = &now
	s.repo.UpdateInstallation(installation)

	s.Broadcast(&EventData{
		Type: "plugin.installed",
		Data: map[string]interface{}{
			"pluginId": req.ID,
		},
	})
}

func (s *ServiceImpl) UninstallPlugin(pluginID string) error {
	// 删除插件目录
	pluginDir := filepath.Join(s.pluginsDir, pluginID)
	if err := os.RemoveAll(pluginDir); err != nil {
		return fmt.Errorf("failed to remove plugin directory: %w", err)
	}

	// 删除数据库记录
	if err := s.repo.DeletePlugin(pluginID); err != nil {
		return err
	}

	// 删除安装记录
	s.repo.DeleteInstallation(pluginID)

	s.Broadcast(&EventData{
		Type: "plugin.uninstalled",
		Data: map[string]interface{}{"pluginId": pluginID},
	})

	return nil
}

func (s *ServiceImpl) GetInstallationStatus(pluginID string) (*InstallationStatusResponse, error) {
	installation, err := s.repo.GetInstallationByPluginID(pluginID)
	if err != nil {
		return nil, err
	}

	return &InstallationStatusResponse{
		PluginID:    installation.PluginID,
		Status:      installation.Status,
		Progress:    installation.Progress,
		Message:     installation.Message,
		InstalledAt: installation.InstalledAt,
	}, nil
}

// Permission management
func (s *ServiceImpl) HasPermission(pluginID, permission string) bool {
	permissions, err := s.repo.GetPluginPermissions(pluginID)
	if err != nil {
		return false
	}

	for _, perm := range permissions {
		if perm == permission || perm == "*" {
			return true
		}
	}
	return false
}

func (s *ServiceImpl) GetPluginPermissions(pluginID string) ([]string, error) {
	return s.repo.GetPluginPermissions(pluginID)
}

// Command management
func (s *ServiceImpl) RegisterCommand(pluginID string, req *CommandRegisterRequest) error {
	command := &Command{
		CommandID: req.ID,
		PluginID:  pluginID,
		Title:     req.Title,
	}

	return s.repo.CreateCommand(command)
}

func (s *ServiceImpl) GetAllCommands() ([]*CommandResponse, error) {
	commands, err := s.repo.GetAllCommands()
	if err != nil {
		return nil, err
	}

	responses := make([]*CommandResponse, 0, len(commands))
	for _, cmd := range commands {
		responses = append(responses, &CommandResponse{
			ID:        cmd.ID,
			CommandID: cmd.CommandID,
			PluginID:  cmd.PluginID,
			Title:     cmd.Title,
		})
	}

	return responses, nil
}

func (s *ServiceImpl) InvokeCommand(pluginID, commandID string) error {
	s.Broadcast(&EventData{
		Type: "command.invoked",
		Data: map[string]interface{}{
			"pluginId":  pluginID,
			"commandId": commandID,
		},
	})
	return nil
}

// Vault operations
func (s *ServiceImpl) ListVaultFiles(userID uint) ([]string, error) {
	files, err := s.repo.GetVaultFilesByUserID(userID)
	if err != nil {
		return nil, err
	}

	paths := make([]string, 0, len(files))
	for _, file := range files {
		paths = append(paths, file.Path)
	}

	return paths, nil
}

func (s *ServiceImpl) ReadVaultFile(userID uint, path string) (*VaultReadResponse, error) {
	file, err := s.repo.GetVaultFileByPath(userID, path)
	if err != nil {
		return nil, err
	}

	return &VaultReadResponse{
		Path:    file.Path,
		Content: string(file.Content),
	}, nil
}

func (s *ServiceImpl) WriteVaultFile(userID uint, req *VaultWriteRequest) error {
	// 检查文件是否存在
	existingFile, err := s.repo.GetVaultFileByPath(userID, req.Path)
	if err == nil {
		// 更新现有文件
		existingFile.Content = []byte(req.Content)
		existingFile.Size = int64(len(req.Content))
		return s.repo.UpdateVaultFile(existingFile)
	}

	// 创建新文件
	file := &VaultFile{
		Path:    filepath.Clean(req.Path),
		Content: []byte(req.Content),
		Size:    int64(len(req.Content)),
		UserID:  userID,
	}

	return s.repo.CreateVaultFile(file)
}

// Market operations
func (s *ServiceImpl) GetMarketItems() ([]*MarketItem, error) {
	if s.marketURL == "" {
		return []*MarketItem{}, nil
	}

	resp, err := http.Get(s.marketURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var items []*MarketItem
	if err := json.NewDecoder(resp.Body).Decode(&items); err != nil {
		return nil, err
	}

	return items, nil
}

// Event management
func (s *ServiceImpl) Broadcast(event *EventData) {
	s.eventHub.Broadcast(event)
}

func (s *ServiceImpl) Subscribe(ctx context.Context) <-chan *EventData {
	return s.eventHub.Subscribe(ctx)
}

// Helper methods
func (s *ServiceImpl) convertToPluginResponse(plugin *Plugin) *PluginResponse {
	permissions := make([]string, len(plugin.Permissions))
	for i, perm := range plugin.Permissions {
		permissions[i] = perm.Name
	}

	commands := make([]CommandResponse, len(plugin.Commands))
	for i, cmd := range plugin.Commands {
		commands[i] = CommandResponse{
			ID:        cmd.ID,
			CommandID: cmd.CommandID,
			PluginID:  cmd.PluginID,
			Title:     cmd.Title,
		}
	}

	return &PluginResponse{
		ID:          plugin.ID,
		PluginID:    plugin.PluginID,
		Name:        plugin.Name,
		Version:     plugin.Version,
		Author:      plugin.Author,
		Description: plugin.Description,
		Enabled:     plugin.Enabled,
		BackupPath:  plugin.BackupPath,
		Permissions: permissions,
		Commands:    commands,
		CreatedAt:   plugin.CreatedAt,
		UpdatedAt:   plugin.UpdatedAt,
	}
}

func (s *ServiceImpl) getInstallation(pluginID string) (*PluginInstallation, bool) {
	s.installMutex.RLock()
	defer s.installMutex.RUnlock()
	installation, exists := s.installations[pluginID]
	return installation, exists
}

func (s *ServiceImpl) downloadFile(url string) (string, error) {
	resp, err := http.Get(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	tempFile, err := os.CreateTemp("", "plugin-*.zip")
	if err != nil {
		return "", err
	}
	defer tempFile.Close()

	_, err = io.Copy(tempFile, resp.Body)
	if err != nil {
		os.Remove(tempFile.Name())
		return "", err
	}

	return tempFile.Name(), nil
}

func (s *ServiceImpl) verifyFile(filePath, expectedSHA256 string) error {
	file, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	hash := sha256.New()
	if _, err := io.Copy(hash, file); err != nil {
		return err
	}

	actualSHA256 := fmt.Sprintf("%x", hash.Sum(nil))
	if actualSHA256 != expectedSHA256 {
		return fmt.Errorf("SHA256 mismatch: expected %s, got %s", expectedSHA256, actualSHA256)
	}

	return nil
}

func (s *ServiceImpl) extractZip(src, dest string) error {
	r, err := zip.OpenReader(src)
	if err != nil {
		return err
	}
	defer r.Close()

	os.MkdirAll(dest, 0755)

	for _, f := range r.File {
		path := filepath.Join(dest, f.Name)

		// 安全检查，防止路径遍历攻击
		if !strings.HasPrefix(path, filepath.Clean(dest)+string(os.PathSeparator)) {
			continue
		}

		if f.FileInfo().IsDir() {
			os.MkdirAll(path, 0755)
			continue
		}

		if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
			return err
		}

		rc, err := f.Open()
		if err != nil {
			return err
		}

		outFile, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
		if err != nil {
			rc.Close()
			return err
		}

		_, err = io.Copy(outFile, rc)
		outFile.Close()
		rc.Close()

		if err != nil {
			return err
		}
	}

	return nil
}

func (s *ServiceImpl) loadPluginFromManifest(manifestPath string) error {
	manifestBytes, err := os.ReadFile(manifestPath)
	if err != nil {
		return err
	}

	var manifest map[string]interface{}
	if err := json.Unmarshal(manifestBytes, &manifest); err != nil {
		return err
	}

	pluginID := getStringFromMap(manifest, "id")
	name := getStringFromMap(manifest, "name")
	version := getStringFromMap(manifest, "version")
	author := getStringFromMap(manifest, "author")
	description := getStringFromMap(manifest, "description")

	if pluginID == "" || name == "" || version == "" {
		return fmt.Errorf("invalid manifest: missing required fields")
	}

	// 检查插件是否已存在
	existingPlugin, err := s.repo.GetPluginByID(pluginID)
	if err == nil && existingPlugin != nil {
		// 更新现有插件
		existingPlugin.Name = name
		existingPlugin.Version = version
		existingPlugin.Author = author
		existingPlugin.Description = description
		return s.repo.UpdatePlugin(existingPlugin)
	}

	// 创建新插件记录
	plugin := &Plugin{
		PluginID:    pluginID,
		Name:        name,
		Version:     version,
		Author:      author,
		Description: description,
		Enabled:     true,
	}

	if err := s.repo.CreatePlugin(plugin); err != nil {
		return err
	}

	// 处理权限
	if permissions, ok := manifest["permissions"].([]interface{}); ok {
		for _, perm := range permissions {
			if permStr, ok := perm.(string); ok {
				s.repo.AddPluginPermission(pluginID, permStr)
			}
		}
	}

	return nil
}

func getStringFromMap(m map[string]interface{}, key string) string {
	if val, ok := m[key]; ok {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return ""
}
