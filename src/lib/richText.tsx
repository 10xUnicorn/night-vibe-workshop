import React from 'react';

/**
 * Parses a simple markdown-like string into React elements.
 * Supports:
 *   **bold**
 *   *italic*
 *   - bullet lists (lines starting with "- ")
 *   Blank lines create paragraph breaks
 */
export function renderRichText(
  text: string,
  style?: React.CSSProperties
): React.ReactNode {
  if (!text) return null;

  // Split into paragraphs/blocks by double newlines or single newlines
  const lines = text.split('\n');
  const blocks: { type: 'paragraph' | 'list'; content: string[] }[] = [];
  let currentBlock: { type: 'paragraph' | 'list'; content: string[] } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '') {
      // Empty line — close current block
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      continue;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      // List item
      const itemText = trimmed.replace(/^[-•]\s+/, '');
      if (currentBlock?.type === 'list') {
        currentBlock.content.push(itemText);
      } else {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { type: 'list', content: [itemText] };
      }
    } else {
      // Regular text line
      if (currentBlock?.type === 'paragraph') {
        currentBlock.content.push(trimmed);
      } else {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { type: 'paragraph', content: [trimmed] };
      }
    }
  }

  if (currentBlock) blocks.push(currentBlock);

  return (
    <div style={style}>
      {blocks.map((block, bi) => {
        if (block.type === 'list') {
          return (
            <ul
              key={bi}
              style={{
                margin: '12px 0',
                paddingLeft: 20,
                listStyleType: 'disc',
              }}
            >
              {block.content.map((item, li) => (
                <li
                  key={li}
                  style={{
                    fontSize: 'inherit',
                    color: 'inherit',
                    lineHeight: 1.7,
                    marginBottom: 6,
                  }}
                >
                  {parseInline(item)}
                </li>
              ))}
            </ul>
          );
        }

        // Paragraph
        return (
          <p
            key={bi}
            style={{
              fontSize: 'inherit',
              color: 'inherit',
              lineHeight: 1.7,
              marginBottom: 14,
            }}
          >
            {parseInline(block.content.join(' '))}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Parse inline formatting: **bold** and *italic*
 */
function parseInline(text: string): React.ReactNode {
  // Match **bold** and *italic*
  const parts: React.ReactNode[] = [];
  // Regex: (\*\*(.+?)\*\*)|(\*(.+?)\*)|(text)
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // **bold**
      parts.push(
        <strong key={match.index} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      // *italic*
      parts.push(
        <em key={match.index} style={{ fontStyle: 'italic' }}>
          {match[4]}
        </em>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}
