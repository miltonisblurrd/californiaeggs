"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@ui-sdk/react/tabs";
import { MoveTimeline } from "@/components/moves";
import { PullSheet } from "@/components/pull-sheet";
import { Big, Card, Label, Page, Sheet, Tag, btn, cx } from "@/components/ui";
import { coolerRows, coolerTotals, vendorName } from "@/lib/derive";
import { day, money } from "@/lib/format";
import { useDemo } from "@/lib/store";

const tabCls =
  "h-10 flex-1 rounded-xl text-sm font-semibold text-muted data-selected:bg-card data-selected:text-ink data-selected:shadow-sm outline-none";

export default function CoolerPage() {
  const s = useDemo();
  const rows = coolerRows(s);
  const totals = coolerTotals(s);
  const [openId, setOpenId] = useState<string | null>(null);
  const [pullOpen, setPullOpen] = useState(false);
  const [pullProduct, setPullProduct] = useState<string | undefined>();
  const open = rows.find((r) => r.product.id === openId);

  return (
    <Page
      title="Cooler"
      sub="Live. Every box in and out, with what you paid."
      action={
        <button
          className={btn.secondary}
          onClick={() => {
            setPullProduct(undefined);
            setPullOpen(true);
          }}
        >
          Pull
        </button>
      }
    >
      <Card>
        <Big value={money(totals.dollars)} label="Cooler value at cost" />
        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line/70 pt-3">
          <Big value={totals.eggBoxes.toLocaleString()} label="Boxes of eggs" />
          <Big value={totals.cheese} label="Cheese" />
        </div>
      </Card>

      <Tabs defaultValue="products">
        <TabsList aria-label="Cooler views" className="flex gap-1 rounded-2xl bg-line/60 p-1">
          <TabsTab value="products" className={tabCls}>
            By product
          </TabsTab>
          <TabsTab value="history" className={tabCls}>
            History
          </TabsTab>
        </TabsList>

        <TabsPanel value="products" className="mt-3">
          <Card className="p-0">
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 border-b border-line px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
              <span>Product</span>
              <span className="w-16 text-right">Boxes</span>
              <span className="w-20 text-right">Value</span>
            </div>
            {rows.map((r) => (
              <button
                key={r.product.id}
                onClick={() => setOpenId(r.product.id)}
                className={cx(
                  "grid w-full grid-cols-[1fr_auto_auto] items-center gap-x-4 border-b border-line/70 px-4 py-3 text-left last:border-0 active:bg-line/40",
                  r.boxes === 0 && "text-muted"
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-medium">{r.product.name}</span>
                  <span className="block text-xs text-muted">
                    {r.boxes === 0
                      ? "None on hand"
                      : r.vendors > 1
                        ? `${r.vendors} vendors · avg ${money(r.avgCost)}`
                        : `${vendorName(s, r.lots[0]?.vendorId)} · ${money(r.avgCost)}`}
                  </span>
                </span>
                <span className="w-16 text-right text-lg font-bold tabular-nums">{r.boxes}</span>
                <span className="w-20 text-right text-sm tabular-nums text-muted">{r.boxes ? money(r.dollars) : "—"}</span>
              </button>
            ))}
          </Card>
        </TabsPanel>

        <TabsPanel value="history" className="mt-3">
          <Card>
            <MoveTimeline s={s} moves={s.moves} label="Cooler history" />
          </Card>
        </TabsPanel>
      </Tabs>

      <Sheet
        open={!!open}
        onOpenChange={(o) => !o && setOpenId(null)}
        title={open?.product.name ?? ""}
        description={open ? `${open.boxes} boxes · ${money(open.dollars)} at cost` : ""}
      >
        {open ? (
          <div className="flex flex-col gap-4">
            <div>
              <Label>By vendor, oldest first</Label>
              {open.lots.length ? (
                <div className="mt-2 flex flex-col">
                  {open.lots.map((lot, i) => (
                    <div key={lot.id} className="flex items-center justify-between border-b border-line/70 py-3 last:border-0">
                      <div>
                        <p className="text-[15px] font-semibold">
                          {vendorName(s, lot.vendorId)} {i === 0 ? <Tag tone="yolk">Goes out next</Tag> : null}
                        </p>
                        <p className="text-xs text-muted">
                          {money(lot.cost)} a box · received {day(lot.receivedAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold tabular-nums">{lot.boxes}</p>
                        <p className="text-xs text-muted tabular-nums">{money(lot.boxes * lot.cost)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted">Nothing on hand. A delivery will add a row here.</p>
              )}
            </div>
            {open.lots.length > 1 ? (
              <p className="rounded-2xl bg-yolk/15 px-4 py-3 text-sm">
                You paid between {money(Math.min(...open.lots.map((l) => l.cost)))} and {money(Math.max(...open.lots.map((l) => l.cost)))} a box. Average{" "}
                <strong>{money(open.avgCost)}</strong>. Selling at {money(open.product.price)} leaves about {money(open.product.price - open.avgCost)} a box.
              </p>
            ) : null}
            <button
              className={btn.secondary}
              disabled={!open.boxes}
              onClick={() => {
                setPullProduct(open.product.id);
                setOpenId(null);
                setPullOpen(true);
              }}
            >
              Pull {open.product.name}
            </button>
            <div>
              <Label>History</Label>
              <div className="mt-3">
                <MoveTimeline s={s} moves={s.moves.filter((m) => m.productId === open.product.id)} label={`${open.product.name} history`} />
              </div>
            </div>
          </div>
        ) : null}
      </Sheet>

      <PullSheet key={pullProduct ?? "any"} open={pullOpen} onOpenChange={setPullOpen} who="Colin" productId={pullProduct} />
    </Page>
  );
}
