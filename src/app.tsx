import { useCallback, useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Plus,
  ArrowLeftToLine,
  ArrowRightToLine,
  Image as ImageIcon,
  Type,
  Upload,
  Download,
  FolderOpen,
  Network,
  LayoutDashboard,
  Trash2,
  Pencil,
  Link2,
  X,
  Play,
  Pause,
  Square,
  GripVertical,
  ChevronUp,
  ChevronDown,
  PanelLeftClose,
} from "lucide-react";
import {
  createProject,
  postText,
  place,
  revise,
  link,
  removeContent,
  removePage,
  uid,
  validateProject,
  type Project,
  type Asset,
} from "./domain/model";
import { db, saveProject, projectAssets } from "./storage/db";
import { imageAsset, audioAsset } from "./storage/media";
import ContentCard, { KindIcon } from "./components/ContentCard";
import Board from "./views/Board";
import Timeline, { useAudio, timeLabel } from "./audio/Timeline";
type Modal =
  | { kind: "text"; id: string; text: string }
  | { kind: "page"; id?: string; title: string; start: string; end: string }
  | { kind: "confirm"; title: string; body: string; action: () => void }
  | { kind: "project"; name: string }
  | { kind: "open" };
const message = (e: unknown) =>
  e instanceof Error ? e.message : "Operation failed";
