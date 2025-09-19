package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/lgnixai/wmcms/app/plugin"
	"github.com/lgnixai/wmcms/middleware"
)

// RegisterPluginRoutes 注册插件相关路由
func RegisterPluginRoutes(v1 *gin.RouterGroup, pluginHandler *plugin.Handler, pluginService plugin.Service) {
	// 插件管理路由组
	pluginGroup := v1.Group("/plugins")

	// 公共路由（不需要认证）
	pluginGroup.GET("", pluginHandler.GetPlugins)            // 获取所有插件
	pluginGroup.GET("/:id", pluginHandler.GetPlugin)         // 获取单个插件
	pluginGroup.GET("/market", pluginHandler.GetMarketItems) // 获取市场插件
	pluginGroup.GET("/commands", pluginHandler.GetCommands)  // 获取所有命令

	// RPC和事件路由（支持跨域）
	pluginGroup.POST("/rpc", pluginHandler.HandleRPC)   // JSON-RPC API
	pluginGroup.GET("/events", pluginHandler.HandleSSE) // Server-Sent Events

	// 静态资源服务
	pluginGroup.GET("/assets/:pluginID/*filepath", pluginHandler.ServePluginAssets)

	// 需要认证的路由
	authGroup := pluginGroup.Group("")
	authGroup.Use(middleware.CombinedAuth(nil)) // 支持JWT和API Key认证
	{
		// 插件管理
		authGroup.POST("/install", pluginHandler.InstallPlugin) // 安装插件
		authGroup.DELETE("/:id", pluginHandler.UninstallPlugin) // 卸载插件
		authGroup.POST("/enable", pluginHandler.EnablePlugin)   // 启用插件
		authGroup.POST("/disable", pluginHandler.DisablePlugin) // 禁用插件
		authGroup.POST("/backup", pluginHandler.BackupPlugin)   // 备份插件

		// 安装状态
		authGroup.GET("/:id/installation-status", pluginHandler.GetInstallationStatus) // 获取安装状态
	}
}
