"use client";

import Link from "next/link";
import { Bar, Card, Label, Page, Tag, btn } from "@/components/ui";
import { dayRoutes, nextServiceDay, routeInvoices, routeOrders, routeTally, statusLabel } from "@/lib/derive";
import { day } from "@/lib/format";
import { actions, useDemo } from "@/lib/store";
import type { Route } from "@/lib/types";

export default function AlmaRoutes() {
  const s = useDemo();
  const tomorrow = nextServiceDay(s.today);
  const next = dayRoutes(s, tomorrow);
  const today = dayRoutes(s, s.today);
  const printed = next.filter((r) => r.status !== "calling").length;

  return (
    <Page title="Tomorrow’s trucks" sub={`${day(tomorrow)} · ${next.length} routes · ${printed} printed`}>
      {next.map((r) => (
        <RouteCard key={r.id} route={r} />
      ))}
      <section className="flex flex-col gap-2">
        <Label>On the road today, {day(s.today)}</Label>
        {today.map((r) => (
          <RouteCard key={r.id} route={r} compact />
        ))}
      </section>
    </Page>
  );
}

function RouteCard({ route: r, compact }: { route: Route; compact?: boolean }) {
  const s = useDemo();
  const tally = routeTally(s, r.id);
  const invoices = routeInvoices(s, r.id);
  const orders = routeOrders(s, r.id);
  const done = invoices.filter((i) => i.status !== "open").length;
  const called = orders.filter((o) => o.called).length;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-bold">
            Route {r.number} · {r.driver}
          </p>
          <p className="text-sm text-muted">
            {invoices.length ? `${invoices.length} invoices` : `${called} of ${orders.length} customers done`} · {tally.reduce((n, t) => n + t.boxes, 0)} boxes
          </p>
        </div>
        <Tag tone={r.status === "calling" ? "warn" : r.status === "out" ? "yolk" : "neutral"}>{statusLabel(r.status)}</Tag>
      </div>
      {r.status === "out" ? (
        <div className="mt-3">
          <p className="mb-1.5 text-xs text-muted">
            {done} of {invoices.length} stops done
          </p>
          <Bar value={done} max={invoices.length} label={`Route ${r.number} stops done`} tone="good" />
        </div>
      ) : null}
      {!compact ? <p className="mt-3 text-sm text-muted">{tally.map((t) => `${t.name} ${t.boxes}`).join(" · ") || "No orders yet"}</p> : null}
      {r.status === "calling" ? (
        <Link href="/alma" onClick={() => actions.pickAlmaRoute(r.id)} className={`${btn.secondary} mt-3 w-full`}>
          Open call sheet
        </Link>
      ) : invoices.length && !compact ? (
        <Link href={`/alma/print/${r.id}`} className={`${btn.secondary} mt-3 w-full`}>
          View and print invoices
        </Link>
      ) : null}
    </Card>
  );
}
