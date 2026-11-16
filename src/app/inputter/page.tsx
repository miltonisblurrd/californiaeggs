"use client";

import { Checkbox, CheckboxIndicator } from "@ui-sdk/react/checkbox";
import { toast } from "@ui-sdk/react/toast";
import { Bar, Card, Label, Notice, Page, Tag, cx } from "@/components/ui";
import { customerOf, routeInvoices } from "@/lib/derive";
import { day, money } from "@/lib/format";
import { actions, useDemo } from "@/lib/store";

const METHOD = { cash: "Cash", check: "Check", charge: "Charge" };

export default function Inputter() {
  const s = useDemo();
  const routes = s.routes.filter((r) => r.status === "audited" || r.status === "entered").sort((a, b) => a.date.localeCompare(b.date) || a.number - b.number);

  return (
    <Page title="To enter" sub="Audited bags. Enter each invoice in QuickBooks, then check it off.">
      {routes.length === 0 ? <Notice tone="neutral">Nothing audited yet. Colin audits bags first.</Notice> : null}
      {routes.map((r) => {
        const invs = routeInvoices(s, r.id).filter((i) => i.status !== "open");
        const toEnter = invs.filter((i) => i.status === "delivered");
        const done = toEnter.filter((i) => i.enteredCount > 0).length;
        return (
          <section key={r.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>
                Route {r.number} · {r.driver} · {day(r.date)}
              </Label>
              <Tag tone={done === toEnter.length ? "good" : "neutral"}>
                {done}/{toEnter.length}
              </Tag>
            </div>
            <Bar value={done} max={toEnter.length} label={`Route ${r.number} entered`} tone="good" />
            <Card className="p-0">
              {invs.map((i) => {
                const c = customerOf(s, i.customerId);
                const entered = i.enteredCount > 0;
                if (i.status === "void") {
                  return (
                    <div key={i.number} className="flex items-center gap-3 border-b border-line/60 px-4 py-3 last:border-0 text-muted">
                      <span className="w-6" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate line-through">
                          #{i.number} · {c.name}
                        </p>
                        <p className="text-xs">Void. Don’t enter.</p>
                      </div>
                    </div>
                  );
                }
                return (
                  <label key={i.number} className={cx("flex cursor-pointer items-center gap-3 border-b border-line/60 px-4 py-3 last:border-0", entered && "bg-good/5")}>
                    <Checkbox
                      checked={entered}
                      onCheckedChange={(v) => {
                        actions.setEntered(i.number, !!v);
                        if (v) toast(`#${i.number} entered`);
                      }}
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 border-line bg-card data-checked:border-good data-checked:bg-good"
                    >
                      <CheckboxIndicator className="text-sm font-bold text-white">✓</CheckboxIndicator>
                    </Checkbox>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        #{i.number} · {c.name}
                      </p>
                      <p className="text-xs text-muted">
                        {METHOD[i.result!.method]}
                        {i.result!.checkNo ? ` #${i.result!.checkNo}` : ""}
                        {i.enteredCount > 1 ? <span className="font-semibold text-bad"> · entered {i.enteredCount}×</span> : null}
                      </p>
                    </div>
                    <span className="shrink-0 font-semibold tabular-nums">{money(i.result!.amount)}</span>
                  </label>
                );
              })}
            </Card>
          </section>
        );
      })}
    </Page>
  );
}
