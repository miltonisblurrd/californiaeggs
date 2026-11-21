"use client";

import { toast } from "@ui-sdk/react/toast";
import { Big, Card, Gauge, Label, Notice, Page, btn } from "@/components/ui";
import { completeness, customerOf, invoiceTotal, routeOf } from "@/lib/derive";
import { money } from "@/lib/format";
import { actions, useDemo } from "@/lib/store";
import type { Invoice } from "@/lib/types";

export default function Invoices() {
  const s = useDemo();
  const c = completeness(s);
  const accounted = c.entered.length;
  const shouldBeIn = c.created - c.stillOut.length;

  return (
    <Page title="Invoices" sub="Every invoice sent out should come back and be entered once">
      <Card>
        <div className="grid grid-cols-3 gap-3">
          <Big value={c.created} label="Sent out" />
          <Big value={c.cameBack.length} label="Came back" />
          <Big value={accounted} label="Entered" tone={accounted === shouldBeIn ? "good" : "warn"} />
        </div>
        <div className="mt-4">
          <Gauge value={accounted} max={c.created} label="Invoices entered" />
          <p className="mt-1.5 text-xs text-muted">{c.stillOut.length} still on trucks or not called yet</p>
        </div>
      </Card>

      {c.notEntered.length === 0 && c.duplicates.length === 0 && c.missingBack.length === 0 ? (
        <Notice tone="good">No gaps. Every audited invoice is entered exactly once.</Notice>
      ) : null}

      <Group title="Audited, not in QuickBooks yet" list={c.notEntered} hint="On the inputter’s list. Old ones here were skipped." />
      <Group title="Missing from the bag" list={c.missingBack} hint="Route is back but this invoice never came in." />

      {c.duplicates.length ? (
        <section className="flex flex-col gap-2">
          <Label>Entered twice</Label>
          {c.duplicates.map((i) => (
            <Card key={i.number}>
              <InvoiceLine inv={i} />
              <p className="mt-1 text-sm text-bad">In QuickBooks {i.enteredCount} times. Sales are overstated by {money(invoiceTotal(i) * (i.enteredCount - 1))}.</p>
              <button
                className={`${btn.secondary} mt-3 w-full`}
                onClick={() => {
                  actions.fixDuplicate(i.number);
                  toast(`Invoice ${i.number} fixed`, { description: "Now entered once." });
                }}
              >
                Mark the extra one deleted
              </button>
            </Card>
          ))}
        </section>
      ) : null}
    </Page>
  );
}

function Group({ title, list, hint }: { title: string; list: Invoice[]; hint: string }) {
  if (!list.length) return null;
  return (
    <section className="flex flex-col gap-2">
      <Label>{title}</Label>
      <p className="-mt-1 text-xs text-muted">{hint}</p>
      {list.map((i) => (
        <Card key={i.number}>
          <InvoiceLine inv={i} />
        </Card>
      ))}
    </section>
  );
}

function InvoiceLine({ inv }: { inv: Invoice }) {
  const s = useDemo();
  const r = routeOf(s, inv.routeId);
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="font-semibold tabular-nums">#{inv.number}</p>
        <p className="truncate text-sm text-muted">
          {customerOf(s, inv.customerId).name} · Route {r.number} · {r.driver}
        </p>
      </div>
      <p className="shrink-0 font-semibold tabular-nums">{money(inv.result?.amount ?? invoiceTotal(inv))}</p>
    </div>
  );
}
