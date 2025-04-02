'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';

interface TerminalProps {
  output: string;
  onCommand: (command: string) => void;
}

export default function TerminalClient({ output, onCommand }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [currentLine, setCurrentLine] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isOutputting, setIsOutputting] = useState(false);

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current) return;

    const xterm = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1a1a1a',
        foreground: '#ffffff',
      },
      allowTransparency: true,
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    xterm.loadAddon(new WebLinksAddon());

    xterm.open(terminalRef.current);
    fitAddon.fit();

    // Write initial prompt
    xterm.write('$ ');

    // Handle input
    xterm.onData((data) => {
      const code = data.charCodeAt(0);
      
      // Handle special keys
      if (code === 13) { // Enter
        if (currentLine.trim()) {
          onCommand(currentLine);
          setCommandHistory(prev => [...prev, currentLine]);
          setHistoryIndex(-1);
          setCurrentLine('');
          xterm.write('\r\n$ ');
        } else {
          xterm.write('\r\n$ ');
        }
      } else if (code === 8) { // Backspace
        if (currentLine.length > 0) {
          setCurrentLine(prev => prev.slice(0, -1));
          xterm.write('\b \b');
        }
      } else if (code === 27) { // Escape sequences
        const sequence = data.slice(1);
        if (sequence === '[A') { // Up arrow
          if (historyIndex < commandHistory.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            const command = commandHistory[commandHistory.length - 1 - newIndex];
            setCurrentLine(command);
            xterm.write('\r$ ' + command);
          }
        } else if (sequence === '[B') { // Down arrow
          if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            const command = commandHistory[commandHistory.length - 1 - newIndex];
            setCurrentLine(command);
            xterm.write('\r$ ' + command);
          } else {
            setHistoryIndex(-1);
            setCurrentLine('');
            xterm.write('\r$ ');
          }
        }
      } else if (code >= 32) { // Printable characters
        setCurrentLine(prev => prev + data);
        xterm.write(data);
      }
    });

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      xterm.dispose();
    };
  }, []); // Empty dependency array for initialization

  // Handle output updates
  useEffect(() => {
    if (xtermRef.current && output && !isOutputting) {
      setIsOutputting(true);
      xtermRef.current.write(output);
      xtermRef.current.write('\r\n$ ');
      setIsOutputting(false);
    }
  }, [output, isOutputting]);

  return (
    <div
      ref={terminalRef}
      className="h-full w-full bg-gray-900 rounded-lg overflow-hidden"
    />
  );
} 