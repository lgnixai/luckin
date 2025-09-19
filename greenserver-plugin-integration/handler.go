package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/lgnixai/wmcms/pkg/logger"
	"github.com/lgnixai/wmcms/pkg/response"
)

// Handler 插件处理器
type Handler struct {
	service    Service
	pluginsDir string
}

// NewHandler 创建插件处理器实例
func NewHandler(service Service, pluginsDir string) *Handler {
	return &Handler{
		service:    service,
		pluginsDir: pluginsDir,
	}
}

// GetPlugins 获取所有插件
// @Summary 获取所有插件
// @Description 获取系统中所有插件的列表
// @Tags 插件
// @Accept json
// @Produce json
// @Success 200 {array} PluginResponse
// @Router /plugins [get]
func (h *Handler) GetPlugins(c *gin.Context) {
	plugins, err := h.service.GetAllPlugins()
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "获取插件列表失败")
		return
	}

	response.Success(c, plugins)
}

// GetPlugin 获取单个插件
// @Summary 获取单个插件
// @Description 根据插件ID获取插件详细信息
// @Tags 插件
// @Accept json
// @Produce json
// @Param id path string true "插件ID"
// @Success 200 {object} PluginResponse
// @Router /plugins/{id} [get]
func (h *Handler) GetPlugin(c *gin.Context) {
	pluginID := c.Param("id")
	if pluginID == "" {
		response.Error(c, http.StatusBadRequest, "插件ID不能为空")
		return
	}

	plugin, err := h.service.GetPlugin(pluginID)
	if err != nil {
		response.Error(c, http.StatusNotFound, "插件不存在")
		return
	}

	response.Success(c, plugin)
}

// EnablePlugin 启用插件
// @Summary 启用插件
// @Description 启用指定的插件
// @Tags 插件
// @Accept json
// @Produce json
// @Param body body PluginToggleRequest true "插件ID"
// @Success 200 {object} response.Response
// @Router /plugins/enable [post]
func (h *Handler) EnablePlugin(c *gin.Context) {
	var req PluginToggleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "请求参数错误")
		return
	}

	if err := h.service.EnablePlugin(req.PluginID); err != nil {
		response.Error(c, http.StatusInternalServerError, "启用插件失败")
		return
	}

	response.Success(c, gin.H{"message": "插件已启用"})
}

// DisablePlugin 禁用插件
// @Summary 禁用插件
// @Description 禁用指定的插件
// @Tags 插件
// @Accept json
// @Produce json
// @Param body body PluginToggleRequest true "插件ID"
// @Success 200 {object} response.Response
// @Router /plugins/disable [post]
func (h *Handler) DisablePlugin(c *gin.Context) {
	var req PluginToggleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "请求参数错误")
		return
	}

	if err := h.service.DisablePlugin(req.PluginID); err != nil {
		response.Error(c, http.StatusInternalServerError, "禁用插件失败")
		return
	}

	response.Success(c, gin.H{"message": "插件已禁用"})
}

// BackupPlugin 备份插件
// @Summary 备份插件
// @Description 备份指定的插件到ZIP文件
// @Tags 插件
// @Accept json
// @Produce json
// @Param body body PluginBackupRequest true "插件ID"
// @Success 200 {object} response.Response
// @Router /plugins/backup [post]
func (h *Handler) BackupPlugin(c *gin.Context) {
	var req PluginBackupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "请求参数错误")
		return
	}

	backupPath, err := h.service.BackupPlugin(req.PluginID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "备份插件失败")
		return
	}

	response.Success(c, gin.H{
		"message":    "插件备份成功",
		"backupPath": backupPath,
	})
}

// InstallPlugin 安装插件
// @Summary 安装插件
// @Description 从URL安装插件
// @Tags 插件
// @Accept json
// @Produce json
// @Param body body PluginInstallRequest true "安装请求"
// @Success 200 {object} response.Response
// @Router /plugins/install [post]
func (h *Handler) InstallPlugin(c *gin.Context) {
	var req PluginInstallRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "请求参数错误")
		return
	}

	if err := h.service.InstallPlugin(&req); err != nil {
		response.Error(c, http.StatusInternalServerError, "安装插件失败")
		return
	}

	response.Success(c, gin.H{"message": "插件安装已开始"})
}

