package host

import (
    "crypto/sha256"
    "encoding/hex"
    "fmt"
    "net/url"
    "path/filepath"
    "regexp"
    "strings"
    "time"
)

// SecurityConfig 定义安全配置
type SecurityConfig struct {
    MaxPluginSize         int64         `json:"maxPluginSize"`         // 最大插件大小（字节）
    AllowedDomains        []string      `json:"allowedDomains"`        // 允许的下载域名
    InstallTimeout        time.Duration `json:"installTimeout"`       // 安装超时时间
    RequireSignature      bool          `json:"requireSignature"`     // 是否要求签名验证
    AllowLocalInstall     bool          `json:"allowLocalInstall"`    // 是否允许本地安装
    MaxConcurrentInstalls int           `json:"maxConcurrentInstalls"` // 最大并发安装数
}

// DefaultSecurityConfig 返回默认安全配置
func DefaultSecurityConfig() SecurityConfig {
    return SecurityConfig{
        MaxPluginSize:         10 * 1024 * 1024, // 10MB
        AllowedDomains:        []string{"github.com", "raw.githubusercontent.com", "localhost", "127.0.0.1"},
        InstallTimeout:        30 * time.Second,
        RequireSignature:      false, // 开发环境禁用签名要求
        AllowLocalInstall:     true,
        MaxConcurrentInstalls: 3,
    }
}

// PluginValidator 插件验证器
type PluginValidator struct {
    config SecurityConfig
}

// NewPluginValidator 创建新的插件验证器
func NewPluginValidator(config SecurityConfig) *PluginValidator {
    return &PluginValidator{config: config}
}

// ValidationError 验证错误
type ValidationError struct {
    Field   string `json:"field"`
    Message string `json:"message"`
    Code    string `json:"code"`
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation error in %s: %s", e.Field, e.Message)
}

// ValidationResult 验证结果
type ValidationResult struct {
    Valid  bool              `json:"valid"`
    Errors []ValidationError `json:"errors"`
}

// ValidateInstallRequest 验证安装请求
func (v *PluginValidator) ValidateInstallRequest(id, downloadURL, sha256Hash string) *ValidationResult {
    result := &ValidationResult{Valid: true, Errors: []ValidationError{}}

    // 验证插件ID
    if err := v.validatePluginID(id); err != nil {
        result.Valid = false
        result.Errors = append(result.Errors, *err)
    }

    // 验证下载URL
    if err := v.validateDownloadURL(downloadURL); err != nil {
        result.Valid = false
        result.Errors = append(result.Errors, *err)
    }

    // 验证SHA256哈希（仅在要求签名时）
    if v.config.RequireSignature && sha256Hash != "" {
        if err := v.validateSHA256(sha256Hash); err != nil {
            result.Valid = false
            result.Errors = append(result.Errors, *err)
        }
    }

    return result
}

// validatePluginID 验证插件ID格式
func (v *PluginValidator) validatePluginID(id string) *ValidationError {
    if id == "" {
        return &ValidationError{
            Field:   "id",
            Message: "插件ID不能为空",
            Code:    "EMPTY_ID",
        }
    }

    // 插件ID只能包含字母、数字、连字符和下划线
    if matched, _ := regexp.MatchString(`^[a-zA-Z0-9_-]+$`, id); !matched {
        return &ValidationError{
            Field:   "id",
            Message: "插件ID只能包含字母、数字、连字符和下划线",
            Code:    "INVALID_ID_FORMAT",
        }
    }

    // 长度限制
    if len(id) > 50 {
        return &ValidationError{
            Field:   "id",
            Message: "插件ID长度不能超过50个字符",
            Code:    "ID_TOO_LONG",
        }
    }

    return nil
}

