"use client";

import { useState } from "react";
import { confirm } from "@ui-sdk/react/alert-dialog";
import { toast } from "@ui-sdk/react/toast";
import { BoxStepper, Card, Notice, Page, btn } from "@/components/ui";
import { time } from "@/lib/format";
import { actions, useDemo } from "@/lib/store";

export default function FridayCount() {
  const s = useDemo();
  const [typed, setTyped] = useState<Record<string, number | null>>({});
  const pending = s.counts.find((c) => c.status === "submitted");
  const filled = s.products.filter((p) => typed[p.id] !== undefined && typed[p.id] !== null).length;

  async function submit() {
    const yes = await confirm({
      title: "Send the count to Colin?",
      description: `${filled} of ${s.products.length} lines counted. Lines left blank count as zero.`,
      confirmLabel: "Send to Colin",
    });
    if (!yes) return;
    const out: Record<string, number> = {};
    s.products.forEach((p) => (out[p.id] = typed[p.id] ?? 0));
    actions.submitCount(out, "Alejandro");
    setTyped({});
    toast("Count sent", { description: "Colin sees it with the gaps marked." });
  }

  return (
    <Page title="Friday count" sub="Count what you see. The app hides what it expects until you send it.">
      {pending ? (
        <Notice tone="good">
          Count sent at {time(pending.at)}. Waiting on Colin to approve. You can send a new one if you recount.
        </Notice>
      ) : null}

      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
          <span>Cooler inventory</span>
          <span>Boxes</span>
        </div>
        {s.products.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3 border-b border-line/70 px-4 py-2.5 last:border-0">
            <p className="text-[15px] font-semibold">{p.name}</p>
            <BoxStepper value={typed[p.id] ?? null} onChange={(n) => setTyped((t) => ({ ...t, [p.id]: n }))} label={`${p.name} boxes`} size="sm" />
          </div>
        ))}
      </Card>

      <button className={btn.primary} disabled={filled === 0} onClick={submit}>
        Send count to Colin ({filled} of {s.products.length})
      </button>
    </Page>
  );
}