// UninstallPlugin 卸载插件
// @Summary 卸载插件
// @Description 卸载指定的插件
// @Tags 插件
// @Accept json
// @Produce json
// @Param id path string true "插件ID"
// @Success 200 {object} response.Response
// @Router /plugins/{id} [delete]
func (h *Handler) UninstallPlugin(c *gin.Context) {
	pluginID := c.Param("id")
	if pluginID == "" {
		response.Error(c, http.StatusBadRequest, "插件ID不能为空")
		return
	}

	if err := h.service.UninstallPlugin(pluginID); err != nil {
		response.Error(c, http.StatusInternalServerError, "卸载插件失败")
		return
	}

	response.Success(c, gin.H{"message": "插件已卸载"})
}

// GetInstallationStatus 获取安装状态
// @Summary 获取安装状态
// @Description 获取插件的安装状态
// @Tags 插件
// @Accept json
// @Produce json
// @Param id path string true "插件ID"
// @Success 200 {object} InstallationStatusResponse
// @Router /plugins/{id}/installation-status [get]
func (h *Handler) GetInstallationStatus(c *gin.Context) {
	pluginID := c.Param("id")
	if pluginID == "" {
		response.Error(c, http.StatusBadRequest, "插件ID不能为空")
		return
	}

	status, err := h.service.GetInstallationStatus(pluginID)
	if err != nil {
		response.Error(c, http.StatusNotFound, "安装状态不存在")
		return
	}

	response.Success(c, status)
}

// GetCommands 获取所有命令
// @Summary 获取所有命令
// @Description 获取系统中所有插件注册的命令
// @Tags 插件
// @Accept json
// @Produce json
// @Success 200 {array} CommandResponse
// @Router /plugins/commands [get]
func (h *Handler) GetCommands(c *gin.Context) {
	commands, err := h.service.GetAllCommands()
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "获取命令列表失败")
		return
	}

	response.Success(c, commands)
}

// GetMarketItems 获取市场插件
// @Summary 获取市场插件
// @Description 获取插件市场中的所有插件
// @Tags 插件
// @Accept json
// @Produce json
// @Success 200 {array} MarketItem
// @Router /plugins/market [get]
func (h *Handler) GetMarketItems(c *gin.Context) {
	items, err := h.service.GetMarketItems()
	if err != nil {
		response.Error(c, http.StatusBadGateway, "获取市场插件失败")
		return
	}

	response.Success(c, items)
}

