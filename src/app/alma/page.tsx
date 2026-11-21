"use client";

import { useState } from "react";
import { toast } from "@ui-sdk/react/toast";
import { Bar, BoxStepper, Card, CautionSheet, Choose, Label, Notice, Page, Tag, btn, cx } from "@/components/ui";
import { customerBalance, customerOf, dayRoutes, nextServiceDay, productName, routeOrders, routeTally, statusLabel } from "@/lib/derive";
import { day } from "@/lib/format";
import { actions, lastOrder, useDemo } from "@/lib/store";
import type { Order } from "@/lib/types";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@ui-sdk/react/menu";

const OUTCOME = { "no-order": "No order", "no-delivery": "Talked, no delivery" };

export default function CallSheet() {
  const s = useDemo();
  const dates = [...new Set(s.routes.map((r) => r.date))].sort();
  const sheetDate = s.almaDate && dates.includes(s.almaDate) ? s.almaDate : nextServiceDay(s.today);
  const routes = dayRoutes(s, sheetDate);
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

  const [confirmOpen, setConfirmOpen] = useState(false);
  const left = toCall.length - called;

  function sendInvoices() {
    actions.markRouteReady(route.id);
    toast("Invoices sent", { description: `Alejandro has the load and ${route.driver} has his stops.` });
    const next = routes.find((r) => r.status === "calling" && r.id !== route.id);
    if (next) actions.pickAlmaRoute(next.id);
  }

  return (
    <Page title="Call sheet" sub={`One sheet per route, ${statusLabel(route.status)}.`}>
      <CautionSheet
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Send out invoices?"
        description={`This creates ${withOrder} ${withOrder === 1 ? "invoice" : "invoices"} for ${route.driver} on ${day(sheetDate)} and locks this call sheet.${left ? ` ${left} ${left === 1 ? "customer wasn’t" : "customers weren’t"} reached and won’t get an invoice.` : ""}`}
        confirmLabel="Send Out Invoices"
        onConfirm={sendInvoices}
      />
      <Choose
        label="Drivers"
        value={route.id}
        onChange={(v) => v && actions.pickAlmaRoute(v)}
        options={routes.map((r) => ({ value: r.id, label: r.driver }))}
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
          Sent. Alejandro has the load and {route.driver} has his stops.
        </Notice>
      )}

      {editable ? <p className="-mb-2 text-xs text-muted">Press and hold a customer to move them in the route order.</p> : null}
      <SortableStops orders={orders} routeNo={route.number} editable={editable} />

      {editable ? (
        <Card className="flex flex-col gap-3">
          <Label>Off-day stop</Label>
          <p className="text-sm text-muted">A customer from another day called in. Add them to {route.driver}’s truck for this date. Their usual day stays the same.</p>
          <Choose label="Customer" value={addPick} onChange={setAddPick} placeholder="Find a customer" options={offDayOptions} />
          <button
            className={btn.secondary}
            disabled={!addPick}
            onClick={() => {
              if (!addPick) return;
              actions.addOffDay(route.id, addPick);
              toast("Off-day stop added", { description: `${customerOf(s, addPick).name} is on ${route.driver}’s truck for ${day(sheetDate)}.` });
              setAddPick(null);
            }}
          >
            Add to {day(sheetDate)}
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
        <button className={btn.primary} onClick={() => setConfirmOpen(true)}>
          Send Out Invoices
        </button>
      ) : null}
    </Page>
  );
}

function SortableStops({ orders, routeNo, editable }: { orders: Order[]; routeNo: number; editable: boolean }) {
  const s = useDemo();
  const regular = orders.filter((o) => !o.extra);
  const extras = orders.filter((o) => o.extra);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const ids = regular.map((o) => o.customerId);
    const next = arrayMove(ids, ids.indexOf(String(e.active.id)), ids.indexOf(String(e.over.id)));
    actions.reorderStops(routeNo, next);
    const moved = customerOf(s, String(e.active.id));
    toast(`${moved.name} is now stop ${next.indexOf(moved.id) + 1}`, { description: "The driver’s route follows this order." });
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={regular.map((o) => o.customerId)} strategy={verticalListSortingStrategy} disabled={!editable}>
          <div className="flex flex-col gap-4">
            {regular.map((o) => (
              <SortableRow key={o.customerId} order={o} editable={editable} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {extras.map((o) => (
        <CustomerRow key={o.customerId} order={o} editable={editable} />
      ))}
    </>
  );
}

function SortableRow({ order, editable }: { order: Order; editable: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: order.customerId, disabled: !editable });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cx("touch-manipulation", isDragging && "relative z-10 scale-[1.02] opacity-95 shadow-xl")}
      {...attributes}
      {...listeners}
    >
      <CustomerRow order={order} editable={editable} />
    </div>
  );
}

