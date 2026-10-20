import {
  useMemo,
  useCallback,
  useEffect,
  useState,
  memo,
  type CSSProperties,
} from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  NodeResizer,
  useReactFlow,
  Background,
  BackgroundVariant,
  applyNodeChanges,
  type NodeProps,
  type Node,
  type Viewport,
} from "@xyflow/react";
import { Minus, Plus, Scan } from "lucide-react";
import type { Project, Content } from "../domain/model";
import ContentCard, { KindIcon } from "../components/ContentCard";
type Data = {
  content: Content;
  graph: boolean;
  readOnly: boolean;
  onSize: (id: string, w: number, h: number, x: number, y: number) => void;
  onEdit: (id: string) => void;
  onSelect: (id: string, placementId?: string) => void;
};
type CardNode = Node<Data>;
function Card({ id, data, selected }: NodeProps<CardNode>) {
  return (
    <div
      className={
        "material " +
        (selected ? "selected " : "") +
        (data.content.kind === "image" ? "image-material" : "text-material")
      }
      role="button"
      tabIndex={0}
      aria-label={(data.content.kind === "text"
        ? data.content.text
        : data.content.altText
      ).slice(0, 80)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.stopPropagation();
          data.onSelect(data.content.id, data.graph ? undefined : id);
        }
      }}
      onDoubleClick={() => data.onEdit(data.content.id)}
    >
      {!data.graph && (
        <NodeResizer
          isVisible={selected && !data.readOnly}
          minWidth={120}
          minHeight={64}
          keepAspectRatio={data.content.kind === "image"}
          handleClassName="corner-grip"
          lineStyle={{ border: 0 }}
          onResizeEnd={(_, p) => data.onSize(id, p.width, p.height, p.x, p.y)}
        />
      )}
      {data.graph && (
        <Handle type="target" position={Position.Left} isConnectable={false} />
      )}
      {(data.content.kind === "text" || data.graph) && (
        <div className="node-meta">
          <span>{id.slice(0, 6).toUpperCase()}</span>
          <KindIcon kind={data.content.kind} />
        </div>
      )}
      <ContentCard content={data.content} />
      {data.graph && (
        <Handle type="source" position={Position.Right} isConnectable={false} />
      )}
    </div>
  );
}
const nodeTypes = { material: Card };
export type BoardProps = {
  project: Project;
  pageId: string;
  mode: "canvas" | "graph";
  readOnly: boolean;
  focusId?: string;
  onSelect: (nodeId: string, placementId?: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onSize: Data["onSize"];
  onEdit: Data["onEdit"];
  onDrop: (nodeId: string, x: number, y: number) => void;
  onViewport: (v: Viewport) => void;
};
function Inner(props: BoardProps) {
  const { project, pageId, mode } = props;
  const graph = mode === "graph";
  const rf = useReactFlow<CardNode>();
  const nodes = useMemo(
    () =>
      graph
        ? project.nodes.map((n, i) => {
            const pos = project.graph.find((g) => g.nodeId === n.id);
            return {
              id: n.id,
              type: "material",
              selected: props.focusId === n.id,
              position: pos
                ? { x: pos.x, y: pos.y }
                : { x: 100 + (i % 3) * 340, y: 100 + Math.floor(i / 3) * 250 },
              width: 260,
              height: n.kind === "image" ? 220 : 160,
              data: {
                content: n,
                graph: true,
                readOnly: props.readOnly,
                onSize: props.onSize,
                onEdit: props.onEdit,
                onSelect: props.onSelect,
              },
            };
          })
        : project.placements
            .filter((p) => p.pageId === pageId)
            .flatMap((p) => {
              const n = project.nodes.find((n) => n.id === p.nodeId);
              return n
                ? [
                    {
                      id: p.id,
                      type: "material",
                      selected: props.focusId === p.id,
                      position: { x: p.x, y: p.y },
                      style: { width: p.width, height: p.height },
                      width: p.width,
                      height: p.height,
                      zIndex: p.zIndex,
                      data: {
                        content: n,
                        graph: false,
                        readOnly: props.readOnly,
                        onSize: props.onSize,
                        onEdit: props.onEdit,
                        onSelect: props.onSelect,
                      },
                    },
                  ]
                : [];
            }),
    [
      project,
      graph,
      pageId,
      props.focusId,
      props.readOnly,
      props.onSize,
      props.onEdit,
      props.onSelect,
    ],
  );
  const [liveNodes, setLiveNodes] = useState<CardNode[]>(nodes);
  useEffect(() => setLiveNodes(nodes), [nodes]);
  const edges = useMemo(
    () =>
      graph
        ? project.edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            type: "straight",
            style: { stroke: "#9a8b9e", strokeWidth: 1.3 },
          }))
        : [],
    [project.edges, graph],
  );
  const drop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      try {
        const value: unknown = JSON.parse(
          e.dataTransfer.getData("application/visualyrc-node"),
        );
        if (
          value &&
          typeof value === "object" &&
          "projectId" in value &&
          value.projectId === project.id &&
          "nodeId" in value &&
          typeof value.nodeId === "string"
        ) {
          const p = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
          props.onDrop(value.nodeId, p.x, p.y);
        }
      } catch {
        /* External drops are ignored. */
      }
    },
    [project.id, props, rf],
  );
  const vp = project.viewports.find((x) => x.pageId === pageId);
  const defaultViewport = graph
    ? { x: 0, y: 0, zoom: 0.85 }
    : vp
      ? { x: vp.x, y: vp.y, zoom: vp.zoom }
      : { x: 0, y: 0, zoom: 1 };
  return (
    <div
      className="flow-area"
      data-testid="board"
      onDrop={drop}
      onDragOver={(e) => e.preventDefault()}
    >
      <ReactFlow<CardNode>
        nodes={liveNodes}
        onNodesChange={(changes) => {
          setLiveNodes((old) => applyNodeChanges(changes, old));
          for (const change of changes) {
            if (
              change.type === "position" &&
              change.dragging === false &&
              change.position &&
              !props.readOnly
            )
              props.onMove(change.id, change.position.x, change.position.y);
          }
        }}
        edges={edges}
        nodeTypes={nodeTypes}
        minZoom={0.1}
        maxZoom={4}
        defaultViewport={defaultViewport}
        nodesDraggable={!props.readOnly}
        nodesConnectable={false}
        deleteKeyCode={null}
        panOnScroll
        zoomOnScroll={false}
        zoomOnPinch
        zoomActivationKeyCode="Meta"
        selectionKeyCode="Shift"
        panActivationKeyCode="Space"
        onInit={() => {
          if (props.focusId)
            requestAnimationFrame(() =>
              requestAnimationFrame(() =>
                rf.fitView({
                  nodes: [{ id: props.focusId! }],
                  maxZoom: 1,
                  padding: 0.7,
                }),
              ),
            );
        }}
        onPaneClick={() => props.onSelect("")}
        onNodeClick={(_, n) =>
          props.onSelect(n.data.content.id, graph ? undefined : n.id)
        }
        onMoveEnd={(_, v) => !graph && props.onViewport(v)}
        proOptions={{ hideAttribution: false }}
      >
        <Background
          variant={BackgroundVariant.Lines}
          gap={40}
          color="#e7e5e4"
          lineWidth={0.6}
        />
      </ReactFlow>
      <div className="zoom-tools">
        <button aria-label="Zoom out" onClick={() => rf.zoomOut()}>
          <Minus />
        </button>
        <button onClick={() => rf.fitView({ padding: 0.25 })}>Fit</button>
        <button aria-label="Zoom in" onClick={() => rf.zoomIn()}>
          <Plus />
        </button>
        <button
          aria-label="Focus selected"
          onClick={() => {
            if (props.focusId)
              rf.fitView({
                nodes: [{ id: props.focusId }],
                maxZoom: 1,
                padding: 0.7,
              });
            else rf.fitView();
          }}
        >
          <Scan />
        </button>
      </div>
      {nodes.length === 0 && (
        <div className="board-empty">
          <span className="eyebrow">YOUR WORKSPACE</span>
          <h2>Give an idea some room.</h2>
          <p>Post a note in Saezutter, then add it to this page.</p>
        </div>
      )}
    </div>
  );
}
function Board(props: BoardProps) {
  return (
    <ReactFlowProvider>
      <Inner {...props} />
    </ReactFlowProvider>
  );
}
export default memo(
  Board,
  (a, b) =>
    a.project === b.project &&
    a.pageId === b.pageId &&
    a.mode === b.mode &&
    a.focusId === b.focusId &&
    a.readOnly === b.readOnly,
);
export const flatStyle: CSSProperties = { borderRadius: 0 };
