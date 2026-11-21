import type { DemoState, Invoice, Line, PayMethod, ProductId, Route } from "./types";

export function invoiceTotal(inv: Invoice, lines: Line[] = inv.lines) {
  return lines.reduce((s, l) => s + l.boxes * (inv.prices[l.productId] ?? 0), 0);
}

export function boxesIn(lines: Line[], kind?: "egg" | "cheese", s?: DemoState) {
  return lines
    .filter((l) => !kind || !s || productKind(s, l.productId) === kind)
    .reduce((n, l) => n + l.boxes, 0);
}

export function productKind(s: DemoState, id: ProductId) {
  return s.products.find((p) => p.id === id)?.kind ?? "egg";
}

export function productName(s: DemoState, id: ProductId) {
  return s.products.find((p) => p.id === id)?.name ?? id;
}

export function vendorName(s: DemoState, id?: string) {
  return s.vendors.find((v) => v.id === id)?.name ?? "—";
}

export function customerOf(s: DemoState, id: string) {
  return s.customers.find((c) => c.id === id)!;
}

export function routeOf(s: DemoState, id: string) {
  return s.routes.find((r) => r.id === id)!;
}

export function onHand(s: DemoState, productId: ProductId) {
  return s.lots.filter((l) => l.productId === productId).reduce((n, l) => n + l.boxes, 0);
}

export function lotsFor(s: DemoState, productId: ProductId) {
  return s.lots
    .filter((l) => l.productId === productId && l.boxes > 0)
    .sort((a, b) => a.receivedAt.localeCompare(b.receivedAt));
}

export function coolerRows(s: DemoState) {
  return s.products.map((p) => {
    const lots = lotsFor(s, p.id);
    const boxes = lots.reduce((n, l) => n + l.boxes, 0);
    const dollars = lots.reduce((n, l) => n + l.boxes * l.cost, 0);
    return {
      product: p,
      lots,
      boxes,
      dollars,
      avgCost: boxes ? dollars / boxes : 0,
      vendors: new Set(lots.map((l) => l.vendorId)).size,
    };
  });
}

export function coolerTotals(s: DemoState) {
  const rows = coolerRows(s);
  return {
    eggBoxes: rows.filter((r) => r.product.kind === "egg").reduce((n, r) => n + r.boxes, 0),
    cheese: rows.filter((r) => r.product.kind === "cheese").reduce((n, r) => n + r.boxes, 0),
    dollars: rows.reduce((n, r) => n + r.dollars, 0),
  };
}

export function routeInvoices(s: DemoState, routeId: string) {
  const no = routeOf(s, routeId)?.number;
  const stop = (i: Invoice) => {
    const c = customerOf(s, i.customerId);
    return c.routeNo === no ? c.stop : 1000 + i.number;
  };
  return s.invoices.filter((i) => i.routeId === routeId).sort((a, b) => stop(a) - stop(b));
}

export function routeOrders(s: DemoState, routeId: string) {
  const stop = (o: DemoState["orders"][number]) => (o.extra ? 1000 : customerOf(s, o.customerId).stop);
  return s.orders.filter((o) => o.routeId === routeId).sort((a, b) => stop(a) - stop(b));
}

export function routeTally(s: DemoState, routeId: string) {
  const tally: Record<string, number> = {};
  const source = s.invoices.some((i) => i.routeId === routeId)
    ? routeInvoices(s, routeId).map((i) => (i.swap ? [...i.lines, i.swap] : i.lines))
    : s.orders.filter((o) => o.routeId === routeId).map((o) => (o.swap ? [...o.lines, o.swap] : o.lines));
  source.flat().forEach((l) => (tally[l.productId] = (tally[l.productId] ?? 0) + l.boxes));
  return s.products
    .filter((p) => tally[p.id])
    .map((p) => ({ productId: p.id, name: p.name, boxes: tally[p.id], kind: p.kind }));
}

export type ReturnLine = { productId: ProductId; boxes: number; why: "void" | "short" | "expired" };

export function routeReturns(s: DemoState, routeId: string): ReturnLine[] {
  const out: ReturnLine[] = [];
  for (const inv of routeInvoices(s, routeId)) {
    if (inv.status === "void") {
      inv.lines.forEach((l) => out.push({ productId: l.productId, boxes: l.boxes, why: "void" }));
    }
    if (inv.status === "delivered" && inv.result) {
      inv.lines.forEach((l) => {
        const d = inv.result!.delivered.find((x) => x.productId === l.productId)?.boxes ?? 0;
        if (d < l.boxes) out.push({ productId: l.productId, boxes: l.boxes - d, why: "short" });
      });
      if (inv.swap) out.push({ ...inv.swap, why: "expired" });
    }
  }
  return out;
}

