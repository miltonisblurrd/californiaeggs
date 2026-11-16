"use client";

import { useEffect, useRef, useState } from "react";
import { btn } from "./ui";

export function SignaturePad({
  value,
  onChange,
  placeholder = "Customer signs here",
}: {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  placeholder?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(!!value);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * ratio;
    c.height = rect.height * ratio;
    const ctx = c.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1c1915";
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = value;
    }
  }, []);

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function down(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = point(e);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || !last.current) return;
    const ctx = e.currentTarget.getContext("2d")!;
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    if (!hasInk) setHasInk(true);
  }

  function up() {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    onChange(canvas.current?.toDataURL("image/png"));
  }

  function clear() {
    const c = canvas.current;
    if (!c) return;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
    onChange(undefined);
  }

  return (
    <div>
      <div className="relative">
        <canvas
          ref={canvas}
          aria-label={placeholder}
          role="img"
          className="h-36 w-full touch-none rounded-2xl border border-dashed border-shell/50 bg-[#fffbea]"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
        />
        {!hasInk ? (
          <p className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-muted">{placeholder}</p>
        ) : null}
        <div className="pointer-events-none absolute bottom-8 left-5 right-5 border-b border-shell/30" />
      </div>
      {hasInk ? (
        <button type="button" className={`${btn.ghost} mt-1`} onClick={clear}>
          Clear signature
        </button>
      ) : null}
    </div>
  );
}