// validateDownloadURL 验证下载URL
func (v *PluginValidator) validateDownloadURL(downloadURL string) *ValidationError {
    if downloadURL == "" {
        return &ValidationError{
            Field:   "url",
            Message: "下载URL不能为空",
            Code:    "EMPTY_URL",
        }
    }

    // 解析URL
    parsedURL, err := url.Parse(downloadURL)
    if err != nil {
        return &ValidationError{
            Field:   "url",
            Message: "无效的URL格式",
            Code:    "INVALID_URL",
        }
    }

    // 只允许HTTPS（本地开发时允许HTTP localhost）
    hostname := parsedURL.Hostname()
    if parsedURL.Scheme != "https" && !(parsedURL.Scheme == "http" && (hostname == "localhost" || hostname == "127.0.0.1")) {
        return &ValidationError{
            Field:   "url",
            Message: "只允许HTTPS协议的下载链接（本地开发除外）",
            Code:    "INSECURE_PROTOCOL",
        }
    }

    // 检查域名白名单
    if len(v.config.AllowedDomains) > 0 {
        allowed := false
        for _, domain := range v.config.AllowedDomains {
            if strings.HasSuffix(hostname, domain) || hostname == domain {
                allowed = true
                break
            }
        }
        if !allowed {
            return &ValidationError{
                Field:   "url",
                Message: fmt.Sprintf("域名 %s 不在允许的域名列表中", hostname),
                Code:    "DOMAIN_NOT_ALLOWED",
            }
        }
    }

    return nil
}

// validateSHA256 验证SHA256哈希
func (v *PluginValidator) validateSHA256(hash string) *ValidationError {
    // 如果不要求签名，则允许空哈希
    if !v.config.RequireSignature && hash == "" {
        return nil
    }
    
    if hash == "" {
        return &ValidationError{
            Field:   "sha256",
            Message: "SHA256哈希不能为空",
            Code:    "EMPTY_HASH",
        }
    }

    // 检查哈希格式
    if matched, _ := regexp.MatchString(`^[a-fA-F0-9]{64}$`, hash); !matched {
        return &ValidationError{
            Field:   "sha256",
            Message: "无效的SHA256哈希格式",
            Code:    "INVALID_HASH_FORMAT",
        }
    }

    return nil
}

// ValidateManifest 验证插件清单
func (v *PluginValidator) ValidateManifest(manifest *Manifest) *ValidationResult {
    result := &ValidationResult{Valid: true, Errors: []ValidationError{}}

    // 验证基本字段
    if manifest.ID == "" {
        result.Valid = false
        result.Errors = append(result.Errors, ValidationError{
            Field:   "manifest.id",
            Message: "清单中的ID不能为空",
            Code:    "EMPTY_MANIFEST_ID",
        })
    }

    if manifest.Name == "" {
        result.Valid = false
        result.Errors = append(result.Errors, ValidationError{
            Field:   "manifest.name",
            Message: "清单中的名称不能为空",
            Code:    "EMPTY_MANIFEST_NAME",
        })
    }

    if manifest.Version == "" {
        result.Valid = false
        result.Errors = append(result.Errors, ValidationError{
            Field:   "manifest.version",
            Message: "清单中的版本不能为空",
            Code:    "EMPTY_MANIFEST_VERSION",
        })
    }

    // 验证版本格式（简单的语义版本检查）
    if manifest.Version != "" {
        if matched, _ := regexp.MatchString(`^\d+\.\d+\.\d+`, manifest.Version); !matched {
            result.Valid = false
            result.Errors = append(result.Errors, ValidationError{
                Field:   "manifest.version",
                Message: "版本格式应为 x.y.z 格式",
                Code:    "INVALID_VERSION_FORMAT",
            })
        }
    }

    // 验证权限
    if len(manifest.Permissions) > 10 {
        result.Valid = false
        result.Errors = append(result.Errors, ValidationError{
            Field:   "manifest.permissions",
            Message: "权限数量不能超过10个",
            Code:    "TOO_MANY_PERMISSIONS",
        })
    }

    return result
}

