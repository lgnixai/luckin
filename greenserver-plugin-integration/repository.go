package plugin

import (
	"path/filepath"

	"gorm.io/gorm"
)

// Repository 插件存储库接口
type Repository interface {
	// Plugin operations
	CreatePlugin(plugin *Plugin) error
	GetPluginByID(pluginID string) (*Plugin, error)
	GetAllPlugins() ([]*Plugin, error)
	UpdatePlugin(plugin *Plugin) error
	DeletePlugin(pluginID string) error
	EnablePlugin(pluginID string) error
	DisablePlugin(pluginID string) error

	// Permission operations
	CreatePermission(permission *Permission) error
	GetPermissionByName(name string) (*Permission, error)
	GetAllPermissions() ([]*Permission, error)
	GetPluginPermissions(pluginID string) ([]string, error)
	AddPluginPermission(pluginID string, permissionName string) error
	RemovePluginPermission(pluginID string, permissionName string) error

	// Command operations
	CreateCommand(command *Command) error
	GetCommandsByPluginID(pluginID string) ([]*Command, error)
	GetAllCommands() ([]*Command, error)
	DeleteCommandsByPluginID(pluginID string) error

	// Installation operations
	CreateInstallation(installation *PluginInstallation) error
	GetInstallationByPluginID(pluginID string) (*PluginInstallation, error)
	UpdateInstallation(installation *PluginInstallation) error
	DeleteInstallation(pluginID string) error

	// Vault operations
	CreateVaultFile(file *VaultFile) error
	GetVaultFileByPath(userID uint, path string) (*VaultFile, error)
	GetVaultFilesByUserID(userID uint) ([]*VaultFile, error)
	UpdateVaultFile(file *VaultFile) error
	DeleteVaultFile(userID uint, path string) error
}

// RepositoryImpl 插件存储库实现
type RepositoryImpl struct {
	db *gorm.DB
}

// NewRepository 创建插件存储库实例
func NewRepository(db *gorm.DB) Repository {
	return &RepositoryImpl{db: db}
}

// Plugin operations
func (r *RepositoryImpl) CreatePlugin(plugin *Plugin) error {
	return r.db.Create(plugin).Error
}

func (r *RepositoryImpl) GetPluginByID(pluginID string) (*Plugin, error) {
	var plugin Plugin
	err := r.db.Preload("Permissions").Preload("Commands").
		Where("plugin_id = ?", pluginID).First(&plugin).Error
	if err != nil {
		return nil, err
	}
	return &plugin, nil
}

func (r *RepositoryImpl) GetAllPlugins() ([]*Plugin, error) {
	var plugins []*Plugin
	err := r.db.Preload("Permissions").Preload("Commands").Find(&plugins).Error
	return plugins, err
}

func (r *RepositoryImpl) UpdatePlugin(plugin *Plugin) error {
	return r.db.Save(plugin).Error
}

func (r *RepositoryImpl) DeletePlugin(pluginID string) error {
	return r.db.Where("plugin_id = ?", pluginID).Delete(&Plugin{}).Error
}

func (r *RepositoryImpl) EnablePlugin(pluginID string) error {
	return r.db.Model(&Plugin{}).Where("plugin_id = ?", pluginID).
		Update("enabled", true).Error
}

func (r *RepositoryImpl) DisablePlugin(pluginID string) error {
	return r.db.Model(&Plugin{}).Where("plugin_id = ?", pluginID).
		Update("enabled", false).Error
}

// Permission operations
func (r *RepositoryImpl) CreatePermission(permission *Permission) error {
	return r.db.Create(permission).Error
}

func (r *RepositoryImpl) GetPermissionByName(name string) (*Permission, error) {
	var permission Permission
	err := r.db.Where("name = ?", name).First(&permission).Error
	if err != nil {
		return nil, err
	}
	return &permission, nil
}

func (r *RepositoryImpl) GetAllPermissions() ([]*Permission, error) {
	var permissions []*Permission
	err := r.db.Find(&permissions).Error
	return permissions, err
}

