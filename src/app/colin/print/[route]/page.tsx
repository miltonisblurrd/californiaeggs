"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { InvoicePaper } from "@/components/invoice-paper";
import { Notice, btn } from "@/components/ui";
import { routeInvoices } from "@/lib/derive";
import { day } from "@/lib/format";
import { useDemo } from "@/lib/store";

export default function PrintRoute() {
  const { route: id } = useParams<{ route: string }>();
  const s = useDemo();
  const route = s.routes.find((r) => r.id === id);
  const invoices = route ? routeInvoices(s, route.id) : [];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pb-28 pt-4 print:p-0">
      <div className="flex flex-col gap-3 print:hidden">
        <Link href={route ? `/colin/route/${route.id}` : "/colin/history"} className="text-sm font-medium text-muted">
          ← Route record
        </Link>
        {route ? (
          <>
            <div>
              <h1 className="text-[26px] font-bold leading-tight tracking-tight">Route {route.number} invoices</h1>
              <p className="text-sm text-muted">
                {route.driver} · {day(route.date)} · {invoices.length} invoices, in stop order
              </p>
            </div>
            {invoices.length ? (
              <button className={btn.primary} onClick={() => window.print()}>
                Print {invoices.length} invoices
              </button>
            ) : (
              <Notice>No invoices on this route yet. Alma hasn’t sent them out.</Notice>
            )}
          </>
        ) : (
          <Notice tone="bad">That route doesn’t exist.</Notice>
        )}
      </div>
      {invoices.map((inv) => (
        <div key={inv.number} className="print:break-after-page">
          <InvoicePaper inv={inv} />
        </div>
      ))}
    </div>
  );
}
