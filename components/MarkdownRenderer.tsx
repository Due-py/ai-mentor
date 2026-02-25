import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

declare global {
  interface Window {
    MathJax?: {
      startup?: { promise?: Promise<unknown> };
      typesetPromise?: (elements?: HTMLElement[]) => Promise<void>;
      typesetClear?: (elements?: HTMLElement[]) => void;
    };
  }
}

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isCancelled = false;
    let retryTimer: number | null = null;

    const typesetMath = async (attempt = 0) => {
      const mathJax = window.MathJax;
      if (!containerRef.current) return;
      if (!mathJax?.typesetPromise) {
        if (attempt < 10) {
          retryTimer = window.setTimeout(() => {
            void typesetMath(attempt + 1);
          }, 150);
        }
        return;
      }

      try {
        // Clear previous typesetting
        if (mathJax.typesetClear) {
          mathJax.typesetClear([containerRef.current]);
        }
        
        if (mathJax.startup?.promise) {
          await mathJax.startup.promise;
        }
        
        // Re-typeset all math in container
        if (!isCancelled && containerRef.current) {
          await mathJax.typesetPromise([containerRef.current]);
        }
      } catch (error) {
        console.error('Math typeset error:', error);
      }
    };

    void typesetMath();
    
    return () => {
      isCancelled = true;
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
      }
    };
  }, [content]); // Re-run whenever content changes

  return (
    <div 
      ref={containerRef} 
      className={className || 'prose prose-sm max-w-none prose-p:my-2 prose-h1:font-bold prose-h1:text-2xl prose-h2:font-bold prose-h2:text-xl prose-h3:font-bold prose-h3:text-lg prose-strong:font-bold prose-strong:text-slate-900 prose-em:italic prose-ul:list-disc prose-ul:ml-4 prose-ol:list-decimal prose-ol:ml-4 prose-li:my-1 prose-code:bg-cream-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-red-600 prose-pre:bg-slate-900 prose-pre:text-cream-50 prose-pre:p-3 prose-pre:rounded-lg prose-a:text-blue-600 prose-a:hover:underline'}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};