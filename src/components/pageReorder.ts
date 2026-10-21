import type { HTMLAttributes } from "react";
const mime = "application/x-visualyrc-page";
export function pageReorderProps(
  id: string,
  onMove: (id: string, target: string, after: boolean) => void,
  disabled: boolean,
): HTMLAttributes<HTMLDivElement> {
  return {
    draggable: !disabled,
    onDragStart: (e) => {
      if (
        disabled ||
        (e.target instanceof Element && e.target.closest(".section-trim"))
      ) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.setData(mime, id);
      e.dataTransfer.effectAllowed = "move";
    },
    onDragOver: (e) => {
      if (disabled || !e.dataTransfer.types.includes(mime)) return;
      e.preventDefault();
      const r = e.currentTarget.getBoundingClientRect();
      e.currentTarget.dataset.dropEdge =
        e.clientY < r.top + r.height / 2 ? "before" : "after";
      e.dataTransfer.dropEffect = "move";
    },
    onDragLeave: (e) => {
      if (
        !(e.relatedTarget instanceof Node) ||
        !e.currentTarget.contains(e.relatedTarget)
      )
        delete e.currentTarget.dataset.dropEdge;
    },
    onDragEnd: (e) => {
      delete e.currentTarget.dataset.dropEdge;
    },
    onDrop: (e) => {
      if (disabled || !e.dataTransfer.types.includes(mime)) return;
      e.preventDefault();
      e.stopPropagation();
      const source = e.dataTransfer.getData(mime);
      const after = e.currentTarget.dataset.dropEdge === "after";
      delete e.currentTarget.dataset.dropEdge;
      if (source) onMove(source, id, after);
    },
  };
}
