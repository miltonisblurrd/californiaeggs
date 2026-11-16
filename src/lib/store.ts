"use client";

import { useSyncExternalStore } from "react";
import { buildSeed, PEOPLE, SCHEDULE, STATE_VERSION } from "./data";
import { invoiceTotal, lotsFor, nextServiceDay, onHand, routeInvoices, routeOrders, routeReturns, routeTally, weekday } from "./derive";
import type { Customer, DemoState, Line, PayMethod, ProductId } from "./types";

const KEY = "cal-egg-x-prototype";
const SEED = buildSeed();

let state: DemoState = SEED;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoState;
      if (parsed.version === STATE_VERSION) state = parsed;
    }
  } catch {
    state = SEED;
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function update(change: (draft: DemoState) => void) {
  load();
  const draft = structuredClone(state);
  change(draft);
  state = draft;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  load();
  return state;
}

export function useDemo() {
  return useSyncExternalStore(subscribe, getSnapshot, () => SEED);
}

export function useLoaded() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

export function nowAt(s: DemoState) {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${s.today}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

let moveSeq = 0;
function moveId() {
  moveSeq += 1;
  return `m-${Date.now().toString(36)}-${moveSeq}`;
}

function takeOldest(s: DemoState, productId: ProductId, boxes: number) {
  const taken: { vendorId: string; boxes: number; cost: number }[] = [];
  let left = boxes;
  for (const lot of lotsFor(s, productId)) {
    if (left <= 0) break;
    const real = s.lots.find((l) => l.id === lot.id)!;
    const n = Math.min(real.boxes, left);
    real.boxes -= n;
    left -= n;
    taken.push({ vendorId: real.vendorId, boxes: n, cost: real.cost });
  }
  s.lots = s.lots.filter((l) => l.boxes > 0);
  return { taken, short: left };
}

function putBack(s: DemoState, productId: ProductId, boxes: number) {
  const lots = lotsFor(s, productId);
  const target = lots[lots.length - 1];
  if (target) {
    s.lots.find((l) => l.id === target.id)!.boxes += boxes;
    return target.vendorId;
  }
  const price = s.products.find((p) => p.id === productId)!.price;
  const vendorId = s.vendors[0].id;
  s.lots.push({
    id: `lot-${productId}-${Date.now().toString(36)}`,
    productId,
    vendorId,
    boxes,
    cost: Math.round(price * 0.8 * 20) / 20,
    receivedAt: nowAt(s),
  });
  return vendorId;
}

function printRoute(s: DemoState, routeId: string) {
  const route = s.routes.find((r) => r.id === routeId)!;
  for (const order of routeOrders(s, routeId)) {
    const lines = order.lines.filter((l) => l.boxes > 0);
    if (!lines.length) continue;
    const prices: Record<string, number> = {};
    const c = s.customers.find((x) => x.id === order.customerId)!;
    lines.forEach((l) => (prices[l.productId] = c.prices?.[l.productId] ?? s.products.find((p) => p.id === l.productId)!.price));
    s.invoices.push({
      number: s.nextInvoice++,
      routeId,
      customerId: order.customerId,
      date: route.date,
      lines: lines.map((l) => ({ ...l })),
      prices,
      swap: order.swap,
      status: "open",
      enteredCount: 0,
    });
  }
  route.status = "ready";
}

export function lastOrder(s: DemoState, customerId: string) {
  const last = s.invoices.filter((i) => i.customerId === customerId && i.status !== "void").sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!last) return { lines: s.customers.find((c) => c.id === customerId)!.usualOrder, date: undefined };
  return { lines: last.result?.delivered.filter((l) => l.boxes > 0) ?? last.lines, date: last.date };
}

function findOrder(s: DemoState, customerId: string, routeId: string) {
  return s.orders.find((o) => o.customerId === customerId && o.routeId === routeId)!;
}

export const actions = {
  reset() {
    update((s) => Object.assign(s, structuredClone(SEED)));
  },

  pickDriverRoute(routeId: string) {
    update((s) => {
      s.driverRoute = routeId;
    });
  },

  pickAlmaRoute(routeId: string) {
    update((s) => {
      s.almaRoute = routeId;
    });
  },

  setOrderBoxes(routeId: string, customerId: string, productId: ProductId, boxes: number) {
    update((s) => {
      const order = findOrder(s, customerId, routeId);
      const line = order.lines.find((l) => l.productId === productId);
      if (line) line.boxes = boxes;
      else order.lines.push({ productId, boxes });
      order.called = true;
    });
  },

  removeOrderLine(routeId: string, customerId: string, productId: ProductId) {
    update((s) => {
      const order = findOrder(s, customerId, routeId);
      order.lines = order.lines.filter((l) => l.productId !== productId);
    });
  },

  markCalled(routeId: string, customerId: string, called: boolean) {
    update((s) => {
      findOrder(s, customerId, routeId).called = called;
    });
  },

  copyLastWeek(routeId: string, customerId: string) {
    update((s) => {
      const order = findOrder(s, customerId, routeId);
      order.lines = lastOrder(s, customerId).lines.map((l) => ({ ...l }));
      order.called = true;
    });
  },

  setSwap(routeId: string, customerId: string, productId: ProductId | null) {
    update((s) => {
      const order = findOrder(s, customerId, routeId);
      order.swap = productId ? { productId, boxes: 1 } : undefined;
    });
  },

  addOffDay(routeId: string, customerId: string) {
    update((s) => {
      if (s.orders.some((o) => o.routeId === routeId && o.customerId === customerId)) return;
      s.orders.push({ customerId, routeId, lines: [], called: true, extra: true });
    });
  },

  markNoOrder(routeId: string, customerId: string) {
    update((s) => {
      const order = findOrder(s, customerId, routeId);
      order.lines = [];
      order.called = true;
    });
  },

  markRouteReady(routeId: string) {
    update((s) => printRoute(s, routeId));
  },

  confirmLoad(routeId: string) {
    update((s) => {
      const route = s.routes.find((r) => r.id === routeId)!;
      const at = nowAt(s);
      for (const t of routeTally(s, routeId)) {
        const { taken, short } = takeOldest(s, t.productId, t.boxes);
        taken.forEach((x) =>
          s.moves.push({
            id: moveId(),
            at,
            kind: "load",
            productId: t.productId,
            vendorId: x.vendorId,
            boxes: -x.boxes,
            cost: x.cost,
            who: PEOPLE.alejandro,
            routeId,
            note: `Route ${route.number}, ${route.driver}`,
          })
        );
        if (short > 0) {
          s.moves.push({
            id: moveId(),
            at,
            kind: "load",
            productId: t.productId,
            boxes: 0,
            who: PEOPLE.alejandro,
            routeId,
            note: `Route ${route.number} needed ${short} more than the cooler showed`,
          });
        }
      }
      route.status = "loaded";
      route.loadedAt = at;
    });
  },

  startRoute(routeId: string) {
    update((s) => {
      s.routes.find((r) => r.id === routeId)!.status = "out";
    });
  },

  saveStop(
    number: number,
    result: { delivered: Line[]; method: PayMethod; checkNo?: string; signature?: string; signedBy?: string }
  ) {
    update((s) => {
      const inv = s.invoices.find((i) => i.number === number)!;
      inv.status = "delivered";
      inv.result = {
        ...result,
        amount: invoiceTotal(inv, result.delivered),
        at: nowAt(s),
      };
    });
  },

  voidStop(number: number) {
    update((s) => {
      const inv = s.invoices.find((i) => i.number === number)!;
      inv.status = "void";
      inv.result = undefined;
    });
  },

  reopenStop(number: number) {
    update((s) => {
      const inv = s.invoices.find((i) => i.number === number)!;
      inv.status = "open";
      inv.result = undefined;
    });
  },

  submitBag(routeId: string, roa: { customerId: string; amount: number; checkNo?: string }[], signature?: string) {
    update((s) => {
      const route = s.routes.find((r) => r.id === routeId)!;
      const at = nowAt(s);
      roa.forEach((p, i) =>
        s.payments.push({ id: `p-${Date.now().toString(36)}-${i}`, customerId: p.customerId, amount: p.amount, method: p.checkNo ? "check" : "cash", checkNo: p.checkNo, at, by: route.driver, routeId })
      );
      route.roa = { count: roa.length, amount: roa.reduce((n, p) => n + p.amount, 0) };
      route.driverSigned = route.driver;
      route.driverSignature = signature;
      route.status = "back";
      route.backAt = nowAt(s);
    });
  },

  checkIn(routeId: string, signature?: string) {
    update((s) => {
      const route = s.routes.find((r) => r.id === routeId)!;
      const at = nowAt(s);
      for (const r of routeReturns(s, routeId)) {
        if (r.why === "expired") {
          s.moves.push({
            id: moveId(),
            at,
            kind: "expired",
            productId: r.productId,
            boxes: 0,
            who: PEOPLE.alejandro,
            routeId,
            note: `${r.boxes} expired box back from route ${route.number}. Not added to the cooler.`,
          });
          continue;
        }
        const vendorId = putBack(s, r.productId, r.boxes);
        s.moves.push({
          id: moveId(),
          at,
          kind: "return",
          productId: r.productId,
          vendorId,
          boxes: r.boxes,
          who: PEOPLE.alejandro,
          routeId,
          note: `Back from route ${route.number} (${r.why === "void" ? "voided stop" : "short at the door"})`,
        });
      }
      if (route.status === "back") route.status = "checkedIn";
      route.managerSigned = PEOPLE.alejandro;
      route.managerSignature = signature;
    });
  },

  auditRoute(routeId: string, audit: { cash: number; checks: number; checkAmount: number; note: string }) {
    update((s) => {
      s.audits = s.audits.filter((a) => a.routeId !== routeId);
      s.audits.push({ routeId, ...audit, at: nowAt(s) });
      s.routes.find((r) => r.id === routeId)!.status = "audited";
    });
  },

  saveCustomer(input: Customer) {
    update((s) => {
      const i = s.customers.findIndex((c) => c.id === input.id);
      const before = i >= 0 ? s.customers[i] : undefined;
      if (i >= 0) s.customers[i] = structuredClone(input);
      else s.customers.push(structuredClone(input));
      for (const r of s.routes.filter((x) => x.status === "calling")) {
        const has = s.orders.find((o) => o.routeId === r.id && o.customerId === input.id);
        if (r.number === input.routeNo && !has) {
          s.orders.push({ customerId: input.id, routeId: r.id, lines: input.standing ? input.usualOrder.map((l) => ({ ...l })) : [], called: false });
        }
        if (has && !has.extra && r.number !== input.routeNo && before?.routeNo === r.number) {
          s.orders = s.orders.filter((o) => o !== has);
        }
      }
    });
  },

  recordPayment(input: { customerId: string; amount: number; method: "cash" | "check"; checkNo?: string }) {
    update((s) => {
      s.payments.push({ id: `p-${Date.now().toString(36)}`, ...input, at: nowAt(s), by: PEOPLE.colin });
    });
  },

  closeDay() {
    update((s) => {
      const tomorrow = nextServiceDay(s.today);
      for (const r of s.routes.filter((x) => x.date === tomorrow && x.status === "calling")) {
        printRoute(s, r.id);
      }
      s.today = tomorrow;
      const next = nextServiceDay(tomorrow);
      const plan = SCHEDULE[weekday(next)] ?? [];
      for (const p of plan) {
        const id = `r${p.number}-${next}`;
        if (s.routes.some((r) => r.id === id)) continue;
        s.routes.push({ id, number: p.number, date: next, driver: p.driver, status: "calling", roa: { count: 0, amount: 0 } });
        s.customers
          .filter((c) => c.routeNo === p.number)
          .forEach((c) =>
            s.orders.push({ customerId: c.id, routeId: id, lines: c.standing ? c.usualOrder.map((l) => ({ ...l })) : [], called: false })
          );
      }
      const todays = s.routes.filter((r) => r.date === tomorrow).sort((a, b) => a.number - b.number);
      if (todays[0]) s.driverRoute = todays[0].id;
      const nexts = s.routes.filter((r) => r.date === next).sort((a, b) => a.number - b.number);
      if (nexts[0]) s.almaRoute = nexts[0].id;
    });
  },

  setEntered(number: number, entered: boolean) {
    update((s) => {
      const inv = s.invoices.find((i) => i.number === number)!;
      inv.enteredCount = entered ? Math.max(1, inv.enteredCount) : 0;
      const route = s.routes.find((r) => r.id === inv.routeId)!;
      const all = routeInvoices(s, route.id)
        .filter((i) => i.status === "delivered")
        .every((i) => i.enteredCount > 0);
      if (all) route.status = "entered";
      else if (route.status === "entered") route.status = "audited";
    });
  },

  fixDuplicate(number: number) {
    update((s) => {
      const inv = s.invoices.find((i) => i.number === number)!;
      inv.enteredCount = 1;
    });
  },

  receive(input: { productId: ProductId; vendorId: string; boxes: number; cost: number }) {
    update((s) => {
      const at = nowAt(s);
      s.lots.push({
        id: `lot-${input.productId}-${Date.now().toString(36)}`,
        productId: input.productId,
        vendorId: input.vendorId,
        boxes: input.boxes,
        cost: input.cost,
        receivedAt: at,
      });
      s.moves.push({
        id: moveId(),
        at,
        kind: "receive",
        productId: input.productId,
        vendorId: input.vendorId,
        boxes: input.boxes,
        cost: input.cost,
        who: PEOPLE.alejandro,
        note: `$${input.cost.toFixed(2)} a box`,
      });
    });
  },

  pull(input: { productId: ProductId; boxes: number; reason: string; who: string }) {
    update((s) => {
      const at = nowAt(s);
      const { taken } = takeOldest(s, input.productId, input.boxes);
      taken.forEach((x) =>
        s.moves.push({
          id: moveId(),
          at,
          kind: "pull",
          productId: input.productId,
          vendorId: x.vendorId,
          boxes: -x.boxes,
            cost: x.cost,
          who: input.who,
          note: `${input.reason}. No invoice.`,
        })
      );
    });
  },

  correctCount(typed: Record<ProductId, number>, by: string, reason: string) {
    update((s) => {
      const at = nowAt(s);
      for (const p of s.products) {
        if (typed[p.id] === undefined) continue;
        const diff = typed[p.id] - onHand(s, p.id);
        if (diff === 0) continue;
        const vendorId = diff < 0 ? takeOldest(s, p.id, -diff).taken[0]?.vendorId : putBack(s, p.id, diff);
        s.moves.push({
          id: moveId(),
          at,
          kind: "count",
          productId: p.id,
          vendorId,
          boxes: diff,
          who: by,
          note: `Morning count. ${reason}.`,
        });
      }
    });
  },

  submitCount(typed: Record<ProductId, number>, by: string) {
    update((s) => {
      const expected: Record<string, number> = {};
      s.products.forEach((p) => (expected[p.id] = onHand(s, p.id)));
      s.counts = s.counts.filter((c) => c.status === "approved");
      s.counts.push({ id: `count-${Date.now().toString(36)}`, at: nowAt(s), by, typed, expected, status: "submitted" });
    });
  },

  approveCount(id: string) {
    update((s) => {
      const count = s.counts.find((c) => c.id === id)!;
      const at = nowAt(s);
      for (const p of s.products) {
        const diff = (count.typed[p.id] ?? 0) - onHand(s, p.id);
        if (diff === 0) continue;
        let vendorId: string | undefined;
        if (diff < 0) vendorId = takeOldest(s, p.id, -diff).taken[0]?.vendorId;
        else vendorId = putBack(s, p.id, diff);
        s.moves.push({
          id: moveId(),
          at,
          kind: "count",
          productId: p.id,
          vendorId,
          boxes: diff,
          who: PEOPLE.colin,
          note: `Count approved. ${Math.abs(diff)} ${diff < 0 ? "short" : "over"}.`,
        });
      }
      count.status = "approved";
      count.approvedAt = at;
    });
  },
};
