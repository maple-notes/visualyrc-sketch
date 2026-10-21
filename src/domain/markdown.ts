export function checkMermaidSource(source: string): string {
  if (source.length > 10000)
    throw Error(
      "Diagram exceeds10,000 characters. Split it into smaller diagrams.",
    );
  if (
    /\$\$|%%\s*\{|^\s*---|@\s*\{|!\[|https?\s*:|data\s*:|javascript\s*:|file\s*:|url\s*\(|<(?:script|iframe|img|object|embed|link|style)\b/i.test(
      source,
    )
  )
    throw Error(
      "Diagram configuration, embedded images and external URLs are disabled.",
    );
  return source;
}
