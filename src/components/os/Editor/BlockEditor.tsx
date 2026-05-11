"use client";

import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useEffect, useState } from "react";

interface BlockEditorProps {
  initialContent?: unknown;
  onChange: (content: unknown) => void;
  editable?: boolean;
}

export function BlockEditor({ initialContent, onChange, editable = true }: BlockEditorProps) {
  const [initialData, setInitialData] = useState<unknown>(undefined);

  useEffect(() => {
    if (initialContent) {
      if (typeof initialContent === 'string') {
        try {
          const parsed = JSON.parse(initialContent);
          setInitialData(Array.isArray(parsed) ? parsed : undefined);
        } catch {
          setInitialData(undefined);
        }
      } else if (Array.isArray(initialContent)) {
        setInitialData(initialContent);
      } else if (typeof initialContent === 'object' && initialContent !== null) {
        setInitialData(undefined); 
      }
    }
  }, [initialContent]);

  const editor = useCreateBlockNote({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialContent: initialData as any,
  });

  return (
    <div className="w-full h-full min-h-[400px] border border-border rounded-lg overflow-hidden bg-background">
      <BlockNoteView
        editor={editor}
        editable={editable}
        theme="dark"
        onChange={() => {
          onChange(editor.document);
        }}
        className="h-full min-h-[400px]"
      />
    </div>
  );
}
