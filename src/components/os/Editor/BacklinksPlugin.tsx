"use client";

export function extractBacklinksFromContent(content: string): string[] {
  const regex = /\[\[([^\]]+)\]\]/g;
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    matches.push(match[1].trim());
  }
  return matches;
}

function extractTextFromBlocks(blocks: any[]): string {
  if (!blocks) return "";
  return blocks
    .map((block) => {
      if (block.content && typeof block.content === "string") return block.content;
      if (block.children) return extractTextFromBlocks(block.children);
      return "";
    })
    .join(" ");
}

export function parseBacklinks(document: any, noteId: string) {
  const textContent = extractTextFromBlocks(document);
  const titles = extractBacklinksFromContent(textContent);
  return titles.map((title) => ({
    sourceId: noteId,
    targetId: null as string | null,
    title,
  }));
}
