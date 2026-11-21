"use client";

import { useState } from "react";
import Link from "next/link";
import { confirm } from "@ui-sdk/react/alert-dialog";
import { toast } from "@ui-sdk/react/toast";
import { Card, Label, Notice, Page, Tag, btn, cx } from "@/components/ui";
import { dayRoutes, onHand, routeInvoices, routeTally, statusLabel } from "@/lib/derive";
import { time } from "@/lib/format";
import { actions, useDemo } from "@/lib/store";

export default function Load() {
  const s = useDemo();
  const routes = dayRoutes(s, s.today);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  async function load(routeId: string) {
    const r = routes.find((x) => x.id === routeId)!;
    const tally = routeTally(s, routeId);
    const total = tally.reduce((n, t) => n + t.boxes, 0);
    const yes = await confirm({
      title: `${r.driver}'s truck loaded?`,
      description: `${total} boxes come out of the cooler for ${r.driver}. Oldest boxes go first.`,
      confirmLabel: "Truck is loaded",
    });
    if (!yes) return;
    actions.confirmLoad(routeId);
    toast(`${r.driver}'s truck loaded`, { description: `${total} boxes out of the cooler.` });
  }

  return (
    <Page title="Load" sub="Alma’s tally for each truck. Check each line as it goes on.">
      {routes.map((r) => {
        const tally = routeTally(s, r.id);
        const invoices = routeInvoices(s, r.id).length;
        const total = tally.reduce((n, t) => n + t.boxes, 0);
        const canLoad = r.status === "ready";
        const done = tally.filter((t) => checked[`${r.id}:${t.productId}`]).length;
        return (
          <Card key={r.id} className={cx(!canLoad && "opacity-90")}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold">
                  {r.driver}
                </p>
                <p className="text-sm text-muted">
                  {invoices ? `${invoices} invoices · ` : ""}
                  {total} boxes
                  {r.loadedAt ? ` · loaded ${time(r.loadedAt)}` : ""}
                </p>
              </div>
              <Tag tone={canLoad ? "yolk" : r.status === "calling" ? "warn" : "good"}>{statusLabel(r.status)}</Tag>
            </div>

            {r.status === "calling" ? (
              <Notice tone="warn">
                Alma is still calling this route. The tally shows up here when she prints the invoices.{" "}
                <Link href="/alma" className="font-semibold underline">
                  Open Alma’s call sheet
                </Link>
              </Notice>
            ) : null}

            {canLoad ? (
              <>
                <div className="mt-3 flex flex-col">
                  {tally.map((t) => {
                    const key = `${r.id}:${t.productId}`;
                    const have = onHand(s, t.productId);
                    const short = have < t.boxes;
                    return (
                      <button
                        key={key}
                        onClick={() => setChecked((c) => ({ ...c, [key]: !c[key] }))}
                        className="flex items-center gap-3 border-b border-line/70 py-3 text-left last:border-0"
                        aria-pressed={!!checked[key]}
                      >
                        <span
                          className={cx(
                            "grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 text-sm font-bold",
                            checked[key] ? "border-ink bg-ink text-paper" : "border-line"
                          )}
                        >
                          {checked[key] ? "✓" : ""}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={cx("block text-[15px] font-semibold", checked[key] && "text-muted line-through")}>{t.name}</span>
                          <span className={cx("block text-xs", short ? "font-semibold text-bad" : "text-muted")}>
                            {short ? `Only ${have} in the cooler` : `${have} in the cooler`}
                          </span>
                        </span>
                        <span className="text-2xl font-bold tabular-nums">{t.boxes}</span>
                      </button>
                    );
                  })}
                </div>
                <button className={cx(btn.primary, "mt-3 w-full")} onClick={() => load(r.id)}>
                  {done === tally.length ? "Truck is loaded" : `Confirm load (${done} of ${tally.length} checked)`}
                </button>
              </>
            ) : null}

            {!canLoad && r.status !== "calling" && tally.length ? (
              <div className="mt-3">
                <Label>Went out</Label>
                <p className="mt-1 text-sm text-muted">{tally.map((t) => `${t.name} ${t.boxes}`).join(" · ")}</p>
              </div>
            ) : null}
          </Card>
        );
      })}
    </Page>
  );
}