export default function App() {
  const [project, setProject] = useState<Project>();
  const current = useRef<Project | undefined>(undefined);
  const queue = useRef(Promise.resolve());
  const writeId = useRef(0);
  const pendingAssets = useRef(new Map<string, Asset>());
  const [pageId, setPageId] = useState("");
  const [mode, setMode] = useState<"canvas" | "graph">("canvas");
  const [sidebar, setSidebar] = useState(true);
  const [rails, setRails] = useState(true);
  const [selected, setSelected] = useState("");
  const [selectedPlacement, setSelectedPlacement] = useState("");
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [saveState, setSaveState] = useState("Loading");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState<Modal>();
  const [busy, setBusyState] = useState(false);
  const busyRef = useRef(false);
  const setBusy = useCallback((value: boolean) => {
    busyRef.current = value;
    setBusyState(value);
  }, []);
  const [readOnly, setReadOnly] = useState(false);
  const readOnlyRef = useRef(false);
  readOnlyRef.current = readOnly;
  const [ready, setReady] = useState(false);
  const fileImage = useRef<HTMLInputElement>(null),
    fileAudio = useRef<HTMLInputElement>(null),
    fileProject = useRef<HTMLInputElement>(null);
  const allProjects = useLiveQuery(() => db.projects.toArray(), []);
  const player = useAudio(project?.activeAudioId);
  const audio = player.asset;
  const swap = useCallback((p: Project) => {
    current.current = p;
    setProject(p);
    const stored = localStorage.getItem("visualyrc.view." + p.id);
    const view: { pageId?: string; mode?: string; sidebar?: boolean } = {};
    try {
      const parsed: unknown = stored ? JSON.parse(stored) : {};
      if (parsed && typeof parsed === "object") {
        if ("pageId" in parsed && typeof parsed.pageId === "string")
          view.pageId = parsed.pageId;
        if ("mode" in parsed && typeof parsed.mode === "string")
          view.mode = parsed.mode;
        if ("sidebar" in parsed && typeof parsed.sidebar === "boolean")
          view.sidebar = parsed.sidebar;
      }
    } catch {
      /* Invalid local view preferences use defaults. */
    }
    setPageId(
      p.pages.some((x) => x.id === view.pageId) ? view.pageId! : p.pages[0].id,
    );
    setMode(view.mode === "graph" ? "graph" : "canvas");
    setSidebar(view.sidebar ?? true);
    setSelected("");
    setSelectedPlacement("");
    setSaveState("Saved");
    localStorage.setItem("visualyrc.active", p.id);
  }, []);
  useEffect(() => {
    let alive = true;
    let release: (() => void) | undefined;
    const init = async () => {
      try {
        if (!navigator.locks) {
          setReadOnly(true);
          setError(
            "This browser cannot acquire an editing lock. Read-only recovery is available.",
          );
        } else {
          await new Promise<void>((resolve) => {
            navigator.locks
              .request(
                "visualyrc-sketch-editor",
                { ifAvailable: true },
                (lock) => {
                  if (!alive) {
                    resolve();
                    return;
                  }
                  if (!lock) {
                    setReadOnly(true);
                    resolve();
                    return;
                  }
                  setReadOnly(false);
                  return new Promise<void>((done) => {
                    release = done;
                    resolve();
                  });
                },
              )
              .catch((e) => {
                setReadOnly(true);
                setError(message(e));
                resolve();
              });
          });
        }
        const id = localStorage.getItem("visualyrc.active");
        const list = await db.projects.orderBy("updatedAt").reverse().toArray();
        let p = id ? list.find((x) => x.id === id) : undefined;
        p ??= list[0];
        if (!p) {
          p = createProject();
          if (!alive) return;
          await saveProject(p);
        }
        if (alive) {
          swap(validateProject(p));
          setReady(true);
        }
      } catch (e) {
        if (alive) {
          setError("Local storage could not open: " + message(e));
          setSaveState("Error");
          setReady(true);
        }
      }
    };
    void init();
    return () => {
      alive = false;
      release?.();
    };
  }, [swap]);
  useEffect(() => {
    if (ready && project)
      localStorage.setItem(
        "visualyrc.view." + project.id,
        JSON.stringify({ pageId, mode, sidebar }),
      );
  }, [ready, project, pageId, mode, sidebar]);
  const run = useCallback(
    (change: (p: Project) => Project, assets: Asset[] = []) => {
      if (readOnlyRef.current || busyRef.current) return false;
      if (!current.current) return false;
      try {
        const next = change(current.current);
        current.current = next;
        setProject(next);
        setSaveState("Saving");
        const version = ++writeId.current;
        for (const a of assets) pendingAssets.current.set(a.id, a);
        const media = [...pendingAssets.current.values()].filter(
          (a) => a.projectId === next.id,
        );
        queue.current = queue.current
          .catch(() => undefined)
          .then(() => saveProject(next, media))
          .then(() => {
            for (const a of media) pendingAssets.current.delete(a.id);
            if (version === writeId.current) setSaveState("Saved");
          })
          .catch((e) => {
            setSaveState("Unsaved");
            setError(
              "Save failed; keep this tab open and export a recovery copy. " +
                message(e),
            );
          });
        return true;
      } catch (e) {
        setError(message(e));
        return false;
      }
    },
    [],
  );
  useEffect(() => {
    const leave = (e: BeforeUnloadEvent) => {
      if (saveState === "Unsaved" || saveState === "Saving") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, [saveState]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.code === "Space" &&
        !e.repeat &&
        !e.metaKey &&
        !e.ctrlKey &&
        !(
          e.target instanceof HTMLElement &&
          e.target.closest(
            "input,textarea,select,button,[contenteditable],.react-flow",
          )
        ) &&
        audio
      ) {
        e.preventDefault();
        void player.toggle();
      }
      if (e.key === "Escape") setModal(undefined);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [audio, player]);
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const el =
        e.target instanceof Element
          ? e.target.closest<HTMLElement>("button.magnetic")
          : null;
      if (
        !el ||
        e.pointerType === "touch" ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        return;
      const r = el.getBoundingClientRect();
      el.style.setProperty(
        "--mx",
        `${((e.clientX - r.x - r.width / 2) / r.width) * 3}px`,
      );
      el.style.setProperty(
        "--my",
        `${((e.clientY - r.y - r.height / 2) / r.height) * 3}px`,
      );
    };
    document.addEventListener("pointermove", move);
    return () => document.removeEventListener("pointermove", move);
  }, []);
  const onEdit = useCallback((id: string) => {
    const n = current.current?.nodes.find((n) => n.id === id);
    if (n?.kind === "text") setModal({ kind: "text", id, text: n.text });
  }, []);
  const onSize = useCallback(
    (id: string, w: number, h: number, x: number, y: number) =>
      run((p) =>
        revise(p, (n) => {
          const a = n.placements.find((a) => a.id === id);
          if (a) Object.assign(a, { width: w, height: h, x, y });
        }),
      ),
    [run],
  );
  const select = useCallback((id: string, placement?: string) => {
    setSelected(id);
    setSelectedPlacement(placement ?? "");
  }, []);
  const addPlacement = async (id: string, x?: number, y?: number) => {
    const originId = current.current?.id;
    const node = current.current?.nodes.find((n) => n.id === id);
    const asset =
      node?.kind === "image" ? await db.assets.get(node.assetId) : undefined;
    if (current.current?.id !== originId) return;
    const width = asset?.width ? Math.min(420, asset.width) : 280,
      height =
        asset?.width && asset.height
          ? (width * asset.height) / asset.width
          : 170;
    run((p) =>
      place(
        p,
        id,
        pageId,
        x ??
          100 +
            (p.placements.filter((x) => x.pageId === pageId).length % 3) * 60,
        y ??
          100 +
            (p.placements.filter((x) => x.pageId === pageId).length % 4) * 60,
        width,
        height,
      ),
    );
    setNotice("Reference added to this page.");
  };
  const uploadImage = async (file?: File) => {
    if (!file || !project || readOnlyRef.current || busyRef.current) return;
    try {
      const a = await imageAsset(file, project.id);
      if (current.current?.id !== project.id) {
        setError(
          "Project changed while loading the image. Attach it again in the intended project.",
        );
        return;
      }
      if (busyRef.current)
        throw Error(
          "Another operation is running. Attach the image again when it finishes.",
        );
      run(
        (p) =>
          revise(p, (n) => {
            const id = uid(),
              now = new Date().toISOString();
            n.nodes.push({
              id,
              kind: "image",
              assetId: a.id,
              altText: a.name,
              createdAt: now,
              updatedAt: now,
            });
            n.posts.unshift({ id: uid(), nodeId: id, postedAt: now });
          }),
        [a],
      );
    } catch (e) {
      setError(message(e));
    }
  };
  const uploadAudio = async (file?: File) => {
    if (!file || !project || readOnlyRef.current || busyRef.current) return;
    setBusy(true);
    try {
      const a = await audioAsset(file, project.id);
      if (current.current?.id !== project.id)
        throw Error("Project changed while loading audio. Try again.");
      setBusy(false);
      const apply = () => {
        player.stop();
        run(
          (p) =>
            revise(p, (n) => {
              n.activeAudioId = a.id;
              for (const page of n.pages) delete page.audioRange;
            }),
          [a],
        );
      };
      if (project.activeAudioId)
        setModal({
          kind: "confirm",
          title: "Replace audio?",
          body: "Existing page time ranges will be cleared. All pages and content stay.",
          action: apply,
        });
      else apply();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  };
  const exportProject = async () => {
    if (!current.current) return;
    setBusy(true);
    try {
      await queue.current;
      const p = current.current;
      const stored = await projectAssets(p);
      const assets = [
        ...new Map(
          [...stored, ...pendingAssets.current.values()]
            .filter((a) => a.projectId === p.id)
            .map((a) => [a.id, a]),
        ).values(),
      ];
      const estimate = assets.reduce((n, a) => n + a.blob.size, 0);
      if (estimate > 140 * 1024 * 1024)
        throw Error("Project media exceeds the 140 MiB portable export limit.");
      const { exportArchive } = await import("./storage/archive");
      const blob = await exportArchive(p, assets);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = p.name.replace(/[^\p{L}\p{N}_ -]/gu, "_") + ".vsketch";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("Project exported with original media.");
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  };
  const importProject = async (file?: File) => {
    if (!file || readOnly || saveState !== "Saved") return;
    setBusy(true);
    try {
      await queue.current;
      const { importArchive } = await import("./storage/archive");
      const result = await importArchive(file);
      for (const a of result.assets) {
        const f = new File([a.blob], a.name, { type: a.mime });
        const checked =
          a.kind === "image"
            ? await imageAsset(f, result.project.id)
            : await audioAsset(f, result.project.id);
        if (a.kind === "image") {
          a.width = checked.width;
          a.height = checked.height;
        } else if (
          a.duration &&
          Math.abs((checked.duration ?? 0) - a.duration) > 0.1
        )
          throw Error("Audio duration does not match archive");
      }
      await saveProject(result.project, result.assets);
      swap(result.project);
      setNotice("Imported as a new project. Existing work is preserved.");
    } catch (e) {
      setError("Import rejected. Existing work is unchanged. " + message(e));
    } finally {
      setBusy(false);
    }
  };
  const confirm = (title: string, body: string, action: () => void) =>
    setModal({ kind: "confirm", title, body, action });
  const selectedNode = project?.nodes.find((n) => n.id === selected);
  const activePage =
    project?.pages.find((p) => p.id === pageId) ?? project?.pages[0];
  const editPage = (id?: string) => {
    const p = project?.pages.find((p) => p.id === id);
    setModal({
      kind: "page",
      id,
      title: p?.title ?? "New page",
      start: p?.audioRange ? String(p.audioRange.start) : "",
      end: p?.audioRange ? String(p.audioRange.end) : "",
    });
  };
  const changePage = (id: string) => {
    setPageId(id);
    setSelected("");
    setSelectedPlacement("");
  };
  const removeActions = (id: string) => (
    <>
      <button
        aria-label="Remove from feed"
        title="Remove from feed"
        onClick={() =>
          confirm(
            "Remove from feed?",
            "The content, placements and graph links stay.",
            () =>
              run((p) =>
                revise(p, (n) => {
                  n.posts = n.posts.filter((x) => x.nodeId !== id);
                }),
              ),
          )
        }
      >
        <X size={14} />
      </button>
      <button
        aria-label="Delete content everywhere"
        title="Delete content everywhere"
        onClick={() =>
          confirm(
            "Delete content everywhere?",
            "This removes all placements, the post and incident relationships. Export a backup to preserve it.",
            () => run((p) => removeContent(p, id)),
          )
        }
      >
        <Trash2 size={14} />
      </button>
    </>
  );
  if (!ready) return <main className="loading">Opening local workspace…</main>;
  return (
    <main className="app" onClick={() => notice && setNotice("")}>
      <header className="header">
        <span className="brand">VISUALYRC SKETCH</span>
        <button
          className="project-title"
          disabled={busy || saveState === "Saving" || saveState === "Unsaved"}
          onClick={() => setModal({ kind: "open" })}
        >
          <FolderOpen size={16} />
          {project?.name ?? "Local workspace"}
        </button>
        <div className="header-spacer" />
        <nav className="mode-switch">
          <button
            className={"magnetic " + (mode === "canvas" ? "active" : "")}
            onClick={() => setMode("canvas")}
          >
            <LayoutDashboard size={14} />
            Canvas
          </button>
          <button
            className={"magnetic " + (mode === "graph" ? "active" : "")}
            onClick={() => {
              setMode("graph");
              setSidebar(false);
            }}
          >
            <Network size={14} />
            Graph
          </button>
        </nav>
        <span
          className={
            "save-indicator " + (saveState === "Unsaved" ? "warning" : "")
          }
          role="status"
        >
          {readOnly ? "Read-only · another editor" : saveState}
        </span>
        <button
          title="Export project"
          aria-label="Export project"
          disabled={busy || !project}
          onClick={() => void exportProject()}
        >
          <Download />
        </button>
        <button
          title="Import project"
          aria-label="Import project"
          disabled={busy || readOnly || saveState !== "Saved"}
          onClick={() => fileProject.current?.click()}
        >
          <Upload />
        </button>
      </header>
      {player.error && (
        <div role="alert" className="error-banner">
          {player.error}
        </div>
      )}
      {error && (
        <div role="alert" className="error-banner">
          {error}
          <button aria-label="Dismiss error" onClick={() => setError("")}>
            <X />
          </button>
          {saveState === "Unsaved" && (
            <button onClick={() => run((p) => p)}>Retry save</button>
          )}
        </div>
      )}
      {notice && (
        <div className="notice" role="status">
          {notice}
        </div>
      )}
      {readOnly && (
        <div className="readonly-banner">
          This workspace is read-only. Close the other editor tab, then reload
          this tab.
        </div>
      )}
      {project && (
        <>
          {(mode === "canvas" || audio) && (
            <section
              className={
                "transport " + (mode === "graph" ? "graph-transport" : "")
              }
              aria-label="Audio transport"
            >
              <button
                disabled={busy || readOnly}
                onClick={() => fileAudio.current?.click()}
              >
                {audio ? "Replace audio" : "Load audio"}
              </button>
              <span className="audio-name">
                {audio?.name ?? "Audio is optional"}
              </span>
              <button
                className="magnetic primary"
                aria-label={player.playing ? "Pause" : "Play"}
                disabled={!audio}
                onClick={() => void player.toggle()}
              >
                {player.playing ? <Pause /> : <Play />}
              </button>
              <button
                className="magnetic"
                aria-label="Stop"
                disabled={!audio}
                onClick={player.stop}
              >
                <Square />
              </button>
              <span className="mono player-time" data-testid="playback-time">
                {timeLabel(player.time)} / {timeLabel(audio?.duration ?? 0)}
              </span>
              {audio && (
                <>
                  <label className="follow">
                    <input
                      type="checkbox"
                      checked={player.follow}
                      onChange={(e) => player.setFollow(e.target.checked)}
                    />
                    Follow
                  </label>
                  <button
                    onClick={() =>
                      confirm(
                        "Remove audio?",
                        "Content stays. Section timings will be cleared.",
                        () => {
                          player.stop();
                          run((p) =>
                            revise(p, (n) => {
                              delete n.activeAudioId;
                              for (const page of n.pages)
                                delete page.audioRange;
                            }),
                          );
                        },
                      )
                    }
                    aria-label="Remove audio"
                  >
                    <X />
                  </button>
                </>
              )}
              <span className="header-spacer" />
              {mode === "canvas" && (
                <button
                  aria-label="Toggle page rail"
                  onClick={() => setRails(!rails)}
                >
                  <PanelLeftClose />
                </button>
              )}
            </section>
          )}
          <div className="workspace">
            {mode === "canvas" && rails && (
              <aside className={"page-navigation " + (audio ? "timed" : "")}>
                {audio ? (
                  <Timeline
                    asset={audio}
                    time={player.time}
                    follow={player.follow}
                    seek={player.seek}
                    pages={project.pages}
                    activeId={pageId}
                    onPage={changePage}
                    onEdit={editPage}
                    onPlay={(t) => {
                      player.seek(t);
                      if (!player.playing) void player.toggle();
                    }}
                  />
                ) : (
                  <>
                    <div className="rail-title">
                      PAGES
                      <button
                        aria-label="Add page"
                        disabled={busy || readOnly}
                        onClick={() => editPage()}
                      >
                        <Plus />
                      </button>
                    </div>
                    {[...project.pages]
                      .sort((a, b) => a.order - b.order)
                      .map((p, i) => (
                        <div className="page-row" key={p.id}>
                          <button
                            className={
                              "page-button magnetic " +
                              (pageId === p.id ? "selected" : "")
                            }
                            onClick={() => changePage(p.id)}
                          >
                            <span className="mono">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            {p.title}
                          </button>
                          <button
                            className="page-edit"
                            aria-label={"Edit page " + p.title}
                            onClick={() => editPage(p.id)}
                          >
                            <Pencil size={12} />
                          </button>
                        </div>
                      ))}
                  </>
                )}
                {audio && (
                  <button
                    className="add-section"
                    disabled={busy || readOnly}
                    onClick={() => editPage()}
                  >
                    <Plus size={13} />
                    Add page / section
                  </button>
                )}
              </aside>
            )}
            <section
              className="canvas-shell"
              aria-label={
                mode === "canvas" ? "Canvas workspace" : "Graph workspace"
              }
            >
              <div className="canvas-toolbar">
                <span className="eyebrow">
                  {mode === "canvas"
                    ? `${String([...project.pages].sort((a, b) => a.order - b.order).findIndex((p) => p.id === pageId) + 1).padStart(2, "0")} / ${activePage?.title.toUpperCase()}`
                    : "PROJECT RELATIONSHIPS"}
                </span>
                {mode === "graph" && (
                  <input
                    aria-label="Search nodes"
                    placeholder="Search nodes…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                )}
                <span className="header-spacer" />
                {mode === "canvas" && (
                  <>
                    <button
                      aria-label="New text"
                      disabled={busy || readOnly}
                      onClick={() => {
                        setSidebar(true);
                        setTimeout(
                          () => document.getElementById("composer")?.focus(),
                          0,
                        );
                      }}
                    >
                      <Type />
                    </button>
                    <button
                      aria-label="Add image"
                      disabled={busy || readOnly}
                      onClick={() => fileImage.current?.click()}
                    >
                      <ImageIcon />
                    </button>
                    <button
                      aria-label="Add page"
                      disabled={busy || readOnly}
                      onClick={() => editPage()}
                    >
                      <Plus />
                    </button>
                  </>
                )}
                <button
                  aria-label={sidebar ? "Collapse Saezutter" : "Open Saezutter"}
                  onClick={() => setSidebar(!sidebar)}
                >
                  {sidebar ? <ArrowRightToLine /> : <ArrowLeftToLine />}
                </button>
              </div>
              <Board
                key={mode + pageId}
                project={
                  mode === "graph" && search
                    ? {
                        ...project,
                        nodes: project.nodes.filter((n) =>
                          n.kind === "text"
                            ? n.text
                                .toLowerCase()
                                .includes(search.toLowerCase())
                            : n.altText
                                .toLowerCase()
                                .includes(search.toLowerCase()),
                        ),
                        edges: project.edges.filter((e) =>
                          [e.source, e.target].every((id) =>
                            project.nodes.some(
                              (n) =>
                                n.id === id &&
                                (n.kind === "text" ? n.text : n.altText)
                                  .toLowerCase()
                                  .includes(search.toLowerCase()),
                            ),
                          ),
                        ),
                      }
                    : project
                }
                pageId={pageId}
                mode={mode}
                readOnly={readOnly || busy}
                focusId={mode === "graph" ? selected : selectedPlacement}
                onSelect={select}
                onEdit={onEdit}
                onSize={readOnly ? () => {} : onSize}
                onMove={(id, x, y) =>
                  run((p) =>
                    revise(p, (n) => {
                      if (mode === "graph") {
                        n.graph = n.graph.filter((g) => g.nodeId !== id);
                        n.graph.push({ nodeId: id, x, y });
                      } else {
                        const a = n.placements.find((a) => a.id === id);
                        if (a) Object.assign(a, { x, y });
                      }
                    }),
                  )
                }
                onDrop={(id, x, y) => !readOnly && addPlacement(id, x, y)}
                onViewport={(v) => {
                  if (readOnly) return;
                  const old = current.current?.viewports.find(
                    (x) => x.pageId === pageId,
                  );
                  if (
                    !old ||
                    Math.abs(old.x - v.x) > 0.5 ||
                    Math.abs(old.y - v.y) > 0.5 ||
                    Math.abs(old.zoom - v.zoom) > 0.001
                  )
                    run((p) =>
                      revise(p, (n) => {
                        n.viewports = n.viewports.filter(
                          (x) => x.pageId !== pageId,
                        );
                        n.viewports.push({ pageId, ...v });
                      }),
                    );
                }}
              />
              {selectedNode && (
                <div className="selection-tray">
                  <KindIcon kind={selectedNode.kind} />
                  <span className="tray-name">
                    {selectedNode.kind === "text"
                      ? selectedNode.text
                      : selectedNode.altText}
                  </span>
                  <button
                    aria-label="Edit selected text"
                    disabled={busy || readOnly || selectedNode.kind !== "text"}
                    onClick={() => onEdit(selected)}
                  >
                    <Pencil size={14} />
                  </button>
                  {mode === "canvas" && selectedPlacement && (
                    <>
                      <label>
                        X
                        <input
                          aria-label="Placement X"
                          type="number"
                          value={Math.round(
                            project.placements.find(
                              (p) => p.id === selectedPlacement,
                            )?.x ?? 0,
                          )}
                          onChange={(e) => {
                            const a = project.placements.find(
                              (p) => p.id === selectedPlacement,
                            );
                            if (a)
                              onSize(
                                a.id,
                                a.width,
                                a.height,
                                +e.target.value,
                                a.y,
                              );
                          }}
                        />
                      </label>
                      <label>
                        Y
                        <input
                          aria-label="Placement Y"
                          type="number"
                          value={Math.round(
                            project.placements.find(
                              (p) => p.id === selectedPlacement,
                            )?.y ?? 0,
                          )}
                          onChange={(e) => {
                            const a = project.placements.find(
                              (p) => p.id === selectedPlacement,
                            );
                            if (a)
                              onSize(
                                a.id,
                                a.width,
                                a.height,
                                a.x,
                                +e.target.value,
                              );
                          }}
                        />
                      </label>
                      <label>
                        W
                        <input
                          aria-label="Placement width"
                          type="number"
                          min="120"
                          value={Math.round(
                            project.placements.find(
                              (p) => p.id === selectedPlacement,
                            )?.width ?? 280,
                          )}
                          onChange={(e) => {
                            const a = project.placements.find(
                              (p) => p.id === selectedPlacement,
                            );
                            if (a && +e.target.value >= 120)
                              onSize(
                                a.id,
                                +e.target.value,
                                selectedNode.kind === "image"
                                  ? (a.height / a.width) * +e.target.value
                                  : a.height,
                                a.x,
                                a.y,
                              );
                          }}
                        />
                      </label>
                      <label>
                        H
                        <input
                          aria-label="Placement height"
                          type="number"
                          min="64"
                          value={Math.round(
                            project.placements.find(
                              (p) => p.id === selectedPlacement,
                            )?.height ?? 170,
                          )}
                          onChange={(e) => {
                            const a = project.placements.find(
                              (p) => p.id === selectedPlacement,
                            );
                            if (a && +e.target.value >= 64)
                              onSize(
                                a.id,
                                selectedNode.kind === "image"
                                  ? (a.width / a.height) * +e.target.value
                                  : a.width,
                                +e.target.value,
                                a.x,
                                a.y,
                              );
                          }}
                        />
                      </label>
                      <button
                        aria-label="Remove placement"
                        disabled={busy || readOnly}
                        onClick={() => {
                          run((p) =>
                            revise(p, (n) => {
                              n.placements = n.placements.filter(
                                (a) => a.id !== selectedPlacement,
                              );
                            }),
                          );
                          setSelected("");
                        }}
                      >
                        <X size={14} />
                      </button>
                    </>
                  )}
                  {mode === "graph" && (
                    <>
                      <select
                        aria-label="Link target"
                        id="link-target"
                        defaultValue=""
                      >
                        <option value="">Choose node to link…</option>
                        {project.nodes
                          .filter((n) => n.id !== selected)
                          .map((n) => (
                            <option key={n.id} value={n.id}>
                              {n.kind === "text"
                                ? n.text.slice(0, 40)
                                : n.altText}
                            </option>
                          ))}
                      </select>
                      <button
                        disabled={busy || readOnly}
                        aria-label="Link nodes"
                        onClick={() => {
                          const target = document.getElementById("link-target");
                          if (
                            target instanceof HTMLSelectElement &&
                            target.value
                          )
                            run((p) => link(p, selected, target.value));
                        }}
                      >
                        <Link2 size={14} />
                      </button>
                      <select
                        aria-label="Open placement location"
                        value=""
                        onChange={(e) => {
                          const a = project.placements.find(
                            (p) => p.id === e.target.value,
                          );
                          if (a) {
                            setPageId(a.pageId);
                            setMode("canvas");
                            setSelectedPlacement(a.id);
                            setSidebar(true);
                          }
                        }}
                      >
                        <option value="">Open in page…</option>
                        {project.placements
                          .filter((p) => p.nodeId === selected)
                          .map((a) => (
                            <option key={a.id} value={a.id}>
                              {
                                project.pages.find((p) => p.id === a.pageId)
                                  ?.title
                              }
                            </option>
                          ))}
                      </select>
                      <button
                        disabled={busy || readOnly}
                        onClick={() => addPlacement(selected)}
                      >
                        Add to page
                      </button>
                    </>
                  )}
                  <button
                    aria-label="Delete selected content everywhere"
                    disabled={busy || readOnly}
                    onClick={() =>
                      confirm(
                        "Delete content everywhere?",
                        "All placements, its post and relationships will be removed. Export first to preserve a copy.",
                        () => {
                          run((p) => removeContent(p, selected));
                          setSelected("");
                        },
                      )
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    aria-label="Clear selection"
                    onClick={() => setSelected("")}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              {mode === "graph" &&
                selected &&
                project.edges.some(
                  (e) => e.source === selected || e.target === selected,
                ) && (
                  <div
                    className="edge-list"
                    aria-label="Selected relationships"
                  >
                    {project.edges
                      .filter(
                        (e) => e.source === selected || e.target === selected,
                      )
                      .map((e) => (
                        <button
                          key={e.id}
                          disabled={busy || readOnly}
                          onClick={() =>
                            run((p) =>
                              revise(p, (n) => {
                                n.edges = n.edges.filter((x) => x.id !== e.id);
                              }),
                            )
                          }
                        >
                          Unlink{" "}
                          {project.nodes.find(
                            (n) =>
                              n.id ===
                              (e.source === selected ? e.target : e.source),
                          )?.kind === "text"
                            ? "note"
                            : "image"}
                          <X size={12} />
                        </button>
                      ))}
                  </div>
                )}
            </section>
            {sidebar ? (
              <aside className="saezutter" aria-label="Saezutter sidebar">
                <div className="sidebar-title">
                  SAEZUTTER
                  <button
                    aria-label="Collapse sidebar"
                    onClick={() => setSidebar(false)}
                  >
                    <ArrowRightToLine />
                  </button>
                </div>
                <div className="feed">
                  {project.posts.length === 0 && (
                    <div className="feed-empty">
                      A thought, a reference,
                      <br />a place to start.
                    </div>
                  )}
                  {project.posts.map((post) => {
                    const n = project.nodes.find((n) => n.id === post.nodeId);
                    return (
                      n && (
                        <article
                          className={
                            "post-card " + (selected === n.id ? "selected" : "")
                          }
                          key={post.id}
                          draggable={!readOnly}
                          onDragStart={(e) => {
                            e.dataTransfer.setData(
                              "application/visualyrc-node",
                              JSON.stringify({
                                projectId: project.id,
                                nodeId: n.id,
                              }),
                            );
                          }}
                          onClick={() => select(n.id)}
                          data-testid="post"
                        >
                          <div className="post-meta">
                            <KindIcon kind={n.kind} />
                            <time>
                              {new Date(post.postedAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              })}
                            </time>
                            <GripVertical size={13} />
                          </div>
                          <ContentCard content={n} />
                          <div className="post-actions">
                            <button
                              aria-label="Add post to page"
                              disabled={busy || readOnly}
                              onClick={(e) => {
                                e.stopPropagation();
                                addPlacement(n.id);
                              }}
                            >
                              <Plus size={14} />
                              Place
                            </button>
                            {n.kind === "text" && (
                              <button
                                aria-label="Edit post"
                                disabled={busy || readOnly}
                                onClick={() => onEdit(n.id)}
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                            {!readOnly && removeActions(n.id)}
                          </div>
                        </article>
                      )
                    );
                  })}
                </div>
                <form
                  className="composer"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!draft.trim()) return;
                    if (run((p) => postText(p, draft))) setDraft("");
                  }}
                >
                  <textarea
                    id="composer"
                    aria-label="Write a note"
                    placeholder="Write a note…"
                    value={draft}
                    maxLength={100000}
                    disabled={busy || readOnly}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        e.currentTarget.form?.requestSubmit();
                      }
                    }}
                  />
                  <div className="composer-tools">
                    <button
                      type="button"
                      aria-label="Attach image"
                      disabled={busy || readOnly}
                      onClick={() => fileImage.current?.click()}
                    >
                      <ImageIcon />
                    </button>
                    <span className="header-spacer" />
                    <button
                      className="primary"
                      disabled={busy || readOnly || !draft.trim()}
                    >
                      Post
                    </button>
                  </div>
                </form>
              </aside>
            ) : (
              <aside className="sidebar-closed">
                <button
                  aria-label="Expand Saezutter"
                  onClick={() => setSidebar(true)}
                >
                  <ArrowLeftToLine />
                </button>
                <span>SAEZUTTER</span>
              </aside>
            )}
          </div>
        </>
      )}
      <input
        ref={fileImage}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={(e) => {
          void uploadImage(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={fileAudio}
        type="file"
        accept=".wav,.mp3,audio/wav,audio/mpeg"
        hidden
        onChange={(e) => {
          void uploadAudio(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={fileProject}
        type="file"
        accept=".vsketch"
        hidden
        onChange={(e) => {
          void importProject(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {modal && (
        <div className="modal-backdrop">
          <section
            role="dialog"
            aria-modal="true"
            aria-label={
              modal.kind === "confirm"
                ? modal.title
                : modal.kind === "text"
                  ? "Edit text"
                  : modal.kind === "page"
                    ? "Page settings"
                    : modal.kind === "open"
                      ? "Open project"
                      : "New project"
            }
            className="dialog"
          >
            <button
              className="dialog-close"
              aria-label="Close dialog"
              onClick={() => setModal(undefined)}
            >
              <X />
            </button>
            {modal.kind === "text" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!modal.text.trim()) return;
                  run((p) =>
                    revise(p, (n) => {
                      const node = n.nodes.find((n) => n.id === modal.id);
                      if (node?.kind === "text") {
                        node.text = modal.text;
                        node.updatedAt = new Date().toISOString();
                      }
                    }),
                  );
                  setModal(undefined);
                }}
              >
                <h2>Edit shared text</h2>
                <p>Changes appear in every reference.</p>
                <textarea
                  autoFocus
                  aria-label="Text content"
                  maxLength={100000}
                  value={modal.text}
                  onChange={(e) => setModal({ ...modal, text: e.target.value })}
                />
                <button
                  className="primary"
                  disabled={busy || readOnly || !modal.text.trim()}
                >
                  Save text
                </button>
              </form>
            )}
            {modal.kind === "confirm" && (
              <>
                <h2>{modal.title}</h2>
                <p>{modal.body}</p>
                <div className="dialog-actions">
                  <button onClick={() => setModal(undefined)}>Cancel</button>
                  <button
                    className="primary"
                    disabled={busy || readOnly}
                    onClick={() => {
                      modal.action();
                      setModal(undefined);
                    }}
                  >
                    Confirm
                  </button>
                </div>
              </>
            )}
            {modal.kind === "page" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  try {
                    const start = Number(modal.start),
                      end = Number(modal.end);
                    if (
                      (modal.start || modal.end) &&
                      (!audio ||
                        modal.start === "" ||
                        modal.end === "" ||
                        end > (audio.duration ?? 0))
                    )
                      throw Error(
                        "Enter a valid start/end within the audio duration.",
                      );
                    const next = revise(project!, (n) => {
                      let page = n.pages.find((p) => p.id === modal.id);
                      if (!page) {
                        page = {
                          id: uid(),
                          title: modal.title.trim(),
                          order: n.pages.length,
                        };
                        n.pages.push(page);
                      }
                      page.title = modal.title.trim();
                      if (modal.start !== "" && modal.end !== "" && audio)
                        page.audioRange = { assetId: audio.id, start, end };
                      else delete page.audioRange;
                    });
                    run(() => next);
                    setModal(undefined);
                  } catch (e) {
                    setError(message(e));
                  }
                }}
              >
                <h2>Page settings</h2>
                <label>
                  Title
                  <input
                    autoFocus
                    aria-label="Page title"
                    value={modal.title}
                    onChange={(e) =>
                      setModal({ ...modal, title: e.target.value })
                    }
                  />
                </label>
                {audio && (
                  <div className="range-fields">
                    <label>
                      Start (seconds)
                      <input
                        aria-label="Section start"
                        type="number"
                        min="0"
                        step=".1"
                        value={modal.start}
                        onChange={(e) =>
                          setModal({ ...modal, start: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      End (seconds)
                      <input
                        aria-label="Section end"
                        type="number"
                        min="0"
                        step=".1"
                        value={modal.end}
                        onChange={(e) =>
                          setModal({ ...modal, end: e.target.value })
                        }
                      />
                    </label>
                  </div>
                )}
                <div className="dialog-actions">
                  {modal.id && (
                    <>
                      <button
                        type="button"
                        aria-label="Move page earlier"
                        onClick={() =>
                          run((p) =>
                            revise(p, (n) => {
                              const order = [...n.pages].sort(
                                  (a, b) => a.order - b.order,
                                ),
                                i = order.findIndex((x) => x.id === modal.id);
                              if (i > 0)
                                [order[i], order[i - 1]] = [
                                  order[i - 1],
                                  order[i],
                                ];
                              order.forEach((x, i) => (x.order = i));
                            }),
                          )
                        }
                      >
                        <ChevronUp />
                      </button>
                      <button
                        type="button"
                        aria-label="Move page later"
                        onClick={() =>
                          run((p) =>
                            revise(p, (n) => {
                              const order = [...n.pages].sort(
                                  (a, b) => a.order - b.order,
                                ),
                                i = order.findIndex((x) => x.id === modal.id);
                              if (i < order.length - 1)
                                [order[i], order[i + 1]] = [
                                  order[i + 1],
                                  order[i],
                                ];
                              order.forEach((x, i) => (x.order = i));
                            }),
                          )
                        }
                      >
                        <ChevronDown />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete page"
                        disabled={
                          busy || readOnly || project!.pages.length === 1
                        }
                        onClick={() =>
                          confirm(
                            "Delete page?",
                            "Its placements will be removed. Shared content and links stay.",
                            () => {
                              run((p) => removePage(p, modal.id!));
                              changePage(
                                project!.pages.find((p) => p.id !== modal.id)!
                                  .id,
                              );
                            },
                          )
                        }
                      >
                        <Trash2 />
                      </button>
                    </>
                  )}
                  <span className="header-spacer" />
                  <button
                    className="primary"
                    disabled={busy || readOnly || !modal.title.trim()}
                  >
                    Save page
                  </button>
                </div>
              </form>
            )}
            {modal.kind === "open" && (
              <>
                <h2>Your local projects</h2>
                <p>
                  Stored in this browser. Export a .vsketch file to keep a
                  portable copy.
                </p>
                <div className="project-list">
                  {allProjects?.map((p) => (
                    <button
                      key={p.id}
                      disabled={busy || saveState !== "Saved"}
                      onClick={() => {
                        if (busyRef.current || saveState !== "Saved") return;
                        setBusy(true);
                        void queue.current
                          .then(async () => {
                            const latest =
                              current.current?.id === p.id
                                ? current.current
                                : await db.projects.get(p.id);
                            if (latest) swap(validateProject(latest));
                            setModal(undefined);
                          })
                          .catch((e) => setError(message(e)))
                          .finally(() => setBusy(false));
                      }}
                    >
                      {p.name}
                      <span>{p.nodes.length} items</span>
                    </button>
                  ))}
                </div>
                <button
                  disabled={busy || readOnly || saveState !== "Saved"}
                  onClick={() => setModal({ kind: "project", name: "" })}
                >
                  <Plus />
                  New project
                </button>
              </>
            )}
            {modal.kind === "project" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (readOnly || busy || saveState !== "Saved") return;
                  const p = createProject(modal.name);
                  setBusy(true);
                  void saveProject(p)
                    .then(() => {
                      swap(p);
                      setModal(undefined);
                    })
                    .catch((e) => setError(message(e)))
                    .finally(() => setBusy(false));
                }}
              >
                <h2>New project</h2>
                <input
                  autoFocus
                  aria-label="Project name"
                  maxLength={200}
                  value={modal.name}
                  onChange={(e) => setModal({ ...modal, name: e.target.value })}
                />
                <button
                  disabled={busy || !modal.name.trim() || readOnly}
                  className="primary"
                >
                  Create project
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
