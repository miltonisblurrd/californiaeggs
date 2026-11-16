"use client";

import { Big, Card, Label, Page, Row, btn } from "@/components/ui";
import { balances, coolerRows, coolerTotals } from "@/lib/derive";
import { money } from "@/lib/format";
import { useDemo } from "@/lib/store";

export default function MonthEnd() {
  const s = useDemo();
  const month = s.today.slice(0, 7);
  const label = new Date(`${month}-15T12:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const avg = Object.fromEntries(coolerRows(s).map((r) => [r.product.id, r.avgCost || s.products.find((p) => p.id === r.product.id)!.price * 0.8]));
  const moves = s.moves.filter((m) => m.at.startsWith(month));
  const sum = (kind: string) => {
    const list = moves.filter((m) => m.kind === kind);
    return {
      boxes: list.reduce((n, m) => n + m.boxes, 0),
      dollars: list.reduce((n, m) => n + m.boxes * (m.cost ?? avg[m.productId] ?? 0), 0),
    };
  };
  const received = sum("receive");
  const loaded = sum("load");
  const returned = sum("return");
  const pulled = sum("pull");
  const counted = sum("count");
  const expired = moves.filter((m) => m.kind === "expired").length;

  const invs = s.invoices.filter((i) => i.date.startsWith(month) && i.status === "delivered");
  const by = (m: string) => invs.filter((i) => i.result!.method === m).reduce((n, i) => n + i.result!.amount, 0);
  const sales = invs.reduce((n, i) => n + i.result!.amount, 0);
  const collected = s.payments.filter((p) => p.at.startsWith(month)).reduce((n, p) => n + p.amount, 0);
  const owed = balances(s).reduce((n, b) => n + b.balance, 0);
  const costSold = -(loaded.dollars + returned.dollars);
  const totals = coolerTotals(s);

  return (
    <Page
      title="Month end"
      sub={`${label} so far · for David`}
      action={
        <button className={`${btn.secondary} min-h-10 px-4 print:hidden`} onClick={() => window.print()}>
          Print
        </button>
      }
    >
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <Big value={money(totals.dollars)} label="Cooler at cost, now" />
          <Big value={totals.eggBoxes.toLocaleString()} label={`Boxes · ${totals.cheese} cheese`} />
        </div>
        <p className="mt-2 text-xs text-muted">Each box at what Colin paid for it, oldest first. This is the inventory number for the P&amp;L.</p>
      </Card>

      <Card>
        <Label>Sales</Label>
        <div className="mt-1">
          <Row left="Invoiced and delivered" sub={`${invs.length} invoices`} right={money(sales)} strong />
          <Row left="Cash" right={money(by("cash"))} />
          <Row left="Checks" right={money(by("check"))} />
          <Row left="Charge" sub="Added to balances" right={money(by("charge"))} />
          <Row left="Collected on old balances" sub="R.O.A. and payments to Colin" right={money(collected)} />
          <Row left="Owed to you now" right={money(owed)} />
        </div>
      </Card>

      <Card>
        <Label>Cooler movement</Label>
        <div className="mt-1">
          <Row left="Received" sub={`${received.boxes} boxes`} right={money(received.dollars)} />
          <Row left="Loaded on trucks" sub={`${-loaded.boxes} boxes`} right={money(-loaded.dollars)} />
          <Row left="Came back to the cooler" sub={`${returned.boxes} boxes`} right={money(returned.dollars)} />
          <Row left="Pulled without an invoice" sub={`${-pulled.boxes} boxes`} right={money(-pulled.dollars)} />
          <Row left="Count corrections" sub={`${counted.boxes > 0 ? "+" : ""}${counted.boxes} boxes`} right={money(counted.dollars)} />
          <Row left="Expired boxes logged" right={expired} />
        </div>
      </Card>

      <Card>
        <Label>Rough margin</Label>
        <div className="mt-1">
          <Row left="Sales" right={money(sales)} />
          <Row left="Cost of boxes sold" sub="Loaded minus returned, at cost" right={money(costSold)} />
          <Row left="Gross margin" right={`${money(sales - costSold)}${sales ? ` · ${(((sales - costSold) / sales) * 100).toFixed(0)}%` : ""}`} strong />
        </div>
        <p className="mt-2 text-xs text-muted">Sample month. Real numbers start the day the app goes live.</p>
      </Card>
    </Page>
  );
}
