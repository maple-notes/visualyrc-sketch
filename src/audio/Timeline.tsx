import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pencil } from "lucide-react";
import { db } from "../storage/db";
import { useLiveQuery } from "dexie-react-hooks";
import { pageReorderProps } from "../components/pageReorder";
import {
  trimRange,
  timelineExtent,
  type Asset,
  type Page,
} from "../domain/model";
export function timeLabel(t: number) {
  const n = Math.max(0, Math.floor(Math.round(t * 1000) / 1000));
  return `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
}
export function useAudio(id?: string) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const storedAsset = useLiveQuery(
    () => (id ? db.assets.get(id) : undefined),
    [id],
  );
  const asset = storedAsset?.id === id ? storedAsset : undefined;
  const [time, setTime] = useState(0),
    [playing, setPlaying] = useState(false),
    [follow, setFollow] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    let live = true,
      url = "";
    setTime(0);
    setPlaying(false);
    setError("");
    const el = new Audio();
    ref.current = el;
    el.onplay = () => setPlaying(true);
    el.onpause = () => setPlaying(false);
    el.onended = () => {
      setTime(el.duration);
      setPlaying(false);
    };
    el.onerror = () =>
      setError("Audio playback failed. Try reloading the audio file.");
    if (asset) {
      url = URL.createObjectURL(asset.blob);
      el.src = url;
    }
    const timer = setInterval(() => {
      if (live)
        setTime((t) =>
          el.ended
            ? el.duration
            : Math.abs(t - el.currentTime) > 0.05
              ? el.currentTime
              : t,
        );
    }, 100);
    return () => {
      live = false;
      clearInterval(timer);
      el.pause();
      el.removeAttribute("src");
      el.load();
      if (url) URL.revokeObjectURL(url);
    };
  }, [asset]);
  const toggle = useCallback(async () => {
    const el = ref.current;
    if (!el?.src) return;
    try {
      if (el.paused) {
        if (el.ended) el.currentTime = 0;
        await el.play();
      } else el.pause();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Playback failed");
    }
  }, []);
  const seek = useCallback((value: number) => {
    const el = ref.current;
    if (el) {
      el.currentTime = Math.max(
        0,
        Math.min(Number.isFinite(el.duration) ? el.duration : 0, value),
      );
      setTime(el.currentTime);
    }
  }, []);
  const stop = useCallback(() => {
    ref.current?.pause();
    seek(0);
  }, [seek]);
  return { asset, time, playing, follow, setFollow, toggle, seek, stop, error };
}
export default function Timeline({
  asset,
  time,
  follow,
  seek,
  pages,
  activeId,
  onPage,
  onEdit,
  onPlay,
  onTrim,
  onReorder,
  readOnly,
}: {
  asset: Asset;
  time: number;
  follow: boolean;
  seek: (t: number) => void;
  pages: Page[];
  activeId: string;
  onPage: (id: string) => void;
  onEdit: (id: string) => void;
  onPlay: (time: number) => void;
  onTrim: (pageId: string, edge: "start" | "end", seconds: number) => void;
  onReorder: (id: string, target: string, after: boolean) => void;
  readOnly: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    scroll = useRef<HTMLDivElement>(null);
  const drag = useRef<
    | {
        pageId: string;
        edge: "start" | "end";
        startY: number;
        original: number;
        value: number;
      }
    | undefined
  >(undefined);
  const [preview, setPreview] = useState<{
    pageId: string;
    range: NonNullable<Page["audioRange"]>;
  }>();
  const [peaks, setPeaks] = useState<Float32Array>();
  const [error, setError] = useState("");
  const duration = asset.duration ?? 1,
    scale = Math.max(4, 760 / duration),
    height = duration * scale,
    extent = timelineExtent(pages, duration);
  const previousCount = useRef(pages.length);
  useEffect(() => {
    if (pages.length > previousCount.current && scroll.current) {
      const r = pages.find((p) => p.id === activeId)?.audioRange;
      if (r) scroll.current.scrollTop = Math.max(0, r.start * scale - 45);
    }
    previousCount.current = pages.length;
  }, [pages, activeId, scale]);
  useEffect(() => {
    let alive = true;
    setPeaks(undefined);
    setError("");
    const worker = new Worker(
      new URL("./waveform.worker.ts", import.meta.url),
      { type: "module" },
    );
    const context = new AudioContext();
    worker.onmessage = (
      e: MessageEvent<{ id: string; peaks: Float32Array }>,
    ) => {
      if (alive && e.data.id === asset.id) setPeaks(e.data.peaks);
    };
    worker.onerror = () =>
      setError("Waveform unavailable; playback and seeking still work.");
    if ((asset.duration ?? 0) * 48000 * 2 * 4 > 160 * 1024 * 1024) {
      setError(
        "Waveform preview is limited for long audio; playback remains available.",
      );
    } else
      void asset.blob
        .arrayBuffer()
        .then((b) => context.decodeAudioData(b))
        .then((buffer) => {
          if (alive) {
            const samples = buffer.getChannelData(0).slice();
            worker.postMessage({ samples, id: asset.id }, [samples.buffer]);
          }
        })
        .catch(() => {
          if (alive)
            setError("Waveform unavailable; playback remains available.");
        });
    return () => {
      alive = false;
      worker.terminate();
      void context.close();
    };
  }, [asset]);
  useEffect(() => {
    const el = canvas.current;
    if (!el || !peaks) return;
    el.width = 60;
    el.height = Math.min(4096, Math.ceil(height));
    const ctx = el.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 60, el.height);
    ctx.strokeStyle = "#93748A";
    ctx.lineWidth = 1;
    for (let i = 0; i < peaks.length; i++) {
      const y = (i / peaks.length) * el.height,
        width = Math.max(0.5, peaks[i] * 25);
      ctx.beginPath();
      ctx.moveTo(30 - width, y);
      ctx.lineTo(30 + width, y);
      ctx.stroke();
    }
  }, [height, peaks]);
  useEffect(() => {
    const el = scroll.current;
    if (follow && el) {
      const y = time * scale;
      if (y < el.scrollTop + 30 || y > el.scrollTop + el.clientHeight - 40)
        el.scrollTop = Math.max(0, y - el.clientHeight / 2);
    }
  }, [follow, time, scale]);
  const tick = duration > 180 ? 30 : duration > 30 ? 15 : 5;
  return (
    <div
      className="timeline-scroll"
      ref={scroll}
      role="region"
      aria-label="Page timeline"
      tabIndex={0}
    >
      <div className="timeline" style={{ height: extent * scale + 40 }}>
        <div
          className="waveform"
          style={{ height, bottom: "auto" }}
          role="slider"
          tabIndex={0}
          aria-label="Audio position"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={Math.round(time * 10) / 10}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowRight") {
              e.preventDefault();
              seek(time + 1);
            }
            if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
              e.preventDefault();
              seek(time - 1);
            }
            if (e.key === "Home") seek(0);
            if (e.key === "End") seek(duration);
          }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            const r = e.currentTarget.getBoundingClientRect();
            seek((e.clientY - r.top) / scale);
          }}
          onPointerMove={(e) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId)) {
              const r = e.currentTarget.getBoundingClientRect();
              seek((e.clientY - r.top) / scale);
            }
          }}
          onPointerUp={(e) =>
            e.currentTarget.releasePointerCapture(e.pointerId)
          }
        >
          <canvas ref={canvas} style={{ height }} />
          {Array.from({ length: Math.floor(duration / tick) + 1 }, (_, i) => (
            <span
              className="time-tick"
              key={i}
              style={{ top: i * tick * scale }}
            >
              {timeLabel(i * tick)}
            </span>
          ))}
        </div>
        <div className="audio-end-marker" style={{ top: height }}>
          Audio end · silent planning below
        </div>
        <div className="section-track">
          {pages
            .filter((p) => p.audioRange?.assetId === asset.id)
            .map((p) => {
              const r =
                preview?.pageId === p.id ? preview.range : p.audioRange!;
              return (
                <div
                  key={p.id}
                  {...pageReorderProps(p.id, onReorder, readOnly)}
                  className={
                    "timed-section " + (activeId === p.id ? "selected" : "")
                  }
                  style={{
                    top: r.start * scale,
                    height: (r.end - r.start) * scale,
                  }}
                >
                  {(["start", "end"] as const).map((edge) => (
                    <div
                      key={edge}
                      className={"section-trim " + edge}
                      role="slider"
                      tabIndex={readOnly ? -1 : 0}
                      aria-label={p.title + " section " + edge}
                      aria-orientation="vertical"
                      aria-disabled={readOnly}
                      aria-valuemin={0}
                      aria-valuemax={extent}
                      aria-valuenow={r[edge]}
                      aria-valuetext={r[edge].toFixed(2) + " seconds"}
                      onPointerDown={(e) => {
                        if (readOnly) return;
                        e.preventDefault();
                        e.stopPropagation();
                        e.currentTarget.focus();
                        e.currentTarget.setPointerCapture(e.pointerId);
                        drag.current = {
                          pageId: p.id,
                          edge,
                          startY: e.clientY,
                          original: r[edge],
                          value: r[edge],
                        };
                      }}
                      onPointerMove={(e) => {
                        const d = drag.current;
                        if (
                          !d ||
                          d.pageId !== p.id ||
                          d.edge !== edge ||
                          !e.currentTarget.hasPointerCapture(e.pointerId)
                        )
                          return;
                        const range = trimRange(
                          pages,
                          p.id,
                          edge,
                          d.original + (e.clientY - d.startY) / scale,
                          extent,
                        );
                        d.value = range[edge];
                        setPreview({ pageId: p.id, range });
                      }}
                      onPointerUp={(e) => {
                        const d = drag.current;
                        if (
                          !d ||
                          !e.currentTarget.hasPointerCapture(e.pointerId)
                        )
                          return;
                        drag.current = undefined;
                        setPreview(undefined);
                        e.currentTarget.releasePointerCapture(e.pointerId);
                        onTrim(p.id, edge, d.value);
                      }}
                      onPointerCancel={() => {
                        drag.current = undefined;
                        setPreview(undefined);
                      }}
                      onLostPointerCapture={() => {
                        drag.current = undefined;
                        setPreview(undefined);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          drag.current = undefined;
                          setPreview(undefined);
                          return;
                        }
                        if (
                          readOnly ||
                          ![
                            "ArrowUp",
                            "ArrowDown",
                            "ArrowLeft",
                            "ArrowRight",
                          ].includes(e.key)
                        )
                          return;
                        e.preventDefault();
                        const delta =
                          (e.key === "ArrowUp" || e.key === "ArrowLeft"
                            ? -1
                            : 1) * (e.shiftKey ? 1 : 0.1);
                        onTrim(p.id, edge, r[edge] + delta);
                      }}
                    >
                      <span />
                    </div>
                  ))}
                  <button
                    className="section-select"
                    onClick={() => onPage(p.id)}
                  >
                    <span>{String(p.order + 1).padStart(2, "0")}</span>
                    <strong>{p.title}</strong>
                    <small>
                      {timeLabel(r.start)}—{timeLabel(r.end)}
                    </small>
                  </button>
                  <div className="section-actions">
                    <button
                      aria-label={"Play from " + p.title}
                      disabled={r.start >= duration}
                      title={
                        r.start >= duration
                          ? "Silent planning section; no audio here"
                          : "Play from section"
                      }
                      onClick={() => onPlay(r.start)}
                    >
                      <Play size={12} />
                    </button>
                    <button
                      aria-label={"Edit page " + p.title}
                      onClick={() => onEdit(p.id)}
                    >
                      <Pencil size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          {pages.filter((p) => !p.audioRange).length > 0 && (
            <div className="untimed-group" style={{ top: height + 8 }}>
              {pages
                .filter((p) => !p.audioRange)
                .map((p) => (
                  <span key={p.id}>
                    <button onClick={() => onPage(p.id)}>{p.title}</button>
                    <button
                      aria-label={"Edit page " + p.title}
                      onClick={() => onEdit(p.id)}
                    >
                      <Pencil size={12} />
                    </button>
                  </span>
                ))}
            </div>
          )}
        </div>
        <div className="playhead" style={{ top: time * scale }}>
          <span>{timeLabel(time)}</span>
        </div>
      </div>
      {error && <p className="wave-error">{error}</p>}
    </div>
  );
}