// HandleRPC 处理JSON-RPC请求
// @Summary 处理JSON-RPC请求
// @Description 处理插件的JSON-RPC API调用
// @Tags 插件
// @Accept json
// @Produce json
// @Param body body RPCRequest true "RPC请求"
// @Success 200 {object} RPCResponse
// @Router /plugins/rpc [post]
func (h *Handler) HandleRPC(c *gin.Context) {
	var req RPCRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.writeRPCError(c, req.ID, 400, "invalid json")
		return
	}

	switch req.Method {
	case "host.getPlugins":
		plugins, err := h.service.GetAllPlugins()
		if err != nil {
			h.writeRPCError(c, req.ID, 500, err.Error())
			return
		}
		h.writeRPCResult(c, req.ID, plugins)

	case "vault.list":
		if !h.hasPermission(req.PluginID, "vault.read") {
			h.writeRPCError(c, req.ID, 403, "missing permission: vault.read")
			return
		}

		userID := h.getUserID(c)
		if userID == 0 {
			h.writeRPCError(c, req.ID, 401, "unauthorized")
			return
		}

		paths, err := h.service.ListVaultFiles(userID)
		if err != nil {
			h.writeRPCError(c, req.ID, 500, err.Error())
			return
		}
		h.writeRPCResult(c, req.ID, paths)

	case "vault.read":
		if !h.hasPermission(req.PluginID, "vault.read") {
			h.writeRPCError(c, req.ID, 403, "missing permission: vault.read")
			return
		}

		userID := h.getUserID(c)
		if userID == 0 {
			h.writeRPCError(c, req.ID, 401, "unauthorized")
			return
		}

		var params struct {
			Path string `json:"path"`
		}
		if err := h.parseParams(req.Params, &params); err != nil || params.Path == "" {
			h.writeRPCError(c, req.ID, 400, "missing path")
			return
		}

		result, err := h.service.ReadVaultFile(userID, params.Path)
		if err != nil {
			h.writeRPCError(c, req.ID, 404, err.Error())
			return
		}
		h.writeRPCResult(c, req.ID, result)

	case "vault.write":
		if !h.hasPermission(req.PluginID, "vault.write") {
			h.writeRPCError(c, req.ID, 403, "missing permission: vault.write")
			return
		}

		userID := h.getUserID(c)
		if userID == 0 {
			h.writeRPCError(c, req.ID, 401, "unauthorized")
			return
		}

		var params VaultWriteRequest
		if err := h.parseParams(req.Params, &params); err != nil || params.Path == "" {
			h.writeRPCError(c, req.ID, 400, "missing params")
			return
		}

		if err := h.service.WriteVaultFile(userID, &params); err != nil {
			h.writeRPCError(c, req.ID, 500, err.Error())
			return
		}
		h.writeRPCResult(c, req.ID, VaultWriteResponse{Ok: true})

	case "commands.register":
		if !h.hasPermission(req.PluginID, "commands.register") {
			h.writeRPCError(c, req.ID, 403, "missing permission: commands.register")
			return
		}

		var params CommandRegisterRequest
		if err := h.parseParams(req.Params, &params); err != nil || params.ID == "" || params.Title == "" {
			h.writeRPCError(c, req.ID, 400, "missing params")
			return
		}

		if err := h.service.RegisterCommand(req.PluginID, &params); err != nil {
			h.writeRPCError(c, req.ID, 500, err.Error())
			return
		}
		h.writeRPCResult(c, req.ID, gin.H{"ok": true})

	case "commands.list":
		commands, err := h.service.GetAllCommands()
		if err != nil {
			h.writeRPCError(c, req.ID, 500, err.Error())
			return
		}
		h.writeRPCResult(c, req.ID, commands)

	case "commands.invoke":
		var params CommandInvokeRequest
		if err := h.parseParams(req.Params, &params); err != nil || params.ID == "" || req.PluginID == "" {
			h.writeRPCError(c, req.ID, 400, "missing params")
			return
		}

		if err := h.service.InvokeCommand(req.PluginID, params.ID); err != nil {
			h.writeRPCError(c, req.ID, 500, err.Error())
			return
		}
		h.writeRPCResult(c, req.ID, gin.H{"ok": true})

	case "host.getInstallationStatus":
		var params struct {
			PluginID string `json:"pluginId"`
		}
		if err := h.parseParams(req.Params, &params); err != nil || params.PluginID == "" {
			h.writeRPCError(c, req.ID, 400, "missing pluginId")
			return
		}

		status, err := h.service.GetInstallationStatus(params.PluginID)
		if err != nil {
			h.writeRPCResult(c, req.ID, nil)
			return
		}
		h.writeRPCResult(c, req.ID, status)

	case "host.enablePlugin":
		var params PluginToggleRequest
		if err := h.parseParams(req.Params, &params); err != nil || params.PluginID == "" {
			h.writeRPCError(c, req.ID, 400, "missing pluginId")
			return
		}

		if err := h.service.EnablePlugin(params.PluginID); err != nil {
			h.writeRPCError(c, req.ID, 404, err.Error())
			return
		}
		h.writeRPCResult(c, req.ID, gin.H{"ok": true})

	case "host.disablePlugin":
		var params PluginToggleRequest
		if err := h.parseParams(req.Params, &params); err != nil || params.PluginID == "" {
			h.writeRPCError(c, req.ID, 400, "missing pluginId")
			return
		}

		if err := h.service.DisablePlugin(params.PluginID); err != nil {
			h.writeRPCError(c, req.ID, 404, err.Error())
			return
		}
		h.writeRPCResult(c, req.ID, gin.H{"ok": true})

	case "host.backupPlugin":
		var params PluginBackupRequest
		if err := h.parseParams(req.Params, &params); err != nil || params.PluginID == "" {
			h.writeRPCError(c, req.ID, 400, "missing pluginId")
			return
		}

		backupPath, err := h.service.BackupPlugin(params.PluginID)
		if err != nil {
			h.writeRPCError(c, req.ID, 500, err.Error())
			return
		}
		h.writeRPCResult(c, req.ID, gin.H{"backupPath": backupPath})

	default:
		h.writeRPCError(c, req.ID, 404, "unknown method")
	}
}

