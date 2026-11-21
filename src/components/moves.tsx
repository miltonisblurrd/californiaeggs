"use client";

import {
  Timeline,
  TimelineConnector,
  TimelineDescription,
  TimelineItem,
  TimelineMarker,
  TimelineTime,
  TimelineTitle,
} from "@ui-sdk/react/timeline";
import { productName, vendorName } from "@/lib/derive";
import { day, when } from "@/lib/format";
import type { DemoState, Move } from "@/lib/types";
import { cx } from "./ui";

const KIND: Record<Move["kind"], string> = {
  receive: "Received",
  load: "Loaded",
  pull: "Pulled",
  return: "Back in",
  expired: "Expired back",
  count: "Count",
};

function moveNote(s: DemoState, m: Move) {
  const route = m.routeId ? s.routes.find((r) => r.id === m.routeId) : undefined;
  const whenDate = day(route?.date ?? m.at);
  return (m.note ?? "").replace(/routes?\s+\d+(?:\s*,\s*\d+)*/gi, whenDate);
}

export function MoveTimeline({ s, moves, label }: { s: DemoState; moves: Move[]; label: string }) {
  const list = [...moves].sort((a, b) => b.at.localeCompare(a.at));
  if (!list.length) return <p className="text-sm text-muted">No moves yet.</p>;
  return (
    <Timeline aria-label={label} className="flex flex-col">
      {list.map((m, i) => (
        <TimelineItem key={m.id} className="relative grid grid-cols-[20px_1fr_auto] gap-x-3 pb-4 outline-none focus-visible:bg-yolk/10">
          <TimelineMarker
            className={cx(
              "mt-1.5 h-3 w-3 rounded-full ring-4 ring-paper",
              m.boxes > 0 && "bg-good",
              m.boxes < 0 && (m.kind === "pull" ? "bg-bad" : "bg-ink"),
              m.boxes === 0 && "bg-warn"
            )}
          />
          {i < list.length - 1 ? <TimelineConnector className="absolute left-[5px] top-5 bottom-0 w-0.5 bg-line" /> : null}
          <div className="min-w-0">
            <TimelineTitle className="text-[15px] font-semibold">
              {KIND[m.kind]} · {productName(s, m.productId)}
            </TimelineTitle>
            <TimelineDescription className="text-xs text-muted">
              {m.who}
              {m.vendorId ? ` · ${vendorName(s, m.vendorId)}` : ""}
              {moveNote(s, m) ? ` · ${moveNote(s, m)}` : ""}
            </TimelineDescription>
            <TimelineTime dateTime={m.at} className="text-xs text-muted">
              {when(m.at, s.today)}
            </TimelineTime>
          </div>
          <p
            className={cx(
              "text-right text-[15px] font-bold tabular-nums",
              m.boxes > 0 && "text-good",
              m.boxes < 0 && m.kind === "pull" && "text-bad"
            )}
          >
            {m.boxes > 0 ? `+${m.boxes}` : m.boxes === 0 ? "—" : m.boxes}
          </p>
        </TimelineItem>
      ))}
    </Timeline>
  );
}
