import React from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTestService, useThemeService } from '@lginxai/luckin-core-legacy';
import { Play, RotateCcw, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

export interface TestPaneProps {
  className?: string;
}

export const TestPane: React.FC<TestPaneProps> = ({ className }) => {
  const { 
    testSuites, 
    isRunning, 
    currentTest, 
    runTest, 
    runAllTests, 
    clearResults 
  } = useTestService();
  const { setTheme } = useThemeService();

  const handleButtonClick = async (testId: string) => {
    console.log(`Running test: ${testId}`);
    await runTest(testId);
  };

  const handleRunAll = async () => {
    console.log('Running all tests...');
    await runAllTests();
  };

  const handleClearResults = () => {
    console.log('Clearing test results...');
    clearResults();
  };

  const handleRandomTheme = () => {
    const themes = ['light','dark','glass'] as const;
    const picked = themes[Math.floor(Math.random()*themes.length)];
    setTheme(picked as any);
    const root = document.documentElement;
    root.classList.remove('light','dark','glass');
    if (picked === 'light') {
      // 默认即浅色
    } else if (picked === 'dark') {
      root.classList.add('dark');
    } else if (picked === 'glass') {
      root.classList.add('dark');
      root.classList.add('glass');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'running':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={cn("h-full bg-sidebar border-r flex flex-col", className)}>
      {/* Header */}
      <div className="p-2 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">TESTPANE</h3>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={handleRunAll}
              disabled={isRunning}
            >
              <Play className="w-3 h-3 mr-1" />
              全部运行
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={handleClearResults}
              disabled={isRunning}
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              清除
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={handleRandomTheme}
              disabled={isRunning}
            >
              随机主题
            </Button>
          </div>
        </div>
      </div>
      
      {/* Test Suites */}
      <div className="flex-1 overflow-auto p-2 space-y-4">
        {testSuites.map((suite) => (
          <div key={suite.id}>
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(suite.status)}
              <h4 className={cn("text-xs font-medium", getStatusColor(suite.status))}>
                {suite.name}:
              </h4>
            </div>
            <div className="space-y-1">
              {suite.tests.map((test) => (
                <div key={test.id} className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "flex-1 justify-start text-xs h-7",
                      test.status === 'running' && "bg-blue-50 border-blue-200",
                      test.status === 'passed' && "bg-green-50 border-green-200",
                      test.status === 'failed' && "bg-red-50 border-red-200"
                    )}
                    onClick={() => handleButtonClick(test.id)}
                    disabled={isRunning}
                  >
                    {test.name}
                  </Button>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(test.status)}
                    {test.duration && (
                      <span className="text-xs text-muted-foreground">
                        {test.duration}ms
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {/* Test Output */}
        {currentTest && (
          <div className="mt-4 p-2 bg-muted rounded text-xs">
            <div className="font-medium text-blue-600 mb-1">正在运行测试...</div>
            <div className="text-muted-foreground">
              当前测试: {testSuites
                .flatMap(s => s.tests)
                .find(t => t.id === currentTest)?.name}
            </div>
          </div>
        )}
        
        {/* Test Results Summary */}
        <div className="mt-4 p-2 bg-muted rounded text-xs">
          <div className="font-medium mb-1">测试统计</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-green-600 font-medium">
                {testSuites.flatMap(s => s.tests).filter(t => t.status === 'passed').length}
              </div>
              <div className="text-muted-foreground">通过</div>
            </div>
            <div>
              <div className="text-red-600 font-medium">
                {testSuites.flatMap(s => s.tests).filter(t => t.status === 'failed').length}
              </div>
              <div className="text-muted-foreground">失败</div>
            </div>
            <div>
              <div className="text-gray-600 font-medium">
                {testSuites.flatMap(s => s.tests).filter(t => t.status === 'pending').length}
              </div>
              <div className="text-muted-foreground">待运行</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

