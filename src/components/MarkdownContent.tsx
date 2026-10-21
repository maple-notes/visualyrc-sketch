import { isValidElement, memo, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MermaidDiagram from "./MermaidDiagram";
function MarkdownContent({ text }: { text: string }) {
  return (
    <div className="content-text markdown-content">
      <ReactMarkdown
        skipHtml
        remarkPlugins={[remarkGfm]}
        components={{
          pre({ children }) {
            if (
              isValidElement<{ className?: string; children?: ReactNode }>(
                children,
              ) &&
              children.props.className === "language-mermaid"
            )
              return (
                <MermaidDiagram
                  source={String(children.props.children ?? "").trimEnd()}
                />
              );
            return <pre>{children}</pre>;
          },
          img({ alt }) {
            return (
              <span className="remote-image-omitted">
                {alt ? "Image: " + alt : "Remote image omitted"} · attach images
                locally
              </span>
            );
          },
          a({ href, children }) {
            return (
              <a
                className="nodrag nopan"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
export default memo(MarkdownContent);
