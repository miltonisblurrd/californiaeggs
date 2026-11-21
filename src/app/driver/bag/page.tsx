"use client";

import { useState } from "react";
import Link from "next/link";
import { confirm } from "@ui-sdk/react/alert-dialog";
import { toast } from "@ui-sdk/react/toast";
import { RouteSheetCard } from "@/components/route-sheet";
import { SignaturePad } from "@/components/signature-pad";
import { Choose, Label, MoneyField, Notice, Page, TextField, btn } from "@/components/ui";
import { balances, customerBalance, customerOf, routeInvoices, routeSheet } from "@/lib/derive";
import { day, money } from "@/lib/format";
import { actions, useDemo } from "@/lib/store";

export default function RouteBag() {
  const s = useDemo();
  const sheet = routeSheet(s, s.driverRoute);
  const route = sheet.route;
  const turnedIn = ["back", "checkedIn", "audited", "entered"].includes(route.status);
  const left = sheet.invoicesOut - sheet.invoicesIn;
  const [roaList, setRoaList] = useState<{ customerId: string; amount: number; checkNo?: string }[]>([]);
  const [pick, setPick] = useState<string | null>(null);
  const [pickAmount, setPickAmount] = useState<number | null>(null);
  const [pickCheck, setPickCheck] = useState("");
  const roa = { count: roaList.length, amount: roaList.reduce((n, p) => n + p.amount, 0) };
  const owing = balances(s).filter((b) => !roaList.some((p) => p.customerId === b.customer.id));
  const onRoute = new Set(routeInvoices(s, route.id).map((i) => i.customerId));
  const owingOptions = [...owing.filter((b) => onRoute.has(b.customer.id)), ...owing.filter((b) => !onRoute.has(b.customer.id))].map((b) => ({
    value: b.customer.id,
    label: `${b.customer.name} · owes ${money(b.balance)}`,
  }));
  const [signature, setSignature] = useState<string | undefined>();

  async function submit() {
    const yes = await confirm({
      title: "Put the bag in the lockbox?",
      description: `${money(sheet.cash.amount)} cash and ${sheet.checks.count} ${sheet.checks.count === 1 ? "check" : "checks"} for ${money(sheet.checks.amount)}${roa.amount ? `, plus ${money(roa.amount)} R.O.A.` : ""}. Colin counts it at audit.`,
      confirmLabel: "Turn in bag",
    });
    if (!yes) return;
    actions.submitBag(route.id, roaList, signature);
    toast("Bag turned in", { description: "Alejandro checks in the returns next." });
  }

  return (
    <Page title="Route bag" sub={`${route.driver} · ${day(route.date)}`}>
      {route.status === "out" && left > 0 ? (
        <Notice>
          {left} {left === 1 ? "stop is" : "stops are"} still open.{" "}
          <Link href="/driver" className="font-semibold underline">
            Finish the route
          </Link>
        </Notice>
      ) : null}
      {["calling", "ready", "loaded"].includes(route.status) ? <Notice tone="neutral">This route hasn’t gone out yet.</Notice> : null}
      {turnedIn ? <Notice tone="good">In the lockbox. Colin audits it this week.</Notice> : null}

      <RouteSheetCard routeId={route.id} roa={turnedIn ? undefined : roa} showNumber={false} />

      {route.status === "out" ? (
        <>
          <section className="flex flex-col gap-3 rounded-3xl border border-line bg-card p-4">
            <Label>R.O.A. · old balances paid today</Label>
            {roaList.map((p) => (
              <div key={p.customerId} className="flex items-center justify-between gap-3 border-b border-line/70 pb-2">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium">{customerOf(s, p.customerId).name}</p>
                  <p className="text-xs text-muted">{p.checkNo ? `Check #${p.checkNo}` : "Cash"}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold tabular-nums">{money(p.amount)}</span>
                  <button className={btn.ghost} onClick={() => setRoaList((l) => l.filter((x) => x.customerId !== p.customerId))}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <Choose
              label="Who paid"
              value={pick}
              onChange={(v) => {
                setPick(v);
                setPickAmount(v ? customerBalance(s, v).balance : null);
              }}
              placeholder="Customer with a balance"
              options={owingOptions}
            />
            {pick ? (
              <>
                <MoneyField label="Amount" value={pickAmount} onChange={setPickAmount} />
                <TextField label="Check number (blank if cash)" value={pickCheck} onChange={setPickCheck} inputMode="numeric" />
                <button
                  className={btn.secondary}
                  disabled={!pickAmount}
                  onClick={() => {
                    setRoaList((l) => [...l, { customerId: pick, amount: pickAmount!, checkNo: pickCheck.trim() || undefined }]);
                    setPick(null);
                    setPickAmount(null);
                    setPickCheck("");
                  }}
                >
                  Add R.O.A. payment
                </button>
              </>
            ) : null}
          </section>
          <section className="flex flex-col gap-2">
            <Label>{route.driver} signs the route sheet</Label>
            <SignaturePad value={signature} onChange={setSignature} placeholder={`${route.driver} signs here`} />
          </section>
          <button className={btn.primary} disabled={left > 0 || !signature} onClick={submit}>
            {left > 0 ? `${left} stops still open` : signature ? "Turn in bag" : "Sign to turn in the bag"}
          </button>
        </>
      ) : null}
    </Page>
  );
}
