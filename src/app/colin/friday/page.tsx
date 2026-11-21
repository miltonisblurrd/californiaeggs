"use client";

import { useState } from "react";
import Link from "next/link";
import { confirm } from "@ui-sdk/react/alert-dialog";
import { toast } from "@ui-sdk/react/toast";
import { Card, Label, Notice, Page, Row, Sheet, Tag, btn, cx } from "@/components/ui";
import { productName } from "@/lib/derive";
import { money, when } from "@/lib/format";
import { actions, useDemo } from "@/lib/store";
import type { Count } from "@/lib/types";

export default function FridayApprove() {
  const s = useDemo();
  const [showAll, setShowAll] = useState(false);
  const pending = s.counts.filter((c) => c.status === "submitted").sort((a, b) => b.at.localeCompare(a.at))[0];
  const past = s.counts.filter((c) => c.status === "approved").sort((a, b) => b.at.localeCompare(a.at));

  if (!pending) {
    return (
      <Page title="Friday count" sub="Alejandro counts blind, you approve the gaps">
        <Notice tone="neutral">
          No count waiting.{" "}
          <Link href="/warehouse/friday" className="font-semibold underline">
            Do the Friday count as Alejandro
          </Link>
        </Notice>
        <Past past={past} />
      </Page>
    );
  }

  const rows = s.products.map((p) => {
    const typed = pending.typed[p.id] ?? 0;
    const expected = pending.expected[p.id] ?? 0;
    return { p, typed, expected, diff: typed - expected };
  });
  const gaps = rows.filter((r) => r.diff !== 0);
  const value = gaps.reduce((n, r) => n + r.diff * r.p.price, 0);

  async function approve() {
    const yes = await confirm({
      title: "Approve this count?",
      description: gaps.length
        ? `The cooler changes on ${gaps.length} ${gaps.length === 1 ? "line" : "lines"} to match what Alejandro counted.`
        : "Everything matched. Nothing changes.",
      confirmLabel: "Approve count",
    });
    if (!yes) return;
    actions.approveCount(pending.id);
    toast("Count approved", { description: "The cooler now matches the floor." });
  }

  return (
    <Page title="Friday count" sub={`${pending.by} · ${when(pending.at, s.today)}`}>
      <Card>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[28px] font-bold leading-none">{gaps.length}</p>
            <p className="mt-1 text-xs text-muted">{gaps.length === 1 ? "line is off" : "lines are off"}</p>
          </div>
          <div className="text-right">
            <p className={cx("text-xl font-bold tabular-nums", value < 0 ? "text-bad" : value > 0 ? "text-good" : "")}>{money(value)}</p>
            <p className="text-xs text-muted">at sell price</p>
          </div>
        </div>
      </Card>

      <section>
        <div className="flex items-center justify-between">
          <Label>{showAll ? "All lines" : "Gaps only"}</Label>
          <button className={btn.ghost} onClick={() => setShowAll((x) => !x)}>
            {showAll ? "Gaps only" : "Show all"}
          </button>
        </div>
        <Card className="mt-2">
          {(showAll ? rows : gaps).map((r) => (
            <Row
              key={r.p.id}
              left={productName(s, r.p.id)}
              sub={`Expected ${r.expected} · counted ${r.typed}`}
              right={r.diff === 0 ? <Tag tone="good">OK</Tag> : <Tag tone={r.diff < 0 ? "bad" : "warn"}>{`${r.diff > 0 ? "+" : ""}${r.diff}`}</Tag>}
            />
          ))}
          {!showAll && !gaps.length ? <p className="py-2 text-sm text-muted">Every line matched.</p> : null}
        </Card>
      </section>

      <button className={btn.primary} onClick={approve}>
        Approve count
      </button>
      <Past past={past} />
    </Page>
  );
}

function Past({ past }: { past: Count[] }) {
  const s = useDemo();
  const [openId, setOpenId] = useState<string | null>(null);
  const open = past.find((c) => c.id === openId);
  if (!past.length) return null;
  const rows = open
    ? s.products.map((p) => {
        const typed = open.typed[p.id] ?? 0;
        const expected = open.expected[p.id] ?? 0;
        return { p, typed, expected, diff: typed - expected };
      })
    : [];
  return (
    <section className="flex flex-col gap-2">
      <Label>Approved</Label>
      {past.map((c) => (
        <button key={c.id} onClick={() => setOpenId(c.id)} className="rounded-3xl border border-line bg-card p-4 text-left active:scale-[0.99] transition">
          <p className="text-sm">
            {c.by} counted {when(c.at, s.today)} · approved {c.approvedAt ? when(c.approvedAt, s.today) : ""}
          </p>
        </button>
      ))}
      <Sheet open={!!open} onOpenChange={(o) => !o && setOpenId(null)} title={open ? `${open.by}'s count` : ""} description={open ? `Counted ${when(open.at, s.today)}` : ""}>
        {rows.map((r) => (
          <Row
            key={r.p.id}
            left={productName(s, r.p.id)}
            sub={`Expected ${r.expected} · counted ${r.typed}`}
            right={r.diff === 0 ? <Tag tone="good">OK</Tag> : <Tag tone={r.diff < 0 ? "bad" : "warn"}>{`${r.diff > 0 ? "+" : ""}${r.diff}`}</Tag>}
          />
        ))}
      </Sheet>
    </section>
  );
}
