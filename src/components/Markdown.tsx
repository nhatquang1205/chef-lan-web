import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Chef Lan's recipes: GFM Markdown (ingredient tables, numbered steps). Raw HTML stays disabled. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-3 leading-relaxed text-beige/90 [&_h1]:font-display [&_h1]:text-2xl [&_h2]:mt-5 [&_h2]:font-display [&_h2]:text-xl [&_h3]:mt-4 [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6 [&_strong]:text-beige [&_a]:underline [&_a]:underline-offset-4">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <div className="overflow-x-auto rounded border border-beige/15">
              <table className="w-full text-left text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border-b border-beige/15 bg-olive px-3 py-2 font-semibold">{children}</th>,
          td: ({ children }) => <td className="border-b border-beige/10 px-3 py-2">{children}</td>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
