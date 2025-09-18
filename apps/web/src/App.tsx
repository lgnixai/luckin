import { LuckinProvider, Workbench, CommandPalette } from '@lgnixai/luckin-ui';
import { useEffect, useState } from 'react';
import { 
  initializeGlobalApp, 
  getGlobalApp,
  type ILuckinConfig,
  type LuckinApplication 
} from '@lgnixai/luckin-core';
import './index.css';

const config: ILuckinConfig = {
  locale: 'en-US',
  theme: 'default-dark',
  extensions: [],
  editor: {
    fontSize: 14,
    fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", monospace',
    tabSize: 2,
    insertSpaces: true,
    wordWrap: 'on',
    lineNumbers: 'on',
    minimap: {
      enabled: true,
      side: 'right'
    }
  },
  ui: {
    sidebarLocation: 'left',
    panelLocation: 'bottom',
    showActivityBar: true,
    showStatusBar: true,
    showMenuBar: true
  }
};

function App() {
  const [app, setApp] = useState<LuckinApplication | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        console.log('Initializing Luckin IDE...');
        const luckinApp = await initializeGlobalApp(config);
        
        if (mounted) {
          setApp(luckinApp);
          setIsInitialized(true);
          console.log('Luckin IDE initialized successfully');
        }
      } catch (err) {
        console.error('Failed to initialize Luckin IDE:', err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isInitialized || !app) return;

    // Register example commands
    const commandService = app.getService('command');
    
    commandService.registerCommand({
      id: 'welcome.show',
      title: 'Show Welcome Page',
      category: 'Help'
    }, () => {
      const editorService = app.getService('editor');
      const doc = editorService.createDocument('welcome.md', `# Welcome to Luckin IDE 3.0

This is the new and improved Luckin IDE built with modern architecture!

## Features
- 🚀 Modern React-based UI
- 🎨 Beautiful shadcn/ui components  
- ⚡ High-performance Monaco editor
- 🔧 Extensible plugin system
- 🌙 Dark/Light theme support

## Getting Started
- Press \`Ctrl+N\` to create a new file
- Press \`Ctrl+K\` to open command palette
- Press \`Ctrl+B\` to toggle sidebar

Happy coding! 🎉`, 'markdown');
      editorService.openTab(doc.id);
    });

    commandService.registerCommand({
      id: 'panel.toggle',
      title: 'Toggle Panel',
      category: 'View'
    }, () => {
      console.log('Toggle panel command executed');
      // Panel toggle logic would go here
    });

    // Bind Ctrl/Cmd+K to open command palette
    const onKey = (e: KeyboardEvent) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'k');
      if (isCmdK) {
        e.preventDefault();
        console.log('Command palette shortcut pressed');
        // Command palette toggle logic would go here
      }
    };
    
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isInitialized, app]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Failed to Initialize Luckin IDE
          </h1>
          <p className="text-red-500 mb-4">{error.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4 mx-auto"></div>
          <p className="text-gray-300">Initializing Luckin IDE...</p>
        </div>
      </div>
    );
  }

  return (
    <LuckinProvider config={config}>
      <Workbench className="h-screen">
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Welcome to Luckin IDE 3.0</h2>
            <p className="mb-4">Press Ctrl+K to open the command palette</p>
            <p className="text-sm">Try the "Show Welcome Page" command</p>
          </div>
        </div>
      </Workbench>
      <CommandPalette className="" />
    </LuckinProvider>
  );
}

export default App;