function CustomerRow({ order, editable }: { order: Order; editable: boolean }) {
  const s = useDemo();
  const c = customerOf(s, order.customerId);
  const [adding, setAdding] = useState<string | null>(null);
  const isCallNeeded = !c.standing || order.extra;
  const last = lastOrder(s, c.id);
  const empty = !order.lines.some((l) => l.boxes > 0);
  const owes = customerBalance(s, c.id).balance > 0;
  const outcome = order.outcome && empty ? OUTCOME[order.outcome] : null;

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
        <div className="flex shrink-0 items-start gap-1">
          <div className="flex flex-wrap justify-end gap-1">
            {order.extra ? <Tag tone="yolk">Off-day</Tag> : null}
            {c.standing && !order.extra ? <Tag>Standing</Tag> : null}
            {owes ? <Tag tone="warn">Still Owes Balance</Tag> : null}
            {outcome ? <Tag>{outcome}</Tag> : isCallNeeded && order.called ? <Tag tone="good">Called</Tag> : null}
          </div>
          {editable ? (
            <Menu>
              <MenuTrigger
                aria-label={`More for ${c.name}`}
                onPointerDown={(e) => e.stopPropagation()}
                className="-mr-2 -mt-1 grid h-9 w-9 place-items-center rounded-full text-xl leading-none text-muted active:bg-line/60"
              >
                ⋯
              </MenuTrigger>
              <MenuContent className="min-w-56 rounded-2xl border border-line bg-card p-1.5 shadow-lg">
                <MenuItem
                  disabled={!order.lines[0] && !order.swap}
                  onClick={() => actions.setSwap(order.routeId, c.id, order.swap ? null : order.lines[0].productId)}
                  className="flex min-h-11 items-center rounded-xl px-3 text-[15px] data-highlighted:bg-line/60 data-disabled:opacity-40"
                >
                  {order.swap ? "Remove expired swap" : "Expired swap"}
                </MenuItem>
                <MenuItem
                  onClick={() => actions.markNoOrder(order.routeId, c.id, "no-order")}
                  className="flex min-h-11 items-center rounded-xl px-3 text-[15px] data-highlighted:bg-line/60"
                >
                  No order
                </MenuItem>
                <MenuItem
                  onClick={() => actions.markNoOrder(order.routeId, c.id, "no-delivery")}
                  className="flex min-h-11 items-center rounded-xl px-3 text-[15px] data-highlighted:bg-line/60"
                >
                  Talked to them, no delivery
                </MenuItem>
              </MenuContent>
            </Menu>
          ) : null}
        </div>
      </div>

      <p className="mt-2 text-xs text-muted">
        Last Order: {last.lines.map((l) => `${productName(s, l.productId)} ${l.boxes}`).join(", ") || "None yet"}
        {last.date ? ` · ${day(last.date)}` : ""}
      </p>

      <div className="mt-2 flex flex-col">
        {order.lines.map((l) => (
          <div key={l.productId} className="flex items-center justify-between gap-2 border-b border-line/60 py-2 last:border-0">
            <span className="text-[15px] font-medium">{productName(s, l.productId)}</span>
            {editable ? (
              <div className="flex flex-col items-center" onPointerDown={(e) => e.stopPropagation()}>
                <BoxStepper
                  value={l.boxes}
                  onChange={(n) => (n ? actions.setOrderBoxes(order.routeId, c.id, l.productId, n) : actions.removeOrderLine(order.routeId, c.id, l.productId))}
                  label={`${productName(s, l.productId)} boxes for ${c.name}`}
                  size="sm"
                />
                <span className="mt-0.5 text-[11px] text-muted">boxes</span>
              </div>
            ) : (
              <span className="text-lg font-bold tabular-nums">
                {l.boxes} <span className="text-xs font-normal text-muted">boxes</span>
              </span>
            )}
          </div>
        ))}
        {order.swap ? (
          <div className="flex items-center justify-between border-b border-line/60 py-2 last:border-0">
            <span className="text-[15px] font-medium text-bad">Swap 1 expired {productName(s, order.swap.productId)}</span>
          </div>
        ) : null}
      </div>

      {editable ? (
        <div className="mt-3 flex flex-col gap-2" onPointerDown={(e) => e.stopPropagation()}>
          {empty ? (
            <button className={btn.secondary} onClick={() => actions.copyLastWeek(order.routeId, c.id)}>
              Same as last order
            </button>
          ) : null}
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
        </div>
      ) : null}
    </Card>
  );
}
