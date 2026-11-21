"use client";

import Link from "next/link";
import { Bar, Big, Card, Label, Page, Row, Tag } from "@/components/ui";
import { addDays, balances, completeness, coolerTotals, productName, pullsWithoutInvoice, routeInvoices, routeSheet, statusLabel } from "@/lib/derive";
import { day, money, when } from "@/lib/format";
import { useDemo } from "@/lib/store";

function period(mode: string | undefined, today: string) {
  const date = mode && /^\d{4}-\d{2}-\d{2}$/.test(mode) ? mode : !mode ? today : "";
  if (date) return { start: date, end: date, compare: null as { start: string; end: string } | null, versus: "" };
  if (mode === "30") return { start: addDays(today, -29), end: today, compare: null, versus: "" };
  if (mode === "90") return { start: addDays(today, -89), end: today, compare: null, versus: "" };
  if (mode === "ytd") return { start: `${today.slice(0, 4)}-01-01`, end: today, compare: null, versus: "" };
  if (mode === "mom") {
    const start = `${today.slice(0, 7)}-01`;
    const prevEnd = addDays(start, -1);
    return { start, end: today, compare: { start: `${prevEnd.slice(0, 7)}-01`, end: prevEnd }, versus: "last month" };
  }
  const year = Number(today.slice(0, 4));
  return { start: `${year}-01-01`, end: today, compare: { start: `${year - 1}-01-01`, end: `${year - 1}${today.slice(4)}` }, versus: "last year" };
}

export default function ColinToday() {
  const s = useDemo();
  const totals = coolerTotals(s);
  const span = period(s.colinRange, s.today);
  const inSpan = (date: string, bounds = { start: span.start, end: span.end }) => date >= bounds.start && date <= bounds.end;
  const trucks = s.routes.filter((r) => inSpan(r.date)).sort((a, b) => b.date.localeCompare(a.date) || a.number - b.number);
  const sheets = trucks.map((r) => routeSheet(s, r.id));
  const sold = sheets.reduce((n, x) => n + (x.stopsDone ? x.eggsSold : 0), 0);
  const delivered = s.invoices.filter((i) => inSpan(i.date) && i.status === "delivered");
  const compareDelivered = span.compare ? s.invoices.filter((i) => inSpan(i.date, span.compare!) && i.status === "delivered") : [];
  const compareSales = compareDelivered.reduce((n, i) => n + i.result!.amount, 0);
  const byMethod = (m: string) => delivered.filter((i) => i.result!.method === m).reduce((n, i) => n + i.result!.amount, 0);
  const bags = s.routes.filter((r) => r.status === "back" || r.status === "checkedIn");
  const c = completeness(s);
  const gaps = c.notEntered.length + c.duplicates.length + c.missingBack.length;
  const pulls = pullsWithoutInvoice(s, `${s.today.slice(0, 8)}01`);
  const owed = balances(s);
  const late = owed.filter((b) => b.days > 30);
  const pendingCount = s.counts.find((x) => x.status === "submitted");

  return (
    <Page title="Home" sub="Your dashboard for everything on a macro level. Get a pulse and decide what to view more in depth.">
      <Card href="/colin/cooler">
        <div className="flex items-end justify-between">
          <Big value={money(totals.dollars)} label="In the cooler" />
          <Big value={totals.eggBoxes.toLocaleString()} label={totals.cheese ? `Boxes · ${totals.cheese} cheese` : "Boxes"} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <Big value={sold} label="Boxes sold" />
        </Card>
        <Card>
          <Big value={money(delivered.reduce((n, i) => n + i.result!.amount, 0))} label="Sales" />
          {span.compare ? <p className="mt-1 text-xs text-muted">{money(compareSales)} {span.versus}</p> : null}
        </Card>
      </div>

      <Card>
        <Label>Money</Label>
        <div className="mt-1">
          <Row left="Cash" right={money(byMethod("cash"))} />
          <Row left="Checks" right={money(byMethod("check"))} />
          <Row left="Charge" sub="Billed, not collected" right={money(byMethod("charge"))} />
        </div>
      </Card>

      <Card href="/colin/owed">
        <div className="flex items-center justify-between">
          <Big value={money(owed.reduce((n, b) => n + b.balance, 0))} label={`Owed by ${owed.length} customers`} />
          {late.length ? <Tag tone="bad">{`${late.length} past 30 days`}</Tag> : null}
        </div>
      </Card>

      {(bags.length || gaps || pendingCount) ? (
        <section className="flex flex-col gap-2">
          <Label>Needs you</Label>
          {bags.length ? (
            <Card href="/colin/audit">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{bags.length} {bags.length === 1 ? "bag" : "bags"} in the lockbox</span>
                <Tag tone="warn">Audit</Tag>
              </div>
              <p className="mt-1 text-sm text-muted">{bags.map((b) => `Route ${b.number}`).join(", ")}</p>
            </Card>
          ) : null}
          {gaps ? (
            <Card href="/colin/invoices">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{gaps} invoice {gaps === 1 ? "gap" : "gaps"}</span>
                <Tag tone="bad">Invoices</Tag>
              </div>
              <p className="mt-1 text-sm text-muted">
                {[c.notEntered.length && `${c.notEntered.length} not entered`, c.duplicates.length && `${c.duplicates.length} entered twice`, c.missingBack.length && `${c.missingBack.length} missing`]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </Card>
          ) : null}
          {pendingCount ? (
            <Card href="/colin/friday">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Friday count to approve</span>
                <Tag tone="warn">Count</Tag>
              </div>
              <p className="mt-1 text-sm text-muted">{pendingCount.by} · {when(pendingCount.at, s.today)}</p>
            </Card>
          ) : null}
        </section>
      ) : null}

      <section className="flex flex-col gap-2">
        <Label>Books</Label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { href: "/colin/customers", title: "Customers", sub: "Prices, routes" },
            { href: "/colin/month", title: "Month end", sub: "For David" },
            { href: "/colin/history", title: "History", sub: "Invoices, sheets" },
          ].map((b) => (
            <Card key={b.href} href={b.href} className="p-3">
              <p className="text-[15px] font-semibold">{b.title}</p>
              <p className="text-xs text-muted">{b.sub}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <Label>Trucks</Label>
        {trucks.map((r) => {
          const invs = routeInvoices(s, r.id);
          const done = invs.filter((i) => i.status !== "open").length;
          return (
            <Card key={r.id}>
              <div className="flex items-center justify-between">
                <span className="font-semibold">{r.driver} · {day(r.date)}</span>
                <Tag tone={r.status === "out" ? "yolk" : r.status === "calling" ? "warn" : "neutral"}>{statusLabel(r.status)}</Tag>
              </div>
              {invs.length ? (
                <div className="mt-2">
                  <Bar value={done} max={invs.length} label={`${r.driver} stops`} tone="good" />
                  <p className="mt-1 text-xs text-muted">{done} of {invs.length} stops</p>
                </div>
              ) : null}
            </Card>
          );
        })}
      </section>

      {pulls.length ? (
        <section className="flex flex-col gap-2">
          <Label>Pulled without an invoice this month</Label>
          <Card>
            {pulls.map((m) => (
              <Row key={m.id} left={`${productName(s, m.productId)} · ${Math.abs(m.boxes)} boxes`} sub={`${m.who} · ${when(m.at, s.today)}${m.note ? ` · ${m.note}` : ""}`} right="" />
            ))}
          </Card>
          <Link href="/colin/cooler" className="text-sm font-medium text-muted underline">See cooler history</Link>
        </section>
      ) : null}
    </Page>
  );
}
