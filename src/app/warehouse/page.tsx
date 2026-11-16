"use client";

import { useState } from "react";
import { toast } from "@ui-sdk/react/toast";
import { PullSheet } from "@/components/pull-sheet";
import { BoxStepper, Card, Choose, Notice, Page, btn, cx } from "@/components/ui";
import { coolerRows, vendorName } from "@/lib/derive";
import { actions, useDemo } from "@/lib/store";

const REASONS = ["Miscounted yesterday", "Broken boxes found", "Delivery not entered", "Boxes taken with no invoice", "Not sure, Colin to check"];

export default function MorningCount() {
  const s = useDemo();
  const rows = coolerRows(s);
  const [typed, setTyped] = useState<Record<string, number | null>>({});
  const [reason, setReason] = useState<string | null>(null);
  const [pullOpen, setPullOpen] = useState(false);

  const value = (id: string, fallback: number) => (typed[id] === undefined ? fallback : typed[id]);
  const changed = rows.filter((r) => typed[r.product.id] !== undefined && typed[r.product.id] !== null && typed[r.product.id] !== r.boxes);

  function confirmCount() {
    if (changed.length) {
      if (!reason) return;
      const next: Record<string, number> = {};
      changed.forEach((r) => (next[r.product.id] = typed[r.product.id] as number));
      actions.correctCount(next, "Alejandro", reason);
      toast("Count saved", { description: `${changed.length} ${changed.length === 1 ? "line" : "lines"} corrected. Colin can see why.` });
    } else {
      toast("Count confirmed", { description: "Every line matches the cooler." });
    }
    setTyped({});
    setReason(null);
  }

  return (
    <Page
      title="Morning count"
      sub="Same lines as the paper sheet. The app already knows what should be there."
      action={
        <button className={btn.secondary} onClick={() => setPullOpen(true)}>
          Pull
        </button>
      }
    >
      <Notice tone="neutral">Walk the cooler. If a line is right, leave it. If it isn’t, change the number. Only changes need a reason.</Notice>

      <Card className="p-0">
        {rows.map((r) => {
          const v = value(r.product.id, r.boxes);
          const diff = v === null ? 0 : v - r.boxes;
          return (
            <div key={r.product.id} className={cx("flex items-center justify-between gap-3 border-b border-line/70 px-4 py-3 last:border-0", diff !== 0 && "bg-warn/8")}>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold">{r.product.name}</p>
                <p className="text-xs text-muted">
                  Cooler says {r.boxes}
                  {r.vendors > 1 ? ` · ${r.lots.map((l) => `${vendorName(s, l.vendorId).split(" ")[0]} ${l.boxes}`).join(", ")}` : ""}
                  {diff !== 0 ? <span className="font-semibold text-warn"> · {diff > 0 ? `+${diff}` : diff}</span> : null}
                </p>
              </div>
              <BoxStepper value={v} onChange={(n) => setTyped((t) => ({ ...t, [r.product.id]: n }))} label={`${r.product.name} boxes`} size="sm" />
            </div>
          );
        })}
      </Card>

      {changed.length ? (
        <Choose
          label={`Why ${changed.length === 1 ? "is 1 line" : `are ${changed.length} lines`} different?`}
          value={reason}
          onChange={setReason}
          placeholder="Choose a reason"
          options={REASONS.map((r) => ({ value: r, label: r }))}
        />
      ) : null}

      <button className={btn.primary} disabled={changed.length > 0 && !reason} onClick={confirmCount}>
        {changed.length ? `Save count with ${changed.length} ${changed.length === 1 ? "change" : "changes"}` : "Everything matches"}
      </button>

      <PullSheet open={pullOpen} onOpenChange={setPullOpen} who="Alejandro" />
    </Page>
  );
}