export function routeSheet(s: DemoState, routeId: string) {
  const route = routeOf(s, routeId);
  const invs = routeInvoices(s, routeId);
  const done = invs.filter((i) => i.status !== "open");
  const delivered = invs.filter((i) => i.status === "delivered");
  const tally = routeTally(s, routeId);
  const returns = routeReturns(s, routeId);

  const eggsOut = tally.filter((t) => t.kind === "egg").reduce((n, t) => n + t.boxes, 0);
  const cheeseOut = tally.filter((t) => t.kind === "cheese").reduce((n, t) => n + t.boxes, 0);
  const eggsIn = returns.filter((r) => productKind(s, r.productId) === "egg").reduce((n, r) => n + r.boxes, 0);
  const cheeseIn = returns.filter((r) => productKind(s, r.productId) === "cheese").reduce((n, r) => n + r.boxes, 0);
  const expiredIn = returns.filter((r) => r.why === "expired").reduce((n, r) => n + r.boxes, 0);

  const by = (m: PayMethod) => delivered.filter((i) => i.result!.method === m);
  const sum = (list: Invoice[]) => list.reduce((n, i) => n + i.result!.amount, 0);

  return {
    route,
    invoicesOut: invs.length,
    invoicesIn: done.length,
    stopsDone: done.length,
    eggsOut,
    eggsIn,
    eggsSold: eggsOut - eggsIn,
    cheeseOut,
    cheeseIn,
    cheeseSold: cheeseOut - cheeseIn,
    expiredIn,
    checks: { count: by("check").length, amount: sum(by("check")) },
    cash: { count: by("cash").length, amount: sum(by("cash")) },
    charge: { count: by("charge").length, amount: sum(by("charge")) },
    voids: invs.filter((i) => i.status === "void").length,
    roa: route.roa,
    sales: sum(delivered),
  };
}

export function dayRoutes(s: DemoState, date: string) {
  return s.routes.filter((r) => r.date === date).sort((a, b) => a.number - b.number);
}

export function completeness(s: DemoState, date?: string) {
  const routes = s.routes.filter((r) => !date || r.date === date);
  const ids = new Set(routes.map((r) => r.id));
  const invs = s.invoices.filter((i) => ids.has(i.routeId));
  const backRoutes = new Set(
    routes.filter((r) => ["back", "checkedIn", "audited", "entered"].includes(r.status)).map((r) => r.id)
  );
  const auditedRoutes = new Set(
    routes.filter((r) => ["audited", "entered"].includes(r.status)).map((r) => r.id)
  );
  const cameBack = invs.filter((i) => backRoutes.has(i.routeId) && i.status !== "open");
  const missingBack = invs.filter((i) => backRoutes.has(i.routeId) && i.status === "open");
  const entered = invs.filter((i) => i.enteredCount > 0);
  const notEntered = invs.filter((i) => auditedRoutes.has(i.routeId) && i.status === "delivered" && i.enteredCount === 0);
  const duplicates = invs.filter((i) => i.enteredCount > 1);
  const stillOut = invs.filter((i) => !backRoutes.has(i.routeId));
  return { created: invs.length, cameBack, missingBack, entered, notEntered, duplicates, stillOut };
}

export function addDays(date: string, n: number) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function weekday(date: string) {
  return new Date(`${date}T12:00:00`).getDay();
}

export function nextServiceDay(date: string) {
  let d = addDays(date, 1);
  while (weekday(d) === 0 || weekday(d) === 6) d = addDays(d, 1);
  return d;
}

export type LedgerEntry = {
  at: string;
  kind: "opening" | "charge" | "payment";
  amount: number;
  label: string;
  invoice?: number;
  checkNo?: string;
};

export function customerLedger(s: DemoState, customerId: string): LedgerEntry[] {
  const c = customerOf(s, customerId);
  const out: LedgerEntry[] = [];
  if (c.openingBalance) {
    out.push({ at: `${c.openingSince ?? "2026-10-01"}T00:00:00`, kind: "opening", amount: c.openingBalance, label: "Owed before the app" });
  }
  s.invoices
    .filter((i) => i.customerId === customerId && i.status === "delivered" && i.result?.method === "charge")
    .forEach((i) => out.push({ at: i.result!.at, kind: "charge", amount: i.result!.amount, label: `Invoice ${i.number}`, invoice: i.number }));
  s.payments
    .filter((p) => p.customerId === customerId)
    .forEach((p) =>
      out.push({
        at: p.at,
        kind: "payment",
        amount: -p.amount,
        label: p.routeId ? `R.O.A. to ${p.by}` : `Paid to ${p.by}`,
        checkNo: p.checkNo,
      })
    );
  return out.sort((a, b) => a.at.localeCompare(b.at));
}

export function customerBalance(s: DemoState, customerId: string) {
  const ledger = customerLedger(s, customerId);
  const balance = Math.round(ledger.reduce((n, e) => n + e.amount, 0) * 100) / 100;
  let paid = -ledger.filter((e) => e.kind === "payment").reduce((n, e) => n + e.amount, 0);
  let oldest: string | undefined;
  for (const e of ledger.filter((x) => x.kind !== "payment")) {
    if (paid >= e.amount - 0.005) {
      paid -= e.amount;
      continue;
    }
    oldest = e.at.slice(0, 10);
    break;
  }
  const days = oldest ? Math.round((new Date(`${s.today}T12:00:00`).getTime() - new Date(`${oldest}T12:00:00`).getTime()) / 86400000) : 0;
  return { balance, oldest, days };
}

export function balances(s: DemoState) {
  return s.customers
    .map((c) => ({ customer: c, ...customerBalance(s, c.id) }))
    .filter((b) => b.balance > 0.005)
    .sort((a, b) => b.days - a.days || b.balance - a.balance);
}

export function statusLabel(status: Route["status"]) {
  return {
    calling: "Alma is calling",
    ready: "Invoices sent",
    loaded: "Loaded",
    out: "On the route",
    back: "Bag in lockbox",
    checkedIn: "Boxes checked in",
    audited: "Audited",
    entered: "In QuickBooks",
  }[status];
}

export function pullsWithoutInvoice(s: DemoState, since: string) {
  return s.moves.filter((m) => m.kind === "pull" && m.at >= since);
}
