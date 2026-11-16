"use client";

import { useState } from "react";
import Link from "next/link";
import { InvoicePaper } from "@/components/invoice-paper";
import { Card, Page, Segments, Sheet, Tag, TextField } from "@/components/ui";
import { customerOf, invoiceTotal, routeOf, routeSheet, statusLabel } from "@/lib/derive";
import { day, money, time } from "@/lib/format";
import { useDemo } from "@/lib/store";

const METHOD = { cash: "Cash", check: "Check", charge: "Charge" };

export default function History() {
  const s = useDemo();
  const [view, setView] = useState<"invoices" | "routes">("invoices");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const q = query.trim().toLowerCase();

  const invoices = s.invoices
    .filter((i) => !q || String(i.number).includes(q) || customerOf(s, i.customerId).name.toLowerCase().includes(q))
    .sort((a, b) => b.number - a.number)
    .slice(0, 60);
  const routes = s.routes
    .filter((r) => s.invoices.some((i) => i.routeId === r.id))
    .filter((r) => !q || String(r.number) === q || r.driver.toLowerCase().includes(q))
    .sort((a, b) => b.date.localeCompare(a.date) || a.number - b.number);
  const inv = open ? s.invoices.find((i) => i.number === open) : undefined;

  return (
    <Page title="History" sub="Every invoice and route sheet, kept">
      <Segments
        label="Show"
        value={view}
        onChange={setView}
        options={[
          { value: "invoices", label: "Invoices" },
          { value: "routes", label: "Route sheets" },
        ]}
      />
      <TextField
        label="Search"
        value={query}
        onChange={setQuery}
        placeholder={view === "invoices" ? "Invoice number or customer" : "Route number or driver"}
      />

      {view === "invoices" ? (
        <div className="flex flex-col gap-2">
          {invoices.map((i) => {
            const c = customerOf(s, i.customerId);
            const r = routeOf(s, i.routeId);
            return (
              <button key={i.number} onClick={() => setOpen(i.number)} className="flex items-center gap-3 rounded-3xl border border-line bg-card p-4 text-left active:scale-[0.99] transition">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold">
                    #{i.number} · {c.name}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {day(i.date)} · Route {r.number} · {r.driver}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold tabular-nums">{money(i.result?.amount ?? invoiceTotal(i))}</p>
                  <Tag tone={i.status === "void" ? "bad" : i.status === "open" ? "neutral" : "good"}>
                    {i.status === "void" ? "Void" : i.result ? METHOD[i.result.method] : "Open"}
                  </Tag>
                </div>
              </button>
            );
          })}
          {!invoices.length ? <p className="py-6 text-center text-sm text-muted">No invoices match.</p> : null}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {routes.map((r) => {
            const sheet = routeSheet(s, r.id);
            return (
              <Card key={r.id} href={`/colin/route/${r.id}`}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold">
                    Route {r.number} · {r.driver}
                  </p>
                  <Tag>{statusLabel(r.status)}</Tag>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {day(r.date)} · {sheet.invoicesOut} invoices · {sheet.eggsSold} boxes sold · {money(sheet.sales)}
                </p>
              </Card>
            );
          })}
        </div>
      )}

      {inv ? (
        <Sheet open onOpenChange={(o) => !o && setOpen(null)} title={`Invoice ${inv.number}`}>
          <div className="flex flex-col gap-3">
            <InvoicePaper inv={inv} />
            {inv.result ? (
              <Card>
                <p className="text-sm">
                  Delivered {day(inv.result.at.slice(0, 10))} at {time(inv.result.at)} · {METHOD[inv.result.method]} {money(inv.result.amount)}
                  {inv.result.checkNo ? ` · check #${inv.result.checkNo}` : ""}
                </p>
                {inv.result.signature ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={inv.result.signature} alt="Customer signature" className="mt-2 h-20 w-full rounded-xl bg-[#fffbea] object-contain" />
                ) : (
                  <p className="mt-1 text-xs text-muted">Signed on paper{inv.result.signedBy ? ` by ${inv.result.signedBy}` : ""}.</p>
                )}
                <p className="mt-1 text-xs text-muted">{inv.enteredCount ? `In QuickBooks${inv.enteredCount > 1 ? ` ${inv.enteredCount} times` : ""}` : "Not in QuickBooks yet"}</p>
              </Card>
            ) : null}
            <Link href={`/colin/route/${inv.routeId}`} className="text-center text-sm font-medium text-muted underline">
              Open route {routeOf(s, inv.routeId).number} sheet
            </Link>
          </div>
        </Sheet>
      ) : null}
    </Page>
  );
}
