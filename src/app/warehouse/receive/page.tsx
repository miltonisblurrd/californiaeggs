"use client";

import { useState } from "react";
import { toast } from "@ui-sdk/react/toast";
import { BoxStepper, Card, Choose, Label, MoneyField, Page, Row, btn } from "@/components/ui";
import { onHand, productName, vendorName } from "@/lib/derive";
import { boxes as boxesText, money, time } from "@/lib/format";
import { actions, useDemo } from "@/lib/store";

export default function Receive() {
  const s = useDemo();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [n, setN] = useState<number | null>(null);
  const [cost, setCost] = useState<number | null>(null);
  const today = s.moves.filter((m) => m.kind === "receive" && m.at.startsWith(s.today)).sort((a, b) => b.at.localeCompare(a.at));
  const ready = vendorId && productId && n && cost;

  function save() {
    if (!vendorId || !productId || !n || !cost) return;
    actions.receive({ productId, vendorId, boxes: n, cost });
    toast(`Received ${boxesText(n)}`, {
      description: `${productName(s, productId)} from ${vendorName(s, vendorId)}. Cooler now ${onHand(s, productId) + n}.`,
    });
    setN(null);
    setCost(null);
    setProductId(null);
  }

  return (
    <Page title="Receive" sub="A delivery comes in. Enter it once and the cooler goes up.">
      <Card className="flex flex-col gap-4">
        <Choose label="Vendor" value={vendorId} onChange={setVendorId} placeholder="Who is it from?" options={s.vendors.map((v) => ({ value: v.id, label: v.name }))} />
        <Choose
          label="Product"
          value={productId}
          onChange={setProductId}
          placeholder="Choose a product"
          options={s.products.map((p) => ({ value: p.id, label: p.name }))}
        />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Boxes</p>
            {productId ? <p className="text-xs text-muted">{onHand(s, productId)} in the cooler now</p> : null}
          </div>
          <BoxStepper value={n} onChange={setN} label="boxes received" min={1} size="lg" />
        </div>
        <MoneyField label="Cost per box" value={cost} onChange={setCost} hint="From the vendor’s bill. This is what makes the cooler’s dollar value real." />
        {ready ? (
          <p className="rounded-2xl bg-yolk/15 px-4 py-3 text-sm">
            {boxesText(n!)} at {money(cost!)} = <strong>{money(n! * cost!)}</strong> added to the cooler.
          </p>
        ) : null}
        <button className={btn.primary} disabled={!ready} onClick={save}>
          Add to cooler
        </button>
      </Card>

      {today.length ? (
        <Card>
          <Label>Received today</Label>
          <div className="mt-1">
            {today.map((m) => (
              <Row
                key={m.id}
                left={productName(s, m.productId)}
                sub={`${vendorName(s, m.vendorId)} · ${time(m.at)} · ${m.note ?? ""}`}
                right={<span className="font-semibold text-good">+{m.boxes}</span>}
              />
            ))}
          </div>
        </Card>
      ) : null}
    </Page>
  );
}
