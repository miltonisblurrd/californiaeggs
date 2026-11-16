"use client";

import Link from "next/link";
import { Bar, Big, Card, Label, Page, Row, Tag } from "@/components/ui";
import { balances, completeness, coolerTotals, dayRoutes, productName, pullsWithoutInvoice, routeInvoices, routeSheet, statusLabel } from "@/lib/derive";
import { day, money, when } from "@/lib/format";
import { useDemo } from "@/lib/store";

export default function ColinToday() {
  const s = useDemo();
  const totals = coolerTotals(s);
  const today = dayRoutes(s, s.today);
  const sheets = today.map((r) => routeSheet(s, r.id));
  const sold = sheets.reduce((n, x) => n + x.eggsSold * (x.stopsDone ? 1 : 0), 0);
  const delivered = s.invoices.filter((i) => i.date === s.today && i.status === "delivered");
  const byMethod = (m: string) => delivered.filter((i) => i.result!.method === m).reduce((n, i) => n + i.result!.amount, 0);
  const bags = s.routes.filter((r) => r.status === "back" || r.status === "checkedIn");
  const c = completeness(s);
  const gaps = c.notEntered.length + c.duplicates.length + c.missingBack.length;
  const pulls = pullsWithoutInvoice(s, `${s.today.slice(0, 8)}01`);
  const owed = balances(s);
  const late = owed.filter((b) => b.days > 30);
  const pendingCount = s.counts.find((x) => x.status === "submitted");

  return (
    <Page title="Today" sub={day(s.today)}>
      <Card href="/colin/cooler">
        <div className="flex items-end justify-between">
          <Big value={money(totals.dollars)} label="In the cooler" />
          <Big value={totals.eggBoxes.toLocaleString()} label={totals.cheese ? `Boxes · ${totals.cheese} cheese` : "Boxes"} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <Big value={sold} label="Boxes sold today" />
        </Card>
        <Card>
          <Big value={money(delivered.reduce((n, i) => n + i.result!.amount, 0))} label="Sales today" />
        </Card>
      </div>

      <Card>
        <Label>Money today</Label>
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
        <Label>Trucks today</Label>
        {today.map((r) => {
          const invs = routeInvoices(s, r.id);
          const done = invs.filter((i) => i.status !== "open").length;
          return (
            <Card key={r.id}>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Route {r.number} · {r.driver}</span>
                <Tag tone={r.status === "out" ? "yolk" : r.status === "calling" ? "warn" : "neutral"}>{statusLabel(r.status)}</Tag>
              </div>
              {invs.length ? (
                <div className="mt-2">
                  <Bar value={done} max={invs.length} label={`Route ${r.number} stops`} tone="good" />
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