// VerifyFileIntegrity 验证文件完整性
func (v *PluginValidator) VerifyFileIntegrity(data []byte, expectedHash string) error {
    if expectedHash == "" {
        if v.config.RequireSignature {
            return fmt.Errorf("需要提供SHA256哈希进行完整性验证")
        }
        return nil
    }

    // 计算文件哈希
    hasher := sha256.New()
    hasher.Write(data)
    actualHash := hex.EncodeToString(hasher.Sum(nil))

    // 比较哈希
    if !strings.EqualFold(actualHash, expectedHash) {
        return fmt.Errorf("文件完整性验证失败: 期望 %s, 实际 %s", expectedHash, actualHash)
    }

    return nil
}

// CheckPluginSize 检查插件大小
func (v *PluginValidator) CheckPluginSize(size int64) error {
    if size > v.config.MaxPluginSize {
        return fmt.Errorf("插件大小 %d 字节超过限制 %d 字节", size, v.config.MaxPluginSize)
    }
    return nil
}

// SanitizePluginPath 清理插件路径，防止路径遍历攻击
func (v *PluginValidator) SanitizePluginPath(pluginID, path string) (string, error) {
    // 清理路径
    cleanPath := filepath.Clean(path)
    
    // 检查路径遍历
    if strings.Contains(cleanPath, "..") {
        return "", fmt.Errorf("路径包含非法的路径遍历字符: %s", path)
    }

    // 确保路径在插件目录内
    if !strings.HasPrefix(cleanPath, pluginID) {
        return "", fmt.Errorf("路径必须在插件目录内: %s", path)
    }

    return cleanPath, nil
}

// InstallationContext 安装上下文，用于跟踪安装状态
type InstallationContext struct {
    PluginID  string    `json:"pluginId"`
    Status    string    `json:"status"`
    StartTime time.Time `json:"startTime"`
    Error     string    `json:"error,omitempty"`
}

// InstallationManager 安装管理器
type InstallationManager struct {
    installations map[string]*InstallationContext
    maxConcurrent int
}

// NewInstallationManager 创建新的安装管理器
func NewInstallationManager(maxConcurrent int) *InstallationManager {
    return &InstallationManager{
        installations: make(map[string]*InstallationContext),
        maxConcurrent: maxConcurrent,
    }
}

// StartInstallation 开始安装
func (im *InstallationManager) StartInstallation(pluginID string) error {
    // 检查是否超过最大并发数
    activeCount := 0
    for _, ctx := range im.installations {
        if ctx.Status == "installing" {
            activeCount++
        }
    }

    if activeCount >= im.maxConcurrent {
        return fmt.Errorf("已达到最大并发安装数 %d", im.maxConcurrent)
    }

    // 检查是否已在安装中
    if ctx, exists := im.installations[pluginID]; exists && ctx.Status == "installing" {
        return fmt.Errorf("插件 %s 正在安装中", pluginID)
    }

    // 创建安装上下文
    im.installations[pluginID] = &InstallationContext{
        PluginID:  pluginID,
        Status:    "installing",
        StartTime: time.Now(),
    }

    return nil
}

// CompleteInstallation 完成安装
func (im *InstallationManager) CompleteInstallation(pluginID string, err error) {
    ctx, exists := im.installations[pluginID]
    if !exists {
        return
    }

    if err != nil {
        ctx.Status = "failed"
        ctx.Error = err.Error()
    } else {
        ctx.Status = "completed"
    }
}

// GetInstallationStatus 获取安装状态
func (im *InstallationManager) GetInstallationStatus(pluginID string) *InstallationContext {
    return im.installations[pluginID]
}

// CleanupOldInstallations 清理旧的安装记录
func (im *InstallationManager) CleanupOldInstallations(maxAge time.Duration) {
    cutoff := time.Now().Add(-maxAge)
    for id, ctx := range im.installations {
        if ctx.StartTime.Before(cutoff) && ctx.Status != "installing" {
            delete(im.installations, id)
        }
    }
}
