import { useEffect, useState } from "react";
import { Type, Image as ImageIcon } from "lucide-react";
import type { Content } from "../domain/model";
import MarkdownContent from "./MarkdownContent";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../storage/db";
export function MediaImage({ assetId, alt }: { assetId: string; alt: string }) {
  const [url, setUrl] = useState("");
  const asset = useLiveQuery(() => db.assets.get(assetId), [assetId]);
  useEffect(() => {
    if (!asset) {
      setUrl("");
      return;
    }
    const objectUrl = URL.createObjectURL(asset.blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [asset]);
  return url ? (
    <img draggable={false} src={url} alt={alt} />
  ) : (
    <span className="media-loading">Loading image…</span>
  );
}
export function KindIcon({ kind }: { kind: Content["kind"] }) {
  return kind === "text" ? (
    <Type size={15} aria-label="Text" />
  ) : (
    <ImageIcon size={15} aria-label="Image" />
  );
}
export default function ContentCard({ content }: { content: Content }) {
  return content.kind === "text" ? (
    <MarkdownContent text={content.text} />
  ) : (
    <MediaImage assetId={content.assetId} alt={content.altText} />
  );
}
