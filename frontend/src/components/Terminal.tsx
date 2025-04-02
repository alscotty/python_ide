'use client';

import dynamic from 'next/dynamic';

// Dynamically import the client-side terminal component
const TerminalClient = dynamic(() => import('./TerminalClient'), {
  ssr: false,
});

interface TerminalProps {
  output: string;
  onCommand: (command: string) => void;
}

export default function Terminal(props: TerminalProps) {
  return <TerminalClient {...props} />;
} 