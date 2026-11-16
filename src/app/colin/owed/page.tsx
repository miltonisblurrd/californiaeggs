"use client";

import { useState } from "react";
import { toast } from "@ui-sdk/react/toast";
import { Big, Card, Label, MoneyField, Notice, Page, Segments, Sheet, Tag, TextField, btn, cx } from "@/components/ui";
import { balances, customerBalance, customerLedger, customerOf } from "@/lib/derive";
import { day, money } from "@/lib/format";
import { actions, useDemo } from "@/lib/store";

export default function Owed() {
  const s = useDemo();
  const list = balances(s);
  const total = list.reduce((n, b) => n + b.balance, 0);
  const over30 = list.filter((b) => b.days > 30);
  const [open, setOpen] = useState<string | null>(null);

  return (
    <Page title="Owed to you" sub="Charge accounts and open tallies">
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <Big value={money(total)} label={`${list.length} customers`} />
          <Big value={money(over30.reduce((n, b) => n + b.balance, 0))} label={`${over30.length} past 30 days`} tone={over30.length ? "bad" : undefined} />
        </div>
      </Card>

      {list.length === 0 ? <Notice tone="good">Nobody owes anything.</Notice> : null}

      <div className="flex flex-col gap-2">
        {list.map((b) => (
          <button key={b.customer.id} onClick={() => setOpen(b.customer.id)} className="flex items-center gap-3 rounded-3xl border border-line bg-card p-4 text-left active:scale-[0.99] transition">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-semibold">{b.customer.name}</p>
              <p className="truncate text-xs text-muted">
                Route {b.customer.routeNo} · {b.customer.city}
                {b.oldest ? ` · oldest ${day(b.oldest)}` : ""}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[16px] font-bold tabular-nums">{money(b.balance)}</p>
              {b.customer.openTally ? <Tag tone="yolk">Open tally</Tag> : <Tag tone={b.days > 30 ? "bad" : b.days > 14 ? "warn" : "neutral"}>{`${b.days} days`}</Tag>}
            </div>
          </button>
        ))}
      </div>

      {open ? <Account customerId={open} onClose={() => setOpen(null)} /> : null}
    </Page>
  );
}

function Account({ customerId, onClose }: { customerId: string; onClose: () => void }) {
  const s = useDemo();
  const c = customerOf(s, customerId);
  const { balance } = customerBalance(s, customerId);
  const ledger = customerLedger(s, customerId);
  const [amount, setAmount] = useState<number | null>(null);
  const [method, setMethod] = useState<"cash" | "check">("check");
  const [checkNo, setCheckNo] = useState("");
  const ready = !!amount && amount > 0 && (method === "cash" || checkNo.trim());

  let running = 0;
  const rows = ledger.map((e) => ({ ...e, running: (running = Math.round((running + e.amount) * 100) / 100) }));

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title={c.name}>
      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <Big value={money(balance)} label="Owes now" tone={balance > 0 ? "warn" : "good"} />
          <p className="text-right text-xs text-muted">
            {c.terms}
            {c.openTally ? " · open tally" : ""}
            <br />
            Route {c.routeNo}
          </p>
        </div>

        <section>
          <Label>History</Label>
          <div className="mt-1">
            {rows
              .slice()
              .reverse()
              .map((e, i) => (
                <div key={i} className="flex items-center justify-between gap-3 border-b border-line/70 py-2 last:border-0">
                  <div className="min-w-0">
                    <p className="truncate text-[15px]">
                      {e.label}
                      {e.checkNo ? ` · check #${e.checkNo}` : ""}
                    </p>
                    <p className="text-xs text-muted">{day(e.at.slice(0, 10))}</p>
                  </div>
                  <div className="shrink-0 text-right tabular-nums">
                    <p className={cx("text-[15px] font-semibold", e.amount < 0 && "text-good")}>{e.amount < 0 ? `−${money(-e.amount)}` : money(e.amount)}</p>
                    <p className="text-xs text-muted">{money(e.running)}</p>
                  </div>
                </div>
              ))}
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl bg-paper p-3">
          <Label>Collect a payment</Label>
          <MoneyField label="Amount" value={amount} onChange={setAmount} />
          <div className="flex gap-2">
            <button type="button" className={cx(btn.ghost, "border border-line")} onClick={() => setAmount(balance)}>
              Full {money(balance)}
            </button>
          </div>
          <Segments
            label="Paid with"
            value={method}
            onChange={setMethod}
            options={[
              { value: "check", label: "Check" },
              { value: "cash", label: "Cash" },
            ]}
          />
          {method === "check" ? <TextField label="Check number" value={checkNo} onChange={setCheckNo} inputMode="numeric" /> : null}
          <button
            className={btn.primary}
            disabled={!ready}
            onClick={() => {
              actions.recordPayment({ customerId, amount: amount!, method, checkNo: method === "check" ? checkNo.trim() : undefined });
              toast(`${money(amount!)} from ${c.name}`, { description: `Now owes ${money(Math.max(0, balance - amount!))}.` });
              setAmount(null);
              setCheckNo("");
            }}
          >
            Record payment
          </button>
        </section>
      </div>
    </Sheet>
  );
}
