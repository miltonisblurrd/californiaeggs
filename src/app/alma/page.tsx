"use client";

import { useState } from "react";
import Link from "next/link";
import { confirm } from "@ui-sdk/react/alert-dialog";
import { toast } from "@ui-sdk/react/toast";
import { Bar, BoxStepper, Card, Choose, Label, Notice, Page, Tag, btn, cx } from "@/components/ui";
import { customerOf, dayRoutes, nextServiceDay, productName, routeOrders, routeTally, statusLabel } from "@/lib/derive";
import { day } from "@/lib/format";
import { actions, lastOrder, useDemo } from "@/lib/store";
import type { Order } from "@/lib/types";

export default function CallSheet() {
  const s = useDemo();
  const tomorrow = nextServiceDay(s.today);
  const routes = dayRoutes(s, tomorrow);
  const route = routes.find((r) => r.id === s.almaRoute) ?? routes[0];
  const orders = routeOrders(s, route.id);
  const editable = route.status === "calling";
  const tally = routeTally(s, route.id);
  const toCall = orders.filter((o) => !customerOf(s, o.customerId).standing || o.extra);
  const called = toCall.filter((o) => o.called).length;
  const withOrder = orders.filter((o) => o.lines.some((l) => l.boxes > 0)).length;
  const [addPick, setAddPick] = useState<string | null>(null);

  const offDayOptions = s.customers
    .filter((c) => c.routeNo !== route.number && !orders.some((o) => o.customerId === c.id))
    .map((c) => ({ value: c.id, label: `${c.name} · ${c.city}` }));

  async function printInvoices() {
    const left = toCall.length - called;
    const yes = await confirm({
      title: `Print invoices for route ${route.number}?`,
      description: `${withOrder} invoices for ${route.driver}.${left ? ` ${left} ${left === 1 ? "customer was" : "customers were"} not reached and get no invoice.` : ""} Alejandro gets the box tally to load.`,
      confirmLabel: "Print invoices",
    });
    if (!yes) return;
    actions.markRouteReady(route.id);
    toast(`Route ${route.number} is ready`, { description: `${withOrder} invoices. The tally is on Alejandro’s load screen.` });
    const next = routes.find((r) => r.status === "calling" && r.id !== route.id);
    if (next) actions.pickAlmaRoute(next.id);
  }

  return (
    <Page title="Call sheet" sub={`For tomorrow, ${day(tomorrow)}. One sheet per route, same customers every week.`}>
      <Choose
        label="Route"
        value={route.id}
        onChange={(v) => v && actions.pickAlmaRoute(v)}
        options={routes.map((r) => ({ value: r.id, label: `Route ${r.number} · ${r.driver} · ${statusLabel(r.status)}` }))}
      />

      {editable ? (
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              {called} of {toCall.length} called
            </p>
            <p className="text-sm text-muted">{orders.length - toCall.length} standing orders already filled</p>
          </div>
          <div className="mt-2">
            <Bar value={called} max={toCall.length} label="Customers called" tone={called === toCall.length ? "good" : "ink"} />
          </div>
        </Card>
      ) : (
        <Notice tone="good">
          Invoices printed. Alejandro loads route {route.number} in the morning.{" "}
          <Link href={`/alma/print/${route.id}`} className="font-semibold underline">
            View and print invoices
          </Link>
        </Notice>
      )}

      {orders.map((o) => (
        <CustomerRow key={o.customerId} order={o} editable={editable} />
      ))}

      {editable ? (
        <Card className="flex flex-col gap-3">
          <Label>Off-day stop</Label>
          <p className="text-sm text-muted">A customer from another day called in. Put them on this truck.</p>
          <Choose label="Customer" value={addPick} onChange={setAddPick} placeholder="Find a customer" options={offDayOptions} />
          <button
            className={btn.secondary}
            disabled={!addPick}
            onClick={() => {
              if (!addPick) return;
              actions.addOffDay(route.id, addPick);
              toast("Off-day stop added", { description: `${customerOf(s, addPick).name} is at the end of route ${route.number}.` });
              setAddPick(null);
            }}
          >
            Add to route {route.number}
          </button>
        </Card>
      ) : null}

      <Card>
        <Label>Tally for the warehouse</Label>
        <p className="mt-0.5 text-xs text-muted">The bottom of the paper sheet. Alejandro loads from this.</p>
        <div className="mt-2 grid grid-cols-2 gap-x-6">
          {tally.length ? (
            tally.map((t) => (
              <div key={t.productId} className="flex justify-between border-b border-line/70 py-2 text-[15px]">
                <span>{t.name}</span>
                <span className="font-bold tabular-nums">{t.boxes}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">No orders yet.</p>
          )}
        </div>
        <p className="mt-3 text-right text-sm font-semibold">{tally.reduce((n, t) => n + t.boxes, 0)} boxes total</p>
      </Card>

      {editable ? (
        <button className={btn.primary} onClick={printInvoices}>
          Print {withOrder} invoices
        </button>
      ) : null}
    </Page>
  );
}

function CustomerRow({ order, editable }: { order: Order; editable: boolean }) {
  const s = useDemo();
  const c = customerOf(s, order.customerId);
  const [adding, setAdding] = useState<string | null>(null);
  const isCallNeeded = !c.standing || order.extra;
  const last = lastOrder(s, c.id);
  const empty = !order.lines.some((l) => l.boxes > 0);

  return (
    <Card className={cx(order.called && empty && isCallNeeded && "opacity-60")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[17px] font-bold leading-tight">
            {order.extra ? "" : `${c.stop}. `}
            {c.name}
          </p>
          <p className="text-sm text-muted">{c.city}</p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1">
          {order.extra ? <Tag tone="yolk">Off-day</Tag> : null}
          {c.standing && !order.extra ? <Tag>Standing</Tag> : null}
          <Tag tone={c.terms === "Net 30" ? "warn" : "neutral"}>{c.terms === "Net 30" ? "Charge" : "COD"}</Tag>
          {isCallNeeded && order.called ? <Tag tone="good">Called</Tag> : null}
        </div>
      </div>

      <p className="mt-2 text-xs text-muted">
        {last.date ? `Last order, ${day(last.date)}` : "Usual"}: {last.lines.map((l) => `${productName(s, l.productId)} ${l.boxes}`).join(", ")}
      </p>

      <div className="mt-2 flex flex-col">
        {order.lines.map((l) => (
          <div key={l.productId} className="flex items-center justify-between gap-2 border-b border-line/60 py-2 last:border-0">
            <span className="text-[15px] font-medium">{productName(s, l.productId)}</span>
            {editable ? (
              <BoxStepper
                value={l.boxes}
                onChange={(n) => (n ? actions.setOrderBoxes(order.routeId, c.id, l.productId, n) : actions.removeOrderLine(order.routeId, c.id, l.productId))}
                label={`${productName(s, l.productId)} boxes for ${c.name}`}
                size="sm"
              />
            ) : (
              <span className="text-lg font-bold tabular-nums">{l.boxes}</span>
            )}
          </div>
        ))}
        {order.swap ? (
          <div className="flex items-center justify-between border-b border-line/60 py-2 last:border-0">
            <span className="text-[15px] font-medium text-bad">Swap 1 expired {productName(s, order.swap.productId)}</span>
            {editable ? (
              <button className={btn.ghost} onClick={() => actions.setSwap(order.routeId, c.id, null)}>
                Remove
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {editable ? (
        <div className="mt-3 flex flex-col gap-2">
          {empty ? (
            <div className="grid grid-cols-2 gap-2">
              <button className={btn.secondary} onClick={() => actions.copyLastWeek(order.routeId, c.id)}>
                Same as last time
              </button>
              <button className={btn.secondary} onClick={() => actions.markNoOrder(order.routeId, c.id)}>
                No order
              </button>
            </div>
          ) : null}
          <div className="grid grid-cols-[1fr_auto] items-end gap-2">
            <Choose
              label="Add a product"
              value={adding}
              onChange={(v) => {
                if (!v) return;
                actions.setOrderBoxes(order.routeId, c.id, v, 1);
                setAdding(null);
              }}
              placeholder="Choose"
              options={s.products.filter((p) => !order.lines.some((l) => l.productId === p.id)).map((p) => ({ value: p.id, label: p.name }))}
            />
            {!order.swap && order.lines[0] ? (
              <button className={cx(btn.secondary, "px-3 text-sm")} onClick={() => actions.setSwap(order.routeId, c.id, order.lines[0].productId)}>
                Expired swap
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
