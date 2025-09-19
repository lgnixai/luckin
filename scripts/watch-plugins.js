#!/usr/bin/env node

/**
 * 插件开发监听脚本
 * 监听插件文件变化，自动运行MCP测试
 */

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { spawn } = require('child_process');

class PluginWatcher {
  constructor() {
    this.pluginsDir = path.join(__dirname, '../plugins');
    this.isTestRunning = false;
    this.testQueue = new Set();
    this.debounceTimeout = null;
  }

  // 运行插件测试
  async runTest(pluginId = null) {
    if (this.isTestRunning) {
      if (pluginId) {
        this.testQueue.add(pluginId);
      }
      return;
    }

    this.isTestRunning = true;
    
    try {
      console.log(`\n🧪 ${pluginId ? `测试插件: ${pluginId}` : '运行所有插件测试'}...`);
      
      const testProcess = spawn('node', ['scripts/test-plugins-mcp.js'], {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });

      await new Promise((resolve, reject) => {
        testProcess.on('close', (code) => {
          if (code === 0) {
            console.log('✅ 测试完成');
            resolve();
          } else {
            console.log(`❌ 测试失败，退出代码: ${code}`);
            resolve(); // 不要reject，继续监听
          }
        });

        testProcess.on('error', (error) => {
          console.error('💥 测试进程错误:', error);
          resolve();
        });
      });

    } catch (error) {
      console.error('测试过程中发生错误:', error);
    } finally {
      this.isTestRunning = false;
      
      // 处理队列中的测试
      if (this.testQueue.size > 0) {
        const nextTest = Array.from(this.testQueue)[0];
        this.testQueue.clear();
        setTimeout(() => this.runTest(nextTest), 1000);
      }
    }
  }

  // 防抖运行测试
  debounceTest(pluginId) {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = setTimeout(() => {
      this.runTest(pluginId);
    }, 2000); // 2秒防抖
  }

  // 获取插件ID从文件路径
  getPluginIdFromPath(filePath) {
    const relativePath = path.relative(this.pluginsDir, filePath);
    const pluginDir = relativePath.split(path.sep)[0];
    return pluginDir;
  }

  // 开始监听
  startWatching() {
    console.log('👀 开始监听插件文件变化...');
    console.log(`📂 监听目录: ${this.pluginsDir}`);

    // 监听插件目录
    const watcher = chokidar.watch(this.pluginsDir, {
      ignored: /(^|[\/\\])\../, // 忽略隐藏文件
      persistent: true,
      ignoreInitial: true
    });

    // 文件变化事件
    watcher
      .on('change', (filePath) => {
        const pluginId = this.getPluginIdFromPath(filePath);
        const fileName = path.basename(filePath);
        
        console.log(`📝 文件变化: ${pluginId}/${fileName}`);
        this.debounceTest(pluginId);
      })
      .on('add', (filePath) => {
        const pluginId = this.getPluginIdFromPath(filePath);
        const fileName = path.basename(filePath);
        
        console.log(`📁 新文件: ${pluginId}/${fileName}`);
        this.debounceTest(pluginId);
      })
      .on('unlink', (filePath) => {
        const pluginId = this.getPluginIdFromPath(filePath);
        const fileName = path.basename(filePath);
        
        console.log(`🗑️  文件删除: ${pluginId}/${fileName}`);
        this.debounceTest(pluginId);
      })
      .on('error', error => {
        console.error('❌ 文件监听错误:', error);
      });

    // 监听关键的渲染器文件
    const rendererPath = path.join(__dirname, '../packages/ui/src/components/plugin-content-renderer.tsx');
    const viteConfigPath = path.join(__dirname, '../apps/web/vite.config.ts');

    const criticalWatcher = chokidar.watch([rendererPath, viteConfigPath], {
      persistent: true,
      ignoreInitial: true
    });

    criticalWatcher
      .on('change', (filePath) => {
        const fileName = path.basename(filePath);
        console.log(`🔧 关键文件变化: ${fileName}`);
        console.log('   这可能影响所有插件，运行完整测试...');
        this.debounceTest();
      });

    console.log('✅ 文件监听已启动');
    console.log('💡 提示: 修改插件文件后会自动运行测试');
    console.log('🛑 按 Ctrl+C 停止监听');

    // 运行初始测试
    setTimeout(() => {
      console.log('\n🚀 运行初始测试...');
      this.runTest();
    }, 3000);

    // 优雅退出处理
    process.on('SIGINT', () => {
      console.log('\n👋 停止文件监听...');
      watcher.close();
      criticalWatcher.close();
      process.exit(0);
    });

    return watcher;
  }
}

// 检查是否安装了chokidar
try {
  require('chokidar');
} catch (error) {
  console.error('❌ 缺少依赖: chokidar');
  console.log('📦 请运行: pnpm add -D -w chokidar');
  process.exit(1);
}

// 如果直接运行此脚本
if (require.main === module) {
  const watcher = new PluginWatcher();
  watcher.startWatching();
}

module.exports = PluginWatcher;
