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
        // Fallback for old ProseMirror objects or unknown objects
        const legacyContent = initialContent as any;
        
        // If it's a legacy ProseMirror doc
        if (legacyContent.type === 'doc' && Array.isArray(legacyContent.content)) {
            // Attempt a more useful conversion or at least show text
            const textContent = JSON.stringify(legacyContent, null, 2);
            setInitialData([
                {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        text: "Contenido legacy detectado. Por favor revisa y actualiza:",
                        styles: { bold: true }
                      }
                    ]
                },
                {
                  type: "codeBlock",
                  content: [
                    {
                      type: "text",
                      text: textContent
                    }
                  ]
                }
            ]);
        } else if (Object.keys(legacyContent).length > 0) {
            // Some other object, show as JSON
            setInitialData([
              {
                type: "paragraph",
                content: "Contenido no compatible con BlockNote (Object). Raw JSON:"
              },
              {
                type: "codeBlock",
                content: [
                  {
                    type: "text",
                    text: JSON.stringify(legacyContent, null, 2)
                  }
                ]
              }
            ]);
        } else {
            setInitialData(undefined); 
        }
      }
    }
  }, [initialContent]);

  // Force remount when initialData changes to ensure useCreateBlockNote gets it
  return (
    <div className="w-full h-full min-h-[400px] border border-border rounded-lg overflow-hidden bg-background">
      <BlockNoteInternal 
        key={initialData ? JSON.stringify(initialData) : 'empty'}
        initialData={initialData} 
        onChange={onChange} 
        editable={editable} 
      />
    </div>
  );
}

function BlockNoteInternal({ initialData, onChange, editable }: { initialData: any, onChange: (c: any) => void, editable: boolean }) {
  const editor = useCreateBlockNote({
    initialContent: initialData,
  });

  return (
    <BlockNoteView
      editor={editor}
      editable={editable}
      theme="dark"
      onChange={() => {
        onChange(editor.document);
      }}
      className="h-full min-h-[400px]"
    />
  );
}
