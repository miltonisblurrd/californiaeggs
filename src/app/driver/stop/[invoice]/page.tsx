"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { confirm } from "@ui-sdk/react/alert-dialog";
import { toast } from "@ui-sdk/react/toast";
import { SignaturePad } from "@/components/signature-pad";
import { BoxStepper, Label, Notice, Segments, Tag, TextField, btn, cx } from "@/components/ui";
import { customerBalance, customerOf, productName, routeInvoices, routeOf } from "@/lib/derive";
import { day, money, time } from "@/lib/format";
import { actions, useDemo } from "@/lib/store";
import type { PayMethod, ProductId } from "@/lib/types";

const METHODS: { value: PayMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "check", label: "Check" },
  { value: "charge", label: "Charge" },
];

export default function Stop() {
  const params = useParams<{ invoice: string }>();
  const s = useDemo();
  const inv = s.invoices.find((i) => i.number === Number(params.invoice));
  if (!inv) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
        <Notice tone="bad">Invoice {params.invoice} isn’t on any route.</Notice>
        <Link href="/driver" className={btn.secondary}>
          Back to my route
        </Link>
      </div>
    );
  }
  return <StopForm key={`${inv.number}-${inv.status}`} number={inv.number} />;
}

function StopForm({ number }: { number: number }) {
  const s = useDemo();
  const router = useRouter();
  const inv = s.invoices.find((i) => i.number === number)!;
  const c = customerOf(s, inv.customerId);
  const route = routeOf(s, inv.routeId);
  const list = routeInvoices(s, inv.routeId);
  const nextOpen = list.find((i) => i.status === "open" && i.number !== inv.number);
  const editable = inv.status === "open" && route.status === "out";
  const oldBalance = customerBalance(s, c.id).balance;

  const [delivered, setDelivered] = useState<Record<ProductId, number>>(() =>
    Object.fromEntries(inv.lines.map((l) => [l.productId, inv.result?.delivered.find((d) => d.productId === l.productId)?.boxes ?? l.boxes]))
  );
  const [method, setMethod] = useState<PayMethod | null>(inv.result?.method ?? (c.terms === "Net 30" ? "charge" : null));
  const [checkNo, setCheckNo] = useState(inv.result?.checkNo ?? "");
  const [signature, setSignature] = useState<string | undefined>(inv.result?.signature);
  const [signedBy, setSignedBy] = useState(inv.result?.signedBy ?? "");

  const amount = inv.lines.reduce((n, l) => n + (delivered[l.productId] ?? 0) * inv.prices[l.productId], 0);
  const ordered = inv.lines.reduce((n, l) => n + l.boxes * inv.prices[l.productId], 0);
  const short = inv.lines.filter((l) => (delivered[l.productId] ?? 0) < l.boxes);
  const missing = [!signature && "a signature", !method && "how they paid", method === "check" && !checkNo.trim() && "the check number"].filter(Boolean);

  function save() {
    if (!method) return;
    actions.saveStop(inv.number, {
      delivered: inv.lines.map((l) => ({ productId: l.productId, boxes: delivered[l.productId] ?? 0 })),
      method,
      checkNo: method === "check" ? checkNo.trim() : undefined,
      signature,
      signedBy: signedBy.trim() || undefined,
    });
    toast(`${c.name} done`, { description: `${money(amount)} · ${METHODS.find((m) => m.value === method)!.label}` });
    router.push(nextOpen ? `/driver/stop/${nextOpen.number}` : "/driver");
  }

  async function voidIt() {
    const yes = await confirm({
      title: `Void invoice ${inv.number}?`,
      description: `${c.name} took nothing. All ${inv.lines.reduce((n, l) => n + l.boxes, 0)} boxes come back to the cooler at check-in.`,
      confirmLabel: "Void invoice",
    });
    if (!yes) return;
    actions.voidStop(inv.number);
    toast(`Invoice ${inv.number} voided`);
    router.push(nextOpen ? `/driver/stop/${nextOpen.number}` : "/driver");
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pb-28 pt-3">
      <Link href="/driver" className="text-sm font-medium text-muted">
        ← Route {route.number}
      </Link>

      {/* The yellow invoice */}
      <div className="overflow-hidden rounded-3xl border border-[#e8d58a] bg-[#fff6c9] shadow-sm">
        <div className="flex items-start justify-between gap-3 border-b border-[#e8d58a] px-4 py-3">
          <div>
            <p className="font-serif text-lg font-bold italic tracking-tight">Cal - Egg - X</p>
            <p className="text-[11px] leading-tight text-muted">Wholesale eggs · Los Angeles</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-muted">Invoice</p>
            <p className="text-lg font-bold tabular-nums text-bad">{inv.number}</p>
          </div>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2 border-b border-[#e8d58a] px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-muted">Sold to</p>
            <p className="truncate text-[17px] font-bold">{c.name}</p>
            <p className="text-sm text-muted">{c.city}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-muted">Date</p>
            <p className="text-sm font-semibold">{day(inv.date)}</p>
            <div className="mt-1">
              <Tag tone={c.terms === "Net 30" ? "warn" : "neutral"}>{c.terms}</Tag>
            </div>
          </div>
        </div>

        <div className="px-4 py-2">
          <div className="grid grid-cols-[1fr_auto] py-1 text-[11px] uppercase tracking-wide text-muted">
            <span>Item · price</span>
            <span>{editable ? "Delivered" : "Quant"}</span>
          </div>
          {inv.lines.map((l) => {
            const d = delivered[l.productId] ?? 0;
            return (
              <div key={l.productId} className="grid grid-cols-[1fr_auto] items-center gap-2 border-t border-[#efe0a0] py-2.5">
                <div className="min-w-0">
                  <p className="text-[16px] font-semibold">{productName(s, l.productId)}</p>
                  <p className="text-xs text-muted">
                    {money(inv.prices[l.productId])} a box · ordered {l.boxes}
                    {d < l.boxes ? <span className="font-semibold text-bad"> · {l.boxes - d} back</span> : null}
                  </p>
                </div>
                {editable ? (
                  <BoxStepper
                    value={d}
                    onChange={(n) => setDelivered((x) => ({ ...x, [l.productId]: n ?? 0 }))}
                    max={l.boxes}
                    label={`${productName(s, l.productId)} delivered`}
                    size="sm"
                  />
                ) : (
                  <span className="text-xl font-bold tabular-nums">{inv.status === "void" ? 0 : d}</span>
                )}
              </div>
            );
          })}
          {inv.swap ? (
            <div className="grid grid-cols-[1fr_auto] items-center gap-2 border-t border-[#efe0a0] py-2.5">
              <div>
                <p className="text-[16px] font-semibold text-bad">Swap: {productName(s, inv.swap.productId)}</p>
                <p className="text-xs text-muted">Take 1 expired box back, leave 1 fresh. No charge.</p>
              </div>
              <span className="text-xl font-bold tabular-nums">1</span>
            </div>
          ) : null}
        </div>

        <div className="flex items-end justify-between border-t border-[#e8d58a] bg-[#fdeea8] px-4 py-3">
          <div className="text-xs text-muted">
            {short.length && editable ? <p>Ordered {money(ordered)}</p> : null}
            {inv.status === "void" ? <p className="font-semibold text-bad">Void. Nothing delivered.</p> : null}
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-muted">Total</p>
            <p className={cx("text-[26px] font-bold leading-none tabular-nums", inv.status === "void" && "text-muted line-through")}>
              {money(inv.status === "void" ? ordered : amount)}
            </p>
          </div>
        </div>
      </div>

      {route.status !== "out" && inv.status === "open" ? (
        <Notice>{route.status === "loaded" ? "Start the route first." : "This route isn’t on the road."}</Notice>
      ) : null}

      {editable && oldBalance > 0 ? (
        <Notice tone="neutral">
          {c.name} owes {money(oldBalance)} from before. If they pay toward it, add it as R.O.A. on the route bag.
        </Notice>
      ) : null}

      {editable ? (
        <>
          <section className="flex flex-col gap-2">
            <Label>Signature</Label>
            <SignaturePad value={signature} onChange={setSignature} />
            <TextField label="Signed by (optional)" value={signedBy} onChange={setSignedBy} placeholder="Name of who signed" />
          </section>

          <section className="flex flex-col gap-2">
            <Label>Paid</Label>
            <Segments label="How they paid" value={method} onChange={setMethod} options={METHODS} />
            {c.terms === "Net 30" && method !== "charge" ? (
              <p className="text-xs text-warn">This customer is usually on charge.</p>
            ) : null}
            {method === "check" ? (
              <TextField label="Check number" value={checkNo} onChange={setCheckNo} inputMode="numeric" placeholder="e.g. 4417" />
            ) : null}
          </section>

          <button className={btn.primary} disabled={missing.length > 0} onClick={save}>
            {missing.length ? `Add ${missing.join(" and ")}` : `Save · ${money(amount)}`}
          </button>
          <button className={btn.danger} onClick={voidIt}>
            They took nothing. Void invoice
          </button>
        </>
      ) : null}

      {inv.status === "delivered" && inv.result ? (
        <section className="flex flex-col gap-3 rounded-3xl border border-line bg-card p-4">
          <div className="flex items-center justify-between">
            <Label>Done at {time(inv.result.at)}</Label>
            <Tag tone="good">{METHODS.find((m) => m.value === inv.result!.method)!.label}</Tag>
          </div>
          {inv.result.checkNo ? <p className="text-sm">Check #{inv.result.checkNo}</p> : null}
          {inv.result.signature ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={inv.result.signature} alt="Customer signature" className="h-28 w-full rounded-2xl bg-[#fffbea] object-contain" />
          ) : (
            <p className="text-sm text-muted">Signed on paper.</p>
          )}
          {inv.result.signedBy ? <p className="text-sm text-muted">Signed by {inv.result.signedBy}</p> : null}
        </section>
      ) : null}

      {inv.status !== "open" && route.status === "out" ? (
        <button
          className={btn.secondary}
          onClick={() => {
            actions.reopenStop(inv.number);
            toast("Stop reopened", { description: "Fix it and save again." });
          }}
        >
          Change this stop
        </button>
      ) : null}
    </div>
  );
}
