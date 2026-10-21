import { useEffect, useId, useRef, useState } from "react";
import { checkMermaidSource } from "../domain/markdown";
let renderer: Promise<(typeof import("mermaid"))["default"]> | undefined;
function getRenderer() {
  return (renderer ??= import("mermaid").then(({ default: mermaid }) => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      suppressErrorRendering: true,
      maxTextSize: 12000,
      maxEdges: 200,
      theme: "base",
      themeVariables: {
        primaryColor: "#ede6ef",
        primaryTextColor: "#3a3b43",
        primaryBorderColor: "#866490",
        lineColor: "#866490",
        background: "#fafaf7",
        fontFamily: "system-ui, sans-serif",
      },
      htmlLabels: false,
      flowchart: { htmlLabels: false },
    });
    return mermaid;
  }));
}
export default function MermaidDiagram({ source }: { source: string }) {
  const host = useRef<HTMLDivElement>(null),
    id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [visible, setVisible] = useState(false),
    [svg, setSvg] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let live = true;
    setSvg("");
    setError("");
    if (!visible) return;
    void (async () => {
      try {
        const safe = checkMermaidSource(source),
          mermaid = await getRenderer();
        if (!live) return;
        const result = await mermaid.render("mermaid" + id, safe);
        if (live) setSvg(result.svg);
      } catch (e) {
        if (live)
          setError(e instanceof Error ? e.message : "Diagram could not render");
      }
    })();
    return () => {
      live = false;
    };
  }, [source, visible, id]);
  // The diagram frame cannot execute scripts, navigate, or fetch external resources.
  const document = svg
    ? `<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'"><style>body{margin:0;display:grid;place-items:center;color:#3a3b43}svg{max-width:100%;height:auto}</style>${svg}`
    : "";
  return (
    <div ref={host} className="mermaid-diagram">
      {error ? (
        <div role="alert" className="diagram-error">
          Mermaid: {error}
        </div>
      ) : svg ? (
        <iframe title="Mermaid diagram" sandbox="" srcDoc={document} />
      ) : (
        <span className="media-loading">Preparing diagram…</span>
      )}
    </div>
  );
}
