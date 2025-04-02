'use client';

import { useState } from 'react';
import CodeEditor from '@/components/CodeEditor';
import Terminal from '@/components/Terminal';

export default function Home() {
  const [code, setCode] = useState('print("Hello, World!")');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput((prev) => prev + 'Running code...\n');

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
      setIsRunning(false);
    }
  };

  const handleTerminalCommand = async (command: string) => {
    // Handle different commands
    const [cmd, ...args] = command.trim().split(' ');

    switch (cmd) {
      case 'clear':
        setOutput('');
        break;
      case 'run':
        await handleRunCode();
        break;
      case 'help':
        setOutput((prev) => prev + `
Available commands:
  clear    - Clear the terminal
  run      - Run the current code in the editor
  help     - Show this help message
  exit     - Exit the terminal
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
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
              >
                {isRunning ? 'Running...' : 'Run Code'}
              </button>
            </div>
            <div className="flex-1">
              <CodeEditor code={code} onChange={handleCodeChange} />
            </div>
          </div>

          <div className="flex flex-col">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Terminal</h2>
            <div className="flex-1">
              <Terminal output={output} onCommand={handleTerminalCommand} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
