#!/usr/bin/env node

/**
 * 自动化插件MCP测试脚本
 * 在插件开发完成后自动运行测试
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const puppeteer = require('puppeteer');

class PluginMCPTester {
  constructor() {
    this.baseUrl = 'http://localhost:3000'; // 实际的开发服务器端口
    this.pluginsDir = path.join(__dirname, '../plugins');
    this.testResults = [];
  }

  // 获取所有可用的插件
  async getAvailablePlugins() {
    const plugins = [];
    const pluginDirs = fs.readdirSync(this.pluginsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const pluginDir of pluginDirs) {
      const manifestPath = path.join(this.pluginsDir, pluginDir, 'manifest.json');
      const indexPath = path.join(this.pluginsDir, pluginDir, 'index.html');
      
      if (fs.existsSync(manifestPath) && fs.existsSync(indexPath)) {
        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          plugins.push({
            id: manifest.id,
            name: manifest.name,
            version: manifest.version,
            dir: pluginDir,
            manifest,
            indexPath
          });
        } catch (error) {
          console.warn(`⚠️  无法解析插件 ${pluginDir} 的manifest.json:`, error.message);
        }
      }
    }

    return plugins;
  }

  // 检查开发服务器是否运行
  async checkDevServer() {
    return new Promise((resolve) => {
      const http = require('http');
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/',
        method: 'GET',
        timeout: 5000
      };

      const req = http.request(options, (res) => {
        resolve(res.statusCode === 200);
      });

      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.end();
    });
  }

  // 测试单个插件
  async testPlugin(plugin) {
    console.log(`\n🧪 测试插件: ${plugin.name} (${plugin.id})`);
    
    const testResult = {
      pluginId: plugin.id,
      pluginName: plugin.name,
      tests: [],
      success: true,
      errors: []
    };

    let browser;
    let page;

    try {
      // 启动浏览器
      browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      page = await browser.newPage();

      // 设置页面错误监听
      page.on('console', msg => {
        if (msg.type() === 'error') {
          testResult.errors.push(`Console Error: ${msg.text()}`);
        }
      });

      page.on('pageerror', error => {
        testResult.errors.push(`Page Error: ${error.message}`);
      });

      // 1. 测试插件URL可访问性
      const pluginUrl = `${this.baseUrl}/plugins/${plugin.dir}/index.html`;
      console.log(`   📡 测试URL访问: ${pluginUrl}`);
      
      const response = await page.goto(pluginUrl, { 
        waitUntil: 'networkidle0',
        timeout: 10000 
      });
      
      const urlTest = {
        name: 'URL可访问性',
        success: response.status() === 200,
        details: `HTTP ${response.status()}`
      };
      testResult.tests.push(urlTest);

      if (!urlTest.success) {
        testResult.success = false;
        throw new Error(`插件URL不可访问: ${response.status()}`);
      }

      // 2. 测试HTML内容加载
      console.log(`   📄 测试HTML内容加载`);
      const title = await page.title();
      const bodyText = await page.evaluate(() => document.body.textContent);
      
      const contentTest = {
        name: 'HTML内容加载',
        success: title.length > 0 && bodyText.length > 0,
        details: `Title: ${title}, Content length: ${bodyText.length}`
      };
      testResult.tests.push(contentTest);

      // 3. 测试RPC通信功能
      console.log(`   🔌 测试RPC通信功能`);
      
      // 注入测试用的parent postMessage模拟
      await page.evaluate(() => {
        window.testResults = {
          rpcCalls: [],
          messages: []
        };

        // 模拟parent window
        const originalPostMessage = window.parent.postMessage;
        window.parent.postMessage = function(data, origin) {
          window.testResults.rpcCalls.push({ data, origin, timestamp: Date.now() });
        };

        // 监听消息
        window.addEventListener('message', (event) => {
          window.testResults.messages.push({ data: event.data, origin: event.origin });
        });
      });

      // 等待插件初始化
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 检查RPC调用
      const rpcResults = await page.evaluate(() => window.testResults);
      
      const rpcTest = {
        name: 'RPC通信',
        success: rpcResults.rpcCalls.length > 0,
        details: `RPC调用次数: ${rpcResults.rpcCalls.length}, 消息数: ${rpcResults.messages.length}`
      };
      testResult.tests.push(rpcTest);

      // 4. 测试插件特定功能
      console.log(`   ⚙️  测试插件特定功能`);
      
      // 查找并测试按钮点击
      const buttons = await page.$$('button');
      let buttonTest = {
        name: '按钮交互测试',
        success: false,
        details: `发现 ${buttons.length} 个按钮`
      };

      if (buttons.length > 0) {
        try {
          // 点击第一个按钮
          await buttons[0].click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // 检查是否有新的RPC调用
          const newRpcResults = await page.evaluate(() => window.testResults);
          const hasNewRpcCalls = newRpcResults.rpcCalls.length > rpcResults.rpcCalls.length;
          
          buttonTest.success = true;
          buttonTest.details += hasNewRpcCalls ? ' (触发了RPC调用)' : ' (未触发RPC调用)';
        } catch (error) {
          buttonTest.details += ` - 点击失败: ${error.message}`;
        }
      }
      
      testResult.tests.push(buttonTest);

      // 5. 性能测试
      console.log(`   ⚡ 性能测试`);
      const performanceMetrics = await page.metrics();
      
      const performanceTest = {
        name: '性能指标',
        success: performanceMetrics.JSHeapUsedSize < 50 * 1024 * 1024, // 50MB限制
        details: `JS堆使用: ${Math.round(performanceMetrics.JSHeapUsedSize / 1024 / 1024)}MB, DOM节点: ${performanceMetrics.Nodes}`
      };
      testResult.tests.push(performanceTest);

    } catch (error) {
      console.error(`   ❌ 测试失败:`, error.message);
      testResult.success = false;
      testResult.errors.push(error.message);
    } finally {
      if (browser) {
        await browser.close();
      }
    }

    return testResult;
  }

  // 生成测试报告
  generateReport() {
    const totalPlugins = this.testResults.length;
    const successfulPlugins = this.testResults.filter(r => r.success).length;
    const failedPlugins = totalPlugins - successfulPlugins;

    console.log('\n' + '='.repeat(60));
    console.log('📊 MCP插件测试报告');
    console.log('='.repeat(60));
    console.log(`总插件数: ${totalPlugins}`);
    console.log(`✅ 成功: ${successfulPlugins}`);
    console.log(`❌ 失败: ${failedPlugins}`);
    console.log(`📈 成功率: ${Math.round((successfulPlugins / totalPlugins) * 100)}%`);

    // 详细报告
    this.testResults.forEach(result => {
      console.log(`\n📦 ${result.pluginName} (${result.pluginId})`);
      console.log(`   状态: ${result.success ? '✅ 通过' : '❌ 失败'}`);
      
      result.tests.forEach(test => {
        const status = test.success ? '✅' : '❌';
        console.log(`   ${status} ${test.name}: ${test.details}`);
      });

      if (result.errors.length > 0) {
        console.log(`   🐛 错误:`);
        result.errors.forEach(error => {
          console.log(`      - ${error}`);
        });
      }
    });

    // 保存JSON报告
    const reportPath = path.join(__dirname, '../test-results/mcp-plugin-test-report.json');
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalPlugins,
        successfulPlugins,
        failedPlugins,
        successRate: Math.round((successfulPlugins / totalPlugins) * 100)
      },
      results: this.testResults
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 详细报告已保存到: ${reportPath}`);

    return report;
  }

  // 主测试流程
  async runTests() {
    console.log('🚀 启动MCP插件自动化测试...');

    // 检查开发服务器
    console.log('🔍 检查开发服务器状态...');
    const serverRunning = await this.checkDevServer();
    
    if (!serverRunning) {
      console.error('❌ 开发服务器未运行，请先启动: pnpm dev');
      process.exit(1);
    }

    console.log('✅ 开发服务器正在运行');

    // 获取插件列表
    const plugins = await this.getAvailablePlugins();
    console.log(`📦 发现 ${plugins.length} 个插件: ${plugins.map(p => p.name).join(', ')}`);

    if (plugins.length === 0) {
      console.log('⚠️  没有找到可测试的插件');
      return;
    }

    // 逐个测试插件
    for (const plugin of plugins) {
      const result = await this.testPlugin(plugin);
      this.testResults.push(result);
    }

    // 生成报告
    return this.generateReport();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const tester = new PluginMCPTester();
  
  tester.runTests()
    .then((report) => {
      const exitCode = report.summary.failedPlugins > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch((error) => {
      console.error('💥 测试过程中发生错误:', error);
      process.exit(1);
    });
}

module.exports = PluginMCPTester;
