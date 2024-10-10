'use client'

import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";

const handleFile = async (file) => {
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  try {
    const response = await fetch(`/api/auth/upload/upload-file`, {
      method: 'POST',
      body: formData,
    });
    const respData = await response.json();
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    return respData.url.replace(
      "tmpfiles.org/",
      "tmpfiles.org/dl/"
    );
  } catch (error) {
    console.error('Error uploading file:', error);
  }
};


export default function Blocknote({ setHtml, setContent, html, content, theme }) {
  // Creates a new editor instance.
  const editor = useCreateBlockNote(
    {
      initialContent: !content || content.length === 0 ? null : content,
      uploadFile: handleFile,
    }
  );

  const onChange = async () => {
    const html = await editor.blocksToHTMLLossy(editor.document);
    setHtml(html);
    setContent(editor.document);
  };

  // Renders the editor instance using a React component.
  return <BlockNoteView editor={editor} onChange={onChange} theme={theme} />;
}

