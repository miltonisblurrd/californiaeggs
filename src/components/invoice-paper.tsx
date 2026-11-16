"use client";

import { COMPANY } from "@/lib/data";
import { customerOf, invoiceTotal, productKind, productName, routeOf } from "@/lib/derive";
import { day, money } from "@/lib/format";
import { useDemo } from "@/lib/store";
import type { Invoice } from "@/lib/types";

export function InvoicePaper({ inv }: { inv: Invoice }) {
  const s = useDemo();
  const c = customerOf(s, inv.customerId);
  const r = routeOf(s, inv.routeId);
  const cases = inv.lines.reduce((n, l) => n + l.boxes, 0);
  const charge = c.terms === "Net 30";

  return (
    <article className="invoice-paper relative mx-auto w-full max-w-[640px] bg-white p-6 text-[13px] text-black shadow-sm ring-1 ring-line print:max-w-none print:shadow-none print:ring-0">
      <header className="flex items-start justify-between gap-4 border-b-2 border-black pb-3">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-black text-xl" aria-hidden>
            🐔
          </div>
          <div>
            <p className="text-xl font-black tracking-tight">{COMPANY.name}</p>
            <p className="text-[11px] leading-snug">{COMPANY.mail}</p>
            <p className="text-[11px] leading-snug">{COMPANY.yard}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold uppercase tracking-wide">Invoice</p>
          <p className="text-lg font-bold tabular-nums text-red-700">{inv.number}</p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 border-b border-black py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide">Bill to</p>
          <p className="text-[15px] font-bold">{c.name}</p>
          <p>{c.city}, CA</p>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-right">
          <dt className="text-left text-[10px] font-semibold uppercase">Date</dt>
          <dd>{day(inv.date)}</dd>
          <dt className="text-left text-[10px] font-semibold uppercase">Terms</dt>
          <dd>{c.terms}</dd>
          <dt className="text-left text-[10px] font-semibold uppercase">Driver</dt>
          <dd>{r.driver}</dd>
          <dt className="text-left text-[10px] font-semibold uppercase">Route</dt>
          <dd>{r.number}</dd>
          <dt className="text-left text-[10px] font-semibold uppercase">Case count</dt>
          <dd className="font-bold">{cases}</dd>
        </dl>
      </section>

      <table className="mt-3 w-full border-collapse">
        <thead>
          <tr className="border-b border-black text-left text-[10px] uppercase tracking-wide">
            <th className="w-12 py-1">Qty</th>
            <th className="py-1">Item / description</th>
            <th className="w-20 py-1 text-right">Price</th>
            <th className="w-24 py-1 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {inv.lines.map((l) => (
            <tr key={l.productId} className="border-b border-black/20 align-top">
              <td className="py-1.5 font-bold tabular-nums">{l.boxes}</td>
              <td className="py-1.5">
                <span className="font-semibold">{productName(s, l.productId)}</span>
                <span className="block text-[11px]">{productKind(s, l.productId) === "cheese" ? "Cheese, case" : "15 doz · cage free · grade AA"}</span>
              </td>
              <td className="py-1.5 text-right tabular-nums">{money(inv.prices[l.productId])}</td>
              <td className="py-1.5 text-right tabular-nums">{money(l.boxes * inv.prices[l.productId])}</td>
            </tr>
          ))}
          {inv.swap ? (
            <tr className="border-b border-black/20">
              <td className="py-1.5 font-bold">1</td>
              <td className="py-1.5">
                <span className="font-semibold">Swap: {productName(s, inv.swap.productId)}</span>
                <span className="block text-[11px]">Expired box exchanged. No charge.</span>
              </td>
              <td className="py-1.5 text-right">—</td>
              <td className="py-1.5 text-right tabular-nums">{money(0)}</td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="text-[11px] leading-snug">
          <p>Cash ______ Check # ______</p>
          <p className="mt-4">Received by ______________________</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase">Total</p>
          <p className="text-2xl font-black tabular-nums">{money(invoiceTotal(inv))}</p>
        </div>
      </div>

      {charge ? (
        <p className="pointer-events-none absolute right-8 top-40 -rotate-12 rounded border-4 border-red-600 px-3 py-1 text-3xl font-black uppercase tracking-widest text-red-600/80">
          Charge
        </p>
      ) : null}

      <footer className="mt-4 border-t border-black pt-2 text-[10px] leading-snug">
        All shell eggs sold comply with California Proposition 12. Keep refrigerated at 45°F or below. Orders by call or text.
      </footer>
    </article>
  );
}
