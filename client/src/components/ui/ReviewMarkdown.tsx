import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ReviewMarkdownProps {
  content: string;
  className?: string;
}

export const ReviewMarkdown: React.FC<ReviewMarkdownProps> = ({ content, className = '' }) => {
  if (!content || !content.trim()) {
    return <span className="text-xs text-zinc-500 font-mono italic">No description provided.</span>;
  }

  return (
    <div className={`review-markdown-content text-xs text-zinc-300 leading-relaxed font-sans [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p:last-child]:mb-0 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props) => <h1 className="text-base font-bold text-zinc-100 my-2.5 pb-1 border-b border-[#212634]" {...props} />,
          h2: (props) => <h2 className="text-sm font-bold text-zinc-100 my-2 pb-0.5 border-b border-[#212634]" {...props} />,
          h3: (props) => <h3 className="text-xs font-bold text-zinc-100 my-1.5" {...props} />,
          h4: (props) => <h4 className="text-xs font-semibold text-zinc-300 my-1 uppercase tracking-wide font-mono" {...props} />,
          p: ({ className: pCls, ...props }) => (
            <p className={`mb-2.5 last:mb-0 leading-relaxed text-xs text-zinc-300 ${pCls ?? ''}`} {...props} />
          ),
          strong: (props) => <strong className="text-zinc-100 font-semibold" {...props} />,
          em: (props) => <em className="text-zinc-400 italic" {...props} />,
          ul: (props) => <ul className="mb-2.5 last:mb-0 mt-1 pl-5 list-disc text-xs text-zinc-300 space-y-1" {...props} />,
          ol: (props) => <ol className="mb-2.5 last:mb-0 mt-1 pl-5 list-decimal text-xs text-zinc-300 space-y-1" {...props} />,
          li: (props) => <li className="leading-relaxed" {...props} />,
          a: (props) => <a target="_blank" rel="noreferrer" className="text-[#c0f200] underline underline-offset-2 hover:text-[#d0ff1a]" {...props} />,
          blockquote: (props) => (
            <blockquote className="my-2.5 p-2 px-3.5 border-l-2 border-[#c0f200]/50 bg-zinc-900/60 text-zinc-400 italic rounded-r text-xs" {...props} />
          ),
          hr: () => <hr className="border-t border-[#212634] my-3" />,
          table: (props) => (
            <div className="overflow-x-auto my-2.5">
              <table className="min-w-full text-left text-xs border border-[#212634] border-collapse" {...props} />
            </div>
          ),
          th: (props) => <th className="border border-[#212634] bg-[#161a24] p-2 font-mono text-zinc-200" {...props} />,
          td: (props) => <td className="border border-[#212634] p-2 text-zinc-300" {...props} />,
          code: ({ className: codeCls, children, ...rest }) => {
            const isBlock = /language-/.test(codeCls ?? '') || String(children).includes('\n');
            if (isBlock) {
              return (
                <pre className="my-2.5 p-3 bg-[#080a0f] border border-[#212634] rounded-lg overflow-x-auto text-[11px] font-mono leading-relaxed text-zinc-200">
                  <code className={codeCls} {...rest}>
                    {children}
                  </code>
                </pre>
              );
            }
            return (
              <code className="px-1.5 py-0.5 rounded bg-zinc-800/80 font-mono text-[11px] text-[#c0f200] border border-zinc-700/50" {...rest}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => <div>{children}</div>,
        }}
      >
        {content?.trim() ?? ''}
      </ReactMarkdown>
    </div>
  );
};
