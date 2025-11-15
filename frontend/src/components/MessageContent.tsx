import ReactMarkdown from 'react-markdown';

interface MessageContentProps {
  content: string;
}

const MessageContent = ({ content }: MessageContentProps) => {
  // Bereinigung des Contents für professionelle Darstellung
  const cleanContent = (text: string): string => {
    let cleaned = text;

    // Entferne übermäßige em-dashes (mehr als 2 hintereinander)
    cleaned = cleaned.replace(/—{3,}/g, '—');

    // Entferne Emojis und Emoticons
    // Unicode-Bereiche für Emojis
    cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}]/gu, ''); // Emoticons
    cleaned = cleaned.replace(/[\u{1F300}-\u{1F5FF}]/gu, ''); // Symbole & Piktogramme
    cleaned = cleaned.replace(/[\u{1F680}-\u{1F6FF}]/gu, ''); // Transport & Karten
    cleaned = cleaned.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, ''); // Flaggen
    cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, '');   // Verschiedene Symbole
    cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, '');   // Dingbats
    cleaned = cleaned.replace(/[\u{FE00}-\u{FE0F}]/gu, '');   // Variation Selectors
    cleaned = cleaned.replace(/[\u{1F900}-\u{1F9FF}]/gu, ''); // Ergänzende Symbole
    cleaned = cleaned.replace(/[\u{1FA70}-\u{1FAFF}]/gu, ''); // Erweiterte Symbole

    // Entferne Text-Emoticons wie :), :D, :(, etc.
    cleaned = cleaned.replace(/[:;]-?[)D(PO]/g, '');
    cleaned = cleaned.replace(/[)D(PO]-?[:;]/g, '');

    return cleaned.trim();
  };

  return (
    <ReactMarkdown
      className="prose prose-sm max-w-none dark:prose-invert"
      components={{
        // Custom renderer für strong (fett) - stellt sicher, dass ** nicht angezeigt werden
        strong: ({node, ...props}) => <strong {...props} />,
        // Custom renderer für em (kursiv) - stellt sicher, dass * nicht angezeigt werden
        em: ({node, ...props}) => <em {...props} />,
        // Absätze mit angemessenem Abstand
        p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
        // Listen mit angemessenem Abstand
        ul: ({node, ...props}) => <ul className="mb-3 ml-4 list-disc" {...props} />,
        ol: ({node, ...props}) => <ol className="mb-3 ml-4 list-decimal" {...props} />,
        li: ({node, ...props}) => <li className="mb-1" {...props} />,
      }}
    >
      {cleanContent(content)}
    </ReactMarkdown>
  );
};

export default MessageContent;