func (r *RepositoryImpl) GetPluginPermissions(pluginID string) ([]string, error) {
	var plugin Plugin
	err := r.db.Preload("Permissions").Where("plugin_id = ?", pluginID).First(&plugin).Error
	if err != nil {
		return nil, err
	}

	permissions := make([]string, len(plugin.Permissions))
	for i, perm := range plugin.Permissions {
		permissions[i] = perm.Name
	}
	return permissions, nil
}

func (r *RepositoryImpl) AddPluginPermission(pluginID string, permissionName string) error {
	var plugin Plugin
	if err := r.db.Where("plugin_id = ?", pluginID).First(&plugin).Error; err != nil {
		return err
	}

	var permission Permission
	if err := r.db.Where("name = ?", permissionName).First(&permission).Error; err != nil {
		// 如果权限不存在，创建它
		permission = Permission{Name: permissionName}
		if err := r.db.Create(&permission).Error; err != nil {
			return err
		}
	}

	return r.db.Model(&plugin).Association("Permissions").Append(&permission)
}

func (r *RepositoryImpl) RemovePluginPermission(pluginID string, permissionName string) error {
	var plugin Plugin
	if err := r.db.Where("plugin_id = ?", pluginID).First(&plugin).Error; err != nil {
		return err
	}

	var permission Permission
	if err := r.db.Where("name = ?", permissionName).First(&permission).Error; err != nil {
		return err
	}

	return r.db.Model(&plugin).Association("Permissions").Delete(&permission)
}

// Command operations
func (r *RepositoryImpl) CreateCommand(command *Command) error {
	return r.db.Create(command).Error
}

func (r *RepositoryImpl) GetCommandsByPluginID(pluginID string) ([]*Command, error) {
	var commands []*Command
	err := r.db.Where("plugin_id = ?", pluginID).Find(&commands).Error
	return commands, err
}

func (r *RepositoryImpl) GetAllCommands() ([]*Command, error) {
	var commands []*Command
	err := r.db.Find(&commands).Error
	return commands, err
}

func (r *RepositoryImpl) DeleteCommandsByPluginID(pluginID string) error {
	return r.db.Where("plugin_id = ?", pluginID).Delete(&Command{}).Error
}

// Installation operations
func (r *RepositoryImpl) CreateInstallation(installation *PluginInstallation) error {
	return r.db.Create(installation).Error
}

func (r *RepositoryImpl) GetInstallationByPluginID(pluginID string) (*PluginInstallation, error) {
	var installation PluginInstallation
	err := r.db.Where("plugin_id = ?", pluginID).First(&installation).Error
	if err != nil {
		return nil, err
	}
	return &installation, nil
}

func (r *RepositoryImpl) UpdateInstallation(installation *PluginInstallation) error {
	return r.db.Save(installation).Error
}

func (r *RepositoryImpl) DeleteInstallation(pluginID string) error {
	return r.db.Where("plugin_id = ?", pluginID).Delete(&PluginInstallation{}).Error
}

// Vault operations
func (r *RepositoryImpl) CreateVaultFile(file *VaultFile) error {
	return r.db.Create(file).Error
}

func (r *RepositoryImpl) GetVaultFileByPath(userID uint, path string) (*VaultFile, error) {
	var file VaultFile
	err := r.db.Where("user_id = ? AND path = ?", userID, filepath.Clean(path)).First(&file).Error
	if err != nil {
		return nil, err
	}
	return &file, nil
}

func (r *RepositoryImpl) GetVaultFilesByUserID(userID uint) ([]*VaultFile, error) {
	var files []*VaultFile
	err := r.db.Where("user_id = ?", userID).Find(&files).Error
	return files, err
}

func (r *RepositoryImpl) UpdateVaultFile(file *VaultFile) error {
	return r.db.Save(file).Error
}

func (r *RepositoryImpl) DeleteVaultFile(userID uint, path string) error {
	return r.db.Where("user_id = ? AND path = ?", userID, filepath.Clean(path)).Delete(&VaultFile{}).Error
}
