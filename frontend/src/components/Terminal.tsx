'use client';

import { useEffect, useRef, useState } from 'react';

interface TerminalProps {
  output: string;
  onCommand: (command: string) => void;
}

export default function Terminal({ output, onCommand }: TerminalProps) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (input.trim()) {
        onCommand(input.trim());
        setHistory(prev => [...prev, input.trim()]);
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="text-xs text-gray-500 mb-2 font-mono">
        Available commands:
        <div className="ml-4">
          clear           - Clear the terminal<br />
          python3 script.py - Run the current code in the editor<br />
          help            - Show this help message<br />
          exit            - Exit the terminal
        </div>
      </div>
      <div className="flex-1 bg-gray-900 rounded-lg overflow-hidden font-mono text-white p-4">
        <div className="h-full overflow-y-auto">
          {output.split('\n').map((line, i) => (
            <div key={i} className="whitespace-pre-wrap">
              {line}
            </div>
          ))}
          <div className="flex items-center">
            <span className="text-green-500 mr-2">$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent outline-none text-white"
              autoFocus
            />
          </div>
        </div>
      </div>
    </div>
  );
} 