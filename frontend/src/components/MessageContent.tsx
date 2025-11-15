import ReactMarkdown from 'react-markdown';

interface MessageContentProps {
  content: string;
}

const MessageContent = ({ content }: MessageContentProps) => {
  // Clean content: remove emojis and excessive em-dashes
  const cleanContent = (text: string): string => {
    let cleaned = text;

    // Remove excessive em-dashes (3 or more in a row)
    cleaned = cleaned.replace(/—{3,}/g, '—');

    // Remove all emojis using Unicode ranges
    cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}]/gu, ''); // Emoticons
    cleaned = cleaned.replace(/[\u{1F300}-\u{1F5FF}]/gu, ''); // Symbols & Pictographs
    cleaned = cleaned.replace(/[\u{1F680}-\u{1F6FF}]/gu, ''); // Transport & Map
    cleaned = cleaned.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, ''); // Flags
    cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, ''); // Misc symbols
    cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, ''); // Dingbats
    cleaned = cleaned.replace(/[\u{1F900}-\u{1F9FF}]/gu, ''); // Supplemental Symbols
    cleaned = cleaned.replace(/[\u{1FA00}-\u{1FA6F}]/gu, ''); // Extended Symbols
    cleaned = cleaned.replace(/[\u{1FA70}-\u{1FAFF}]/gu, ''); // Symbols and Pictographs Extended-A

    // Remove text emoticons like :), :D, :(, etc.
    cleaned = cleaned.replace(/[:;]-?[)D(PO]/g, '');

    return cleaned.trim();
  };

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown
        components={{
          // Render strong (bold) without showing the asterisks
          strong: ({ children }) => <strong>{children}</strong>,
          // Render em (italic) without showing the underscores
          em: ({ children }) => <em>{children}</em>,
          // Clean paragraphs
          p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
          // Clean lists
          ul: ({ children }) => <ul className="mb-4 list-disc pl-6">{children}</ul>,
          ol: ({ children }) => <ol className="mb-4 list-decimal pl-6">{children}</ol>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
        }}
      >
        {cleanContent(content)}
      </ReactMarkdown>
    </div>
  );
};

export default MessageContent;
