import { Editor } from '@monaco-editor/react';
import { useCallback } from 'react';

interface CodeEditorProps {
  code: string;
  onChange: (value: string | undefined) => void;
}

export default function CodeEditor({ code, onChange }: CodeEditorProps) {
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      onChange(value);
    },
    [onChange]
  );

  return (
    <div className="h-full w-full border border-gray-300 rounded-lg overflow-hidden">
      <Editor
        height="100%"
        defaultLanguage="python"
        defaultValue={code}
        onChange={handleEditorChange}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
} 