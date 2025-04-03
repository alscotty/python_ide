'use client';

import { useState, useEffect } from 'react';
import CodeEditor from '@/components/CodeEditor';
import Terminal from '@/components/Terminal';

export default function Home() {
  const [code, setCode] = useState(`print("Hello World")

# uncomment below to test pandas and scipy
# import pandas as pd
# import numpy as np
# from scipy import stats

# # Create a sample DataFrame
# data = {
#     "A": np.random.randn(100),
#     "B": np.random.randn(100) * 2 + 1,
# }
# df = pd.DataFrame(data)
# print("Sample DataFrame:")
# print(df.head())

# # Compute basic statistics
# print("\\nStatistics:")
# print(df.describe())

# # Perform a t-test between columns A and B
# t_stat, p_value = stats.ttest_ind(df["A"], df["B"], equal_var=False)
# print("\\nT-test results:")
# print(f"T-statistic: {t_stat}")
# print(f"P-value: {p_value}")`);

  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupProgress, setSetupProgress] = useState(0);

  // Add code validation function
  const validateCode = (code: string): { isValid: boolean; error?: string } => {
    // List of dangerous patterns to check for
    const dangerousPatterns = [
      { pattern: /eval\s*\(/, message: "eval() function is not allowed" },
      { pattern: /exec\s*\(/, message: "exec() function is not allowed" },
      { pattern: /compile\s*\(/, message: "compile() function is not allowed" },
      { pattern: /open\s*\(/, message: "File operations are not allowed" },
      { pattern: /os\.system\s*\(/, message: "System commands are not allowed" },
      { pattern: /subprocess\.run\s*\(/, message: "Subprocess execution is not allowed" },
      { pattern: /socket\.socket\s*\(/, message: "Network operations are not allowed" },
      { pattern: /threading\.Thread\s*\(/, message: "Thread creation is not allowed" },
      { pattern: /multiprocessing\.Process\s*\(/, message: "Process creation is not allowed" },
      { pattern: /import\s+os\s*$/, message: "os module is not allowed" },
      { pattern: /import\s+sys\s*$/, message: "sys module is not allowed" },
      { pattern: /import\s+subprocess\s*$/, message: "subprocess module is not allowed" },
      { pattern: /import\s+socket\s*$/, message: "socket module is not allowed" },
      { pattern: /import\s+threading\s*$/, message: "threading module is not allowed" },
      { pattern: /import\s+multiprocessing\s*$/, message: "multiprocessing module is not allowed" },
      { pattern: /import\s+ctypes\s*$/, message: "ctypes module is not allowed" },
      { pattern: /import\s+pickle\s*$/, message: "pickle module is not allowed" },
      { pattern: /import\s+marshal\s*$/, message: "marshal module is not allowed" },
      { pattern: /import\s+builtins\s*$/, message: "builtins module is not allowed" },
      { pattern: /import\s+globals\s*$/, message: "globals module is not allowed" },
      { pattern: /import\s+locals\s*$/, message: "locals module is not allowed" },
      { pattern: /import\s+vars\s*$/, message: "vars module is not allowed" },
      { pattern: /import\s+dir\s*$/, message: "dir module is not allowed" },
      { pattern: /import\s+help\s*$/, message: "help module is not allowed" },
      { pattern: /import\s+input\s*$/, message: "input module is not allowed" },
      { pattern: /import\s+raw_input\s*$/, message: "raw_input module is not allowed" },
      { pattern: /import\s+execfile\s*$/, message: "execfile module is not allowed" },
      { pattern: /import\s+reload\s*$/, message: "reload module is not allowed" },
      { pattern: /import\s+importlib\s*$/, message: "importlib module is not allowed" },
      { pattern: /import\s+zipimport\s*$/, message: "zipimport module is not allowed" },
      { pattern: /import\s+pkgutil\s*$/, message: "pkgutil module is not allowed" },
      { pattern: /import\s+pkg_resources\s*$/, message: "pkg_resources module is not allowed" }
    ];

    // Check for dangerous patterns
    for (const { pattern, message } of dangerousPatterns) {
      if (pattern.test(code)) {
        return { isValid: false, error: message };
      }
    }

    // Check for excessive code length
    if (code.length > 10000) {
      return { isValid: false, error: "Code is too long (maximum 10,000 characters)" };
    }

    return { isValid: true };
  };

  // Run default command on page load
  useEffect(() => {
    handleTerminalCommand('python3 script.py');
  }, []); // Empty dependency array means this runs once on mount

  const needsPandasOrScipy = (code: string): boolean => {
    // Split code into lines and check each line
    const lines = code.split('\n');
    for (const line of lines) {
      // Skip commented lines
      if (line.trim().startsWith('#')) continue;
      
      // Check for imports
      if (line.includes('import pandas') || line.includes('import scipy')) {
        return true;
      }
    }
    return false;
  };

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  const handleRunCode = async () => {
    // Validate code before sending to backend
    const validation = validateCode(code);
    if (!validation.isValid) {
      setOutput((prev) => prev + `Error: ${validation.error}\n`);
      return;
    }

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
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to execute code');
      }

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
