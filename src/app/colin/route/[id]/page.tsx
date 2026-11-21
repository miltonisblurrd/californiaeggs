"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { RouteSheetCard } from "@/components/route-sheet";
import { Card, Label, Notice } from "@/components/ui";
import { customerOf, routeInvoices, statusLabel } from "@/lib/derive";
import { day, money } from "@/lib/format";
import { useDemo } from "@/lib/store";

const METHOD = { cash: "Cash", check: "Check", charge: "Charge" };

export default function RouteRecord() {
  const { id } = useParams<{ id: string }>();
  const s = useDemo();
  const route = s.routes.find((r) => r.id === id);
  const audit = s.audits.find((a) => a.routeId === id);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pb-28 pt-4">
      <Link href="/colin/history" className="text-sm font-medium text-muted">
        ← History
      </Link>
      {!route ? (
        <Notice tone="bad">That route doesn’t exist.</Notice>
      ) : (
        <>
          <div>
            <h1 className="text-[26px] font-bold leading-tight tracking-tight">
              Route {route.number} · {route.driver}
            </h1>
            <p className="text-sm text-muted">
              {day(route.date)} · {statusLabel(route.status)}
            </p>
          </div>
          <RouteSheetCard routeId={route.id} />
          <Link href={`/colin/print/${route.id}`} className="text-center text-sm font-medium text-muted underline">
            Print paper copies of these invoices
          </Link>
          {audit ? (
            <Card>
              <Label>Audit</Label>
              <p className="mt-1 text-sm">
                Counted {money(audit.cash)} cash and {audit.checks} checks for {money(audit.checkAmount)}
                {audit.note ? `. “${audit.note}”` : "."}
              </p>
            </Card>
          ) : null}
          <Label>Invoices</Label>
          <Card>
            {routeInvoices(s, route.id).map((i) => (
              <div key={i.number} className="flex justify-between gap-3 border-b border-line/60 py-2 text-sm last:border-0">
                <span className="truncate">
                  #{i.number} · {customerOf(s, i.customerId).name}
                </span>
                <span className="shrink-0 tabular-nums">{i.status === "void" ? "Void" : i.result ? `${METHOD[i.result.method]} ${money(i.result.amount)}` : "Open"}</span>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}
