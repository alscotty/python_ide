'use client';

import { useState, useEffect } from 'react';
import CodeEditor from '@/components/CodeEditor';
import Terminal from '@/components/Terminal';

export default function Home() {
  const [code, setCode] = useState('print("Hello, World!")');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupProgress, setSetupProgress] = useState(0);

  // Run default command on page load
  useEffect(() => {
    handleTerminalCommand('python3 script.py');
  }, []); // Empty dependency array means this runs once on mount

  const needsPandasOrScipy = (code: string): boolean => {
    return code.includes('import pandas') || code.includes('import scipy');
  };

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    const needsSetup = needsPandasOrScipy(code);
    if (needsSetup) {
      setIsSettingUp(true);
      setSetupProgress(0);
    }
    setOutput((prev) => prev + 'Running code...\n');

    // Simulate progress for environment setup only if needed
    let progressInterval: NodeJS.Timeout | undefined;
    if (needsSetup) {
      progressInterval = setInterval(() => {
        setSetupProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);
    }

    try {
      const response = await fetch('http://localhost:8000/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        setOutput((prev) => prev + (data.output || 'No output') + '\n');
      } else {
        setOutput((prev) => prev + `Error: ${data.error_message || 'Unknown error'}\n`);
      }
    } catch (error) {
      setOutput((prev) => prev + `Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    } finally {
      if (needsSetup) {
        clearInterval(progressInterval);
        setSetupProgress(100);
        setTimeout(() => {
          setIsRunning(false);
          setIsSettingUp(false);
          setSetupProgress(0);
        }, 500);
      } else {
        setIsRunning(false);
      }
    }
  };

  const handleTerminalCommand = async (command: string) => {
    // Handle different commands
    const [cmd, ...args] = command.trim().split(' ');

    switch (cmd) {
      case 'clear':
        setOutput('');
        break;
      case 'python3':
        if (args[0] === 'script.py') {
          await handleRunCode();
        } else {
          setOutput((prev) => prev + `Error: Only 'python3 script.py' is supported\n`);
        }
        break;
      case 'help':
        setOutput((prev) => prev + `
Available commands:
  clear           - Clear the terminal
  python3 script.py - Run the current code in the editor
  help            - Show this help message
  exit            - Exit the terminal
`);
        break;
      case 'exit':
        setOutput((prev) => prev + 'Goodbye!\n');
        break;
      default:
        setOutput((prev) => prev + `Command not found: ${cmd}\n`);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Code Execution Platform
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-8rem)]">
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold text-gray-700">Code Editor</h2>
            </div>
            <div className="flex-1">
              <CodeEditor code={code} onChange={handleCodeChange} />
            </div>
          </div>

          <div className="flex flex-col">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Terminal</h2>
            <div className="flex-1 relative">
              <Terminal output={output} onCommand={handleTerminalCommand} />
              {isSettingUp && (
                <div className="absolute right-0 top-0 w-48 bg-gray-800 text-white p-4 rounded-bl-lg shadow-lg">
                  <div className="text-sm mb-2">Setting up environment...</div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${setupProgress}%` }}
                    ></div>
                  </div>
                  <div className="text-xs mt-1 text-gray-400">
                    Installing pandas and scipy...
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