// HandleSSE 处理Server-Sent Events
// @Summary 处理Server-Sent Events
// @Description 建立SSE连接以接收插件事件
// @Tags 插件
// @Accept text/plain
// @Produce text/plain
// @Success 200 {string} string "event stream"
// @Router /plugins/events [get]
func (h *Handler) HandleSSE(c *gin.Context) {
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Access-Control-Allow-Origin", "*")

	ctx, cancel := context.WithCancel(c.Request.Context())
	defer cancel()

	eventCh := h.service.Subscribe(ctx)
	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		response.Error(c, http.StatusInternalServerError, "Streaming not supported")
		return
	}

	// 发送初始连接事件
	fmt.Fprintf(c.Writer, "data: %s\n\n", `{"type":"connected","data":{}}`)
	flusher.Flush()

	for {
		select {
		case event, ok := <-eventCh:
			if !ok {
				return
			}

			eventJSON, err := json.Marshal(event)
			if err != nil {
				logger.Error("Failed to marshal event", err)
				continue
			}

			fmt.Fprintf(c.Writer, "data: %s\n\n", eventJSON)
			flusher.Flush()

		case <-ctx.Done():
			return
		}
	}
}

// ServePluginAssets 提供插件静态资源
func (h *Handler) ServePluginAssets(c *gin.Context) {
	pluginID := c.Param("pluginID")
	assetPath := c.Param("filepath")

	if pluginID == "" || assetPath == "" {
		c.AbortWithStatus(http.StatusNotFound)
		return
	}

	fullPath := filepath.Join(h.pluginsDir, pluginID, assetPath)
	c.File(fullPath)
}

// Helper methods
func (h *Handler) hasPermission(pluginID, permission string) bool {
	if pluginID == "" {
		return false
	}
	return h.service.HasPermission(pluginID, permission)
}

func (h *Handler) getUserID(c *gin.Context) uint {
	if userID, exists := c.Get("userID"); exists {
		if id, ok := userID.(uint); ok {
			return id
		}
		if idStr, ok := userID.(string); ok {
			if id, err := strconv.ParseUint(idStr, 10, 32); err == nil {
				return uint(id)
			}
		}
	}
	return 0
}

func (h *Handler) parseParams(params interface{}, target interface{}) error {
	if params == nil {
		return fmt.Errorf("params is nil")
	}

	// 将params转换为JSON字节
	jsonBytes, err := json.Marshal(params)
	if err != nil {
		return err
	}

	// 解析到目标结构
	return json.Unmarshal(jsonBytes, target)
}

func (h *Handler) writeRPCResult(c *gin.Context, id string, result interface{}) {
	c.JSON(http.StatusOK, RPCResponse{ID: id, Result: result})
}

func (h *Handler) writeRPCError(c *gin.Context, id string, code int, message string) {
	httpStatus := h.httpStatusForCode(code)
	c.JSON(httpStatus, RPCResponse{
		ID: id,
		Error: &RPCError{
			Code:    code,
			Message: message,
		},
	})
}

func (h *Handler) httpStatusForCode(code int) int {
	switch code {
	case 400:
		return http.StatusBadRequest
	case 401:
		return http.StatusUnauthorized
	case 403:
		return http.StatusForbidden
	case 404:
		return http.StatusNotFound
	default:
		return http.StatusInternalServerError
	}
}
