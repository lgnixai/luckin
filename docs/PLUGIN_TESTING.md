# 🧪 插件MCP自动化测试系统

本文档介绍如何使用Luckin IDE的插件MCP（Model Context Protocol）自动化测试系统。

## 🚀 快速开始

### 1. 运行单次测试

测试所有插件：
```bash
pnpm test:plugins
```

### 2. 开启监听模式

在开发过程中自动监听插件文件变化并运行测试：
```bash
pnpm test:plugins:watch
```

这将：
- 👀 监听 `plugins/` 目录下的所有文件变化
- 🔧 监听关键的渲染器文件变化
- ⚡ 文件变化后自动运行相关测试
- 📊 生成详细的测试报告

## 📋 测试内容

每个插件会进行以下测试：

### 1. URL可访问性测试
- ✅ 检查插件URL是否返回200状态码
- 🌐 验证HTTP响应正常

### 2. HTML内容加载测试
- 📄 验证页面标题是否存在
- 📝 检查页面内容是否正确加载

### 3. RPC通信测试
- 🔌 检查插件是否正确发送RPC调用
- 💬 验证消息通信机制

### 4. 交互功能测试
- 🖱️ 测试按钮点击功能
- ⚡ 验证交互是否触发RPC调用

### 5. 性能测试
- 📈 检查JS堆内存使用
- 🏃 验证DOM节点数量
- ⚡ 确保性能在合理范围内

## 📊 测试报告

测试完成后会生成详细报告：

### 控制台输出
```
🧪 测试插件: Hello World 扩展 (hello-world)
   📡 测试URL访问: http://localhost:3001/plugins/hello-world/index.html
   📄 测试HTML内容加载
   🔌 测试RPC通信功能
   ⚙️  测试插件特定功能
   ⚡ 性能测试

============================================================
📊 MCP插件测试报告
============================================================
总插件数: 3
✅ 成功: 2
❌ 失败: 1
📈 成功率: 67%
```

### JSON报告
详细的JSON报告保存在 `test-results/mcp-plugin-test-report.json`：

```json
{
  "timestamp": "2025-09-19T12:00:00.000Z",
  "summary": {
    "totalPlugins": 3,
    "successfulPlugins": 2,
    "failedPlugins": 1,
    "successRate": 67
  },
  "results": [
    {
      "pluginId": "hello-world",
      "pluginName": "Hello World 扩展",
      "tests": [
        {
          "name": "URL可访问性",
          "success": true,
          "details": "HTTP 200"
        }
      ],
      "success": true,
      "errors": []
    }
  ]
}
```

## 🔧 配置选项

### 测试脚本配置

在 `scripts/test-plugins-mcp.js` 中可以修改：

```javascript
class PluginMCPTester {
  constructor() {
    this.baseUrl = 'http://localhost:3001'; // 开发服务器地址
    this.pluginsDir = path.join(__dirname, '../plugins');
    this.testResults = [];
  }
}
```

### 性能限制

可以调整性能测试的限制：

```javascript
const performanceTest = {
  name: '性能指标',
  success: performanceMetrics.JSHeapUsedSize < 50 * 1024 * 1024, // 50MB限制
  details: `JS堆使用: ${Math.round(performanceMetrics.JSHeapUsedSize / 1024 / 1024)}MB`
};
```

## 🎯 CI/CD集成

### GitHub Actions

项目已配置自动化CI/CD流程：

- 📝 **触发条件**: 推送到main分支或PR时，且修改了插件相关文件
- 🧪 **测试矩阵**: Node.js 18.x 和 20.x
- 📊 **自动报告**: 测试结果自动评论到PR
- 📁 **结果存档**: 测试报告保存30天

### 手动触发

可以在GitHub Actions页面手动触发测试：
1. 前往项目的Actions页面
2. 选择"Plugin MCP Tests"工作流
3. 点击"Run workflow"

## 🐛 故障排除

### 常见问题

1. **开发服务器未运行**
   ```
   ❌ 开发服务器未运行，请先启动: pnpm dev
   ```
   解决方案：确保运行 `pnpm dev` 启动开发服务器

2. **端口不匹配**
   - 检查 `scripts/test-plugins-mcp.js` 中的 `baseUrl`
   - 确保与实际开发服务器端口一致

3. **插件文件不存在**
   ```
   ⚠️  无法解析插件 theme-dracula 的manifest.json
   ```
   解决方案：确保插件目录包含 `manifest.json` 和 `index.html`

4. **Puppeteer启动失败**
   ```bash
   # 在Linux/CI环境中可能需要额外依赖
   sudo apt-get install -y libnss3 libatk-bridge2.0-0 libdrm2 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libxss1 libasound2
   ```

### 调试模式

启用Puppeteer的调试模式：

```javascript
browser = await puppeteer.launch({ 
  headless: false, // 显示浏览器界面
  devtools: true,  // 打开开发者工具
  slowMo: 250     // 减慢操作速度
});
```

## 📚 最佳实践

### 插件开发

1. **确保HTML结构完整**
   - 包含有意义的 `<title>`
   - 有实际的页面内容

2. **实现RPC通信**
   - 正确发送初始化消息
   - 响应宿主的通信

3. **添加交互元素**
   - 包含可点击的按钮
   - 实现事件处理

4. **性能优化**
   - 控制内存使用
   - 减少DOM节点数量

### 测试编写

1. **添加自定义测试**
   - 在 `testPlugin()` 方法中添加特定测试
   - 根据插件功能定制测试逻辑

2. **扩展测试覆盖**
   - 添加API调用测试
   - 增加错误处理测试

## 🔄 持续改进

这个测试系统会持续改进，欢迎提出建议：

- 🎯 添加更多测试场景
- 📊 改进报告格式
- 🚀 优化测试性能
- 🔧 增加配置选项

---

**💡 提示**: 在开发插件时，建议同时运行 `pnpm dev` 和 `pnpm test:plugins:watch` 来获得最佳的开发体验！
