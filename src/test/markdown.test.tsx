import { it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import MarkdownContent from "../components/MarkdownContent";
import { checkMermaidSource } from "../domain/markdown";
it("renders Markdown headings, emphasis, tables and code without altering source", () => {
  const html = renderToStaticMarkup(
    <MarkdownContent
      text={"# Heading\n\n**strong** and `code`\n\n|A|B|\n|-|-|\n|1|2|"}
    />,
  );
  expect(html).toContain("<h1>Heading</h1>");
  expect(html).toContain("<strong>strong</strong>");
  expect(html).toContain("<table>");
  expect(html).toContain("<code>code</code>");
});
it("omits raw HTML and remote image requests and removes executable URLs", () => {
  const html = renderToStaticMarkup(
    <MarkdownContent
      text={
        "<script>alert(1)</script>\n\n![remote](https://example.com/a.png)\n\n[bad](javascript:alert%281%29)"
      }
    />,
  );
  expect(html).not.toContain("<script");
  expect(html).not.toContain("<img");
  expect(html).not.toContain('href="javascript:');
});
it("recognizes Mermaid blocks and rejects diagram configuration or external assets", () => {
  const html = renderToStaticMarkup(
    <MarkdownContent text={"```mermaid\nflowchart LR\nA-->B\n```"} />,
  );
  expect(html).toContain("mermaid-diagram");
  expect(checkMermaidSource("flowchart LR\nA-->B")).toContain("A-->B");
  for (const source of [
    '%%{init: {securityLevel:"loose"}}%%',
    'flowchart LR\nA@{img:"https://example.com/a"}',
    "x".repeat(10001),
    "---\nconfig:\n",
  ])
    expect(() => checkMermaidSource(source)).toThrow();
});
