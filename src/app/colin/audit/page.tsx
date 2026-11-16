"use client";

import { useState } from "react";
import { confirm } from "@ui-sdk/react/alert-dialog";
import { toast } from "@ui-sdk/react/toast";
import { BoxStepper, Card, Label, MoneyField, Notice, Page, Row, Tag, TextField, btn, cx } from "@/components/ui";
import { customerOf, routeInvoices, routeSheet, statusLabel } from "@/lib/derive";
import { day, money, when } from "@/lib/format";
import { actions, useDemo } from "@/lib/store";
import type { Route } from "@/lib/types";

export default function Audit() {
  const s = useDemo();
  const waiting = s.routes.filter((r) => r.status === "back" || r.status === "checkedIn").sort((a, b) => a.date.localeCompare(b.date) || a.number - b.number);
  const done = s.routes.filter((r) => r.status === "audited" || r.status === "entered");

  return (
    <Page title="Audit bags" sub="Count each lockbox bag against its route sheet">
      {waiting.length === 0 ? <Notice tone="good">No bags waiting. Every route that came back is audited.</Notice> : null}
      {waiting.map((r) => (
        <BagCard key={r.id} route={r} />
      ))}

      {done.length ? (
        <section className="flex flex-col gap-2">
          <Label>Audited</Label>
          {done.map((r) => {
            const a = s.audits.find((x) => x.routeId === r.id);
            const sheet = routeSheet(s, r.id);
            const expected = sheet.cash.amount + sheet.checks.amount + (r.roa?.amount ?? 0);
            const diff = a ? a.cash + a.checkAmount - expected : 0;
            return (
              <Card key={r.id}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold">
                    Route {r.number} · {r.driver} · {day(r.date)}
                  </p>
                  <Tag tone={Math.abs(diff) < 0.01 ? "good" : "bad"}>{Math.abs(diff) < 0.01 ? "Matched" : `${diff > 0 ? "+" : ""}${money(diff)}`}</Tag>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {statusLabel(r.status)}
                  {a ? ` · ${when(a.at, s.today)}` : ""}
                  {a?.note ? ` · “${a.note}”` : ""}
                </p>
              </Card>
            );
          })}
        </section>
      ) : null}
    </Page>
  );
}

function BagCard({ route }: { route: Route }) {
  const s = useDemo();
  const sheet = routeSheet(s, route.id);
  const roa = route.roa?.amount ?? 0;
  const expected = sheet.cash.amount + sheet.checks.amount + roa;
  const [open, setOpen] = useState(false);
  const [cash, setCash] = useState<number | null>(null);
  const [checks, setChecks] = useState<number | null>(sheet.checks.count);
  const [checkAmount, setCheckAmount] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const counted = (cash ?? 0) + (checkAmount ?? 0);
  const diff = counted - expected;
  const ready = cash !== null && checkAmount !== null;
  const matched = Math.abs(diff) < 0.01;
  const invoices = routeInvoices(s, route.id);

  async function finish() {
    const yes = await confirm({
      title: `Close out route ${route.number}?`,
      description: matched
        ? `Bag matches the sheet at ${money(expected)}. The inputter can enter it.`
        : `Bag is ${diff > 0 ? "over" : "short"} by ${money(Math.abs(diff))}.${note ? "" : " Add a note so you remember why."}`,
      confirmLabel: "Mark audited",
    });
    if (!yes) return;
    actions.auditRoute(route.id, { cash: cash ?? 0, checks: checks ?? 0, checkAmount: checkAmount ?? 0, note: note.trim() });
    toast(`Route ${route.number} audited`, { description: "It’s on the inputter’s list now." });
  }

  return (
    <Card>
      <button className="flex w-full items-start justify-between gap-3 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <div>
          <p className="text-lg font-bold">
            Route {route.number} · {route.driver}
          </p>
          <p className="text-sm text-muted">
            {day(route.date)} · {sheet.invoicesIn} invoices · {statusLabel(route.status)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold tabular-nums">{money(expected)}</p>
          <p className="text-xs text-muted">should be in the bag</p>
        </div>
      </button>

      {open ? (
        <div className="mt-4 flex flex-col gap-4">
          <div>
            <Row left="Cash" sub={`${sheet.cash.count} stops`} right={money(sheet.cash.amount)} />
            <Row left="Checks" sub={`${sheet.checks.count} ${sheet.checks.count === 1 ? "check" : "checks"}`} right={money(sheet.checks.amount)} />
            <Row left="R.O.A." sub={`${route.roa?.count ?? 0} payments`} right={money(roa)} />
            <Row left="Charge" sub="Billed later" right={money(sheet.charge.amount)} />
            <Row left="Eggs sold" sub={`${sheet.eggsOut} out, ${sheet.eggsIn} back`} right={`${sheet.eggsSold} boxes`} strong />
            {sheet.voids ? <Row left="Voids" right={sheet.voids} /> : null}
          </div>

          <details className="rounded-2xl bg-paper px-3 py-2 text-sm">
            <summary className="cursor-pointer font-medium">Invoices on this route</summary>
            <div className="mt-2">
              {invoices.map((i) => (
                <div key={i.number} className="flex justify-between border-t border-line/60 py-1.5">
                  <span className="truncate">
                    {i.number} · {customerOf(s, i.customerId).name}
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {i.status === "void" ? "Void" : i.result ? `${i.result.method} ${money(i.result.amount)}${i.result.checkNo ? ` #${i.result.checkNo}` : ""}` : "Open"}
                  </span>
                </div>
              ))}
            </div>
          </details>

          <Label>What’s in the bag</Label>
          <MoneyField label="Cash counted" value={cash} onChange={setCash} />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Checks in the bag</span>
            <BoxStepper value={checks} onChange={setChecks} label="Checks counted" size="sm" />
          </div>
          <MoneyField label="Checks total" value={checkAmount} onChange={setCheckAmount} hint="R.O.A. checks count here too" />

          {ready ? (
            <div className={cx("rounded-2xl px-4 py-3 text-center font-semibold", matched ? "bg-good/15 text-good" : "bg-bad/10 text-bad")}>
              {matched ? "Matches the sheet" : `${diff > 0 ? "Over" : "Short"} ${money(Math.abs(diff))}`}
            </div>
          ) : null}
          <TextField label="Note" value={note} onChange={setNote} placeholder={matched ? "Optional" : "What happened?"} />
          <button className={btn.primary} disabled={!ready} onClick={finish}>
            {ready ? "Mark audited" : "Count the bag first"}
          </button>
        </div>
      ) : null}
    </Card>
  );
}
