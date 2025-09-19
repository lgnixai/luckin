package migrations

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// CreatePluginTables 创建插件相关表
func CreatePluginTables() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "20241220000007_create_plugin_tables",
		Migrate: func(tx *gorm.DB) error {
			// 创建权限表
			if err := tx.Exec(`
				CREATE TABLE IF NOT EXISTS permissions (
					id SERIAL PRIMARY KEY,
					name VARCHAR(255) UNIQUE NOT NULL,
					description TEXT,
					created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					deleted_at TIMESTAMP NULL
				)
			`).Error; err != nil {
				return err
			}

			// 创建插件表
			if err := tx.Exec(`
				CREATE TABLE IF NOT EXISTS plugins (
					id SERIAL PRIMARY KEY,
					plugin_id VARCHAR(255) UNIQUE NOT NULL,
					name VARCHAR(255) NOT NULL,
					version VARCHAR(50) NOT NULL,
					author VARCHAR(255),
					description TEXT,
					enabled BOOLEAN DEFAULT TRUE,
					backup_path TEXT,
					created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					deleted_at TIMESTAMP NULL
				)
			`).Error; err != nil {
				return err
			}

			// 创建插件权限关联表
			if err := tx.Exec(`
				CREATE TABLE IF NOT EXISTS plugin_permissions (
					plugin_id INTEGER REFERENCES plugins(id) ON DELETE CASCADE,
					permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
					PRIMARY KEY (plugin_id, permission_id)
				)
			`).Error; err != nil {
				return err
			}

			// 创建命令表
			if err := tx.Exec(`
				CREATE TABLE IF NOT EXISTS commands (
					id SERIAL PRIMARY KEY,
					command_id VARCHAR(255) NOT NULL,
					plugin_id VARCHAR(255) NOT NULL,
					title VARCHAR(255) NOT NULL,
					description TEXT,
					created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					deleted_at TIMESTAMP NULL
				)
			`).Error; err != nil {
				return err
			}

			// 创建插件安装记录表
			if err := tx.Exec(`
				CREATE TABLE IF NOT EXISTS plugin_installations (
					id SERIAL PRIMARY KEY,
					plugin_id VARCHAR(255) NOT NULL,
					status VARCHAR(50) DEFAULT 'pending',
					progress INTEGER DEFAULT 0,
					message TEXT,
					source_url TEXT,
					sha256 VARCHAR(64),
					installed_at TIMESTAMP NULL,
					created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					deleted_at TIMESTAMP NULL
				)
			`).Error; err != nil {
				return err
			}

			// 创建存储库文件表
			if err := tx.Exec(`
				CREATE TABLE IF NOT EXISTS vault_files (
					id SERIAL PRIMARY KEY,
					path VARCHAR(1000) NOT NULL,
					content BYTEA,
					mime_type VARCHAR(255),
					size BIGINT DEFAULT 0,
					user_id INTEGER NOT NULL,
					created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
					deleted_at TIMESTAMP NULL,
					UNIQUE(user_id, path)
				)
			`).Error; err != nil {
				return err
			}

			// 创建索引
			if err := tx.Exec(`CREATE INDEX IF NOT EXISTS idx_plugins_plugin_id ON plugins(plugin_id)`).Error; err != nil {
				return err
			}

			if err := tx.Exec(`CREATE INDEX IF NOT EXISTS idx_plugins_enabled ON plugins(enabled)`).Error; err != nil {
				return err
			}

			if err := tx.Exec(`CREATE INDEX IF NOT EXISTS idx_commands_plugin_id ON commands(plugin_id)`).Error; err != nil {
				return err
			}

			if err := tx.Exec(`CREATE INDEX IF NOT EXISTS idx_plugin_installations_plugin_id ON plugin_installations(plugin_id)`).Error; err != nil {
				return err
			}

			if err := tx.Exec(`CREATE INDEX IF NOT EXISTS idx_plugin_installations_status ON plugin_installations(status)`).Error; err != nil {
				return err
			}

			if err := tx.Exec(`CREATE INDEX IF NOT EXISTS idx_vault_files_user_id ON vault_files(user_id)`).Error; err != nil {
				return err
			}

			if err := tx.Exec(`CREATE INDEX IF NOT EXISTS idx_vault_files_path ON vault_files(path)`).Error; err != nil {
				return err
			}

			// 插入默认权限
			defaultPermissions := []string{
				"vault.read",
				"vault.write",
				"commands.register",
				"commands.invoke",
				"ui.show",
				"notifications.send",
			}

			for _, perm := range defaultPermissions {
				if err := tx.Exec(`
					INSERT INTO permissions (name, description) 
					VALUES (?, ?) 
					ON CONFLICT (name) DO NOTHING
				`, perm, "Default permission: "+perm).Error; err != nil {
					return err
				}
			}

			return nil
		},
		Rollback: func(tx *gorm.DB) error {
			// 删除表的顺序很重要，先删除有外键约束的表
			tables := []string{
				"vault_files",
				"plugin_installations",
				"commands",
				"plugin_permissions",
				"plugins",
				"permissions",
			}

			for _, table := range tables {
				if err := tx.Exec("DROP TABLE IF EXISTS " + table + " CASCADE").Error; err != nil {
					return err
				}
			}

			return nil
		},
	}
}
