"use client";

import { useMemo, useState } from "react";
import { Switch, SwitchThumb } from "@ui-sdk/react/switch";
import { toast } from "@ui-sdk/react/toast";
import { BoxStepper, Choose, Label, MoneyField, Page, Segments, Sheet, Tag, TextField, btn, cx } from "./ui";
import { coolerRows, customerBalance, productName } from "@/lib/derive";
import { money } from "@/lib/format";
import { actions, useDemo } from "@/lib/store";
import type { Customer } from "@/lib/types";

const ROUTE_DAYS = ["", "Mon", "Mon", "Mon", "Tue", "Tue", "Tue", "Tue", "Wed", "Wed", "Wed", "Wed", "Thu", "Thu", "Thu", "Thu", "Fri", "Fri", "Fri", "Fri"];

export function CustomersScreen() {
  const s = useDemo();
  const [query, setQuery] = useState("");
  const [route, setRoute] = useState<string | null>("all");
  const [editing, setEditing] = useState<Customer | null>(null);

  const list = s.customers
    .filter((c) => route === "all" || String(c.routeNo) === route)
    .filter((c) => !query.trim() || `${c.name} ${c.city}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => a.routeNo - b.routeNo || a.stop - b.stop);

  function addNew() {
    const routeNo = route && route !== "all" ? Number(route) : 4;
    const stop = Math.max(0, ...s.customers.filter((c) => c.routeNo === routeNo).map((c) => c.stop)) + 1;
    setEditing({
      id: `c-new-${Date.now().toString(36)}`,
      name: "",
      city: "",
      routeNo,
      stop,
      standing: false,
      usual: "cash",
      terms: "COD",
      usualOrder: [],
      openingBalance: 0,
      prices: {},
    });
  }

  return (
    <Page
      title="Customers"
      sub={`${s.customers.length} customers on 19 routes`}
      action={
        <button className={cx(btn.secondary, "min-h-10 px-4")} onClick={addNew}>
          Add
        </button>
      }
    >
      <TextField label="Search" value={query} onChange={setQuery} placeholder="Name or city" />
      <Choose
        label="Route"
        value={route}
        onChange={setRoute}
        options={[{ value: "all", label: "All routes" }, ...Array.from({ length: 19 }, (_, i) => ({ value: String(i + 1), label: `Route ${i + 1} · ${ROUTE_DAYS[i + 1]}` }))]}
      />
      <div className="flex flex-col gap-2">
        {list.map((c) => {
          const bal = customerBalance(s, c.id).balance;
          const custom = Object.keys(c.prices ?? {}).length;
          return (
            <button key={c.id} onClick={() => setEditing(structuredClone(c))} className="flex items-center gap-3 rounded-3xl border border-line bg-card p-4 text-left active:scale-[0.99] transition">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper text-xs font-bold">
                {c.routeNo}·{c.stop}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[16px] font-semibold">{c.name}</p>
                <p className="truncate text-xs text-muted">
                  {c.city} · {c.usualOrder.map((l) => `${productName(s, l.productId)} ${l.boxes}`).join(", ") || "No usual order"}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {c.standing ? <Tag>Standing</Tag> : null}
                {custom ? <Tag tone="yolk">{`${custom} custom ${custom === 1 ? "price" : "prices"}`}</Tag> : null}
                {bal > 0 ? <span className="text-xs font-semibold text-warn">Owes {money(bal)}</span> : null}
              </div>
            </button>
          );
        })}
        {!list.length ? <p className="py-6 text-center text-sm text-muted">No customers match.</p> : null}
      </div>
      {editing ? <CustomerSheet initial={editing} onClose={() => setEditing(null)} /> : null}
    </Page>
  );
}

function CustomerSheet({ initial, onClose }: { initial: Customer; onClose: () => void }) {
  const s = useDemo();
  const [c, setC] = useState<Customer>(initial);
  const [adding, setAdding] = useState<string | null>(null);
  const [pricing, setPricing] = useState<string | null>(null);
  const isNew = !s.customers.some((x) => x.id === c.id);
  const costs = useMemo(() => Object.fromEntries(coolerRows(s).map((r) => [r.product.id, r.avgCost])), [s]);
  const set = (patch: Partial<Customer>) => setC((x) => ({ ...x, ...patch }));
  const priceOf = (id: string) => c.prices?.[id] ?? s.products.find((p) => p.id === id)!.price;
  const priced = Array.from(new Set([...c.usualOrder.map((l) => l.productId), ...Object.keys(c.prices ?? {})]));
  const ready = c.name.trim() && c.city.trim();

  function save() {
    actions.saveCustomer({ ...c, name: c.name.trim(), city: c.city.trim(), terms: c.usual === "charge" ? "Net 30" : "COD" });
    toast(isNew ? `${c.name} added to route ${c.routeNo}` : `${c.name} saved`, {
      description: isNew ? "They’re on Alma’s call sheet the next time that route is called." : undefined,
    });
    onClose();
  }

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title={isNew ? "New customer" : c.name}>
      <div className="flex flex-col gap-4">
        <TextField label="Name" value={c.name} onChange={(v) => set({ name: v })} placeholder="Business name" />
        <TextField label="City" value={c.city} onChange={(v) => set({ city: v })} />
        <TextField label="Phone (for calls and texts)" value={c.phone ?? ""} onChange={(v) => set({ phone: v })} inputMode="numeric" />
        <div className="grid grid-cols-2 gap-3">
          <Choose
            label="Route"
            value={String(c.routeNo)}
            onChange={(v) => v && set({ routeNo: Number(v) })}
            options={Array.from({ length: 19 }, (_, i) => ({ value: String(i + 1), label: `${i + 1} · ${ROUTE_DAYS[i + 1]}` }))}
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Stop</span>
            <BoxStepper value={c.stop} onChange={(n) => set({ stop: n ?? 1 })} min={1} label="Stop number" size="sm" />
          </div>
        </div>

        <section className="flex flex-col gap-2">
          <Label>Usually pays</Label>
          <Segments
            label="Usually pays"
            value={c.usual}
            onChange={(v) => set({ usual: v })}
            options={[
              { value: "cash", label: "Cash" },
              { value: "check", label: "Check" },
              { value: "charge", label: "Charge" },
            ]}
          />
          <p className="text-xs text-muted">{c.usual === "charge" ? "Net 30. Invoices go on their balance." : "COD. Paid at the door."}</p>
        </section>

        <label className="flex items-center justify-between gap-3 rounded-2xl bg-paper px-4 py-3">
          <span>
            <span className="block text-[15px] font-semibold">Standing order</span>
            <span className="block text-xs text-muted">Alma doesn’t call. The usual order prints every week.</span>
          </span>
          <Switch
            checked={c.standing}
            onCheckedChange={(v) => set({ standing: !!v })}
            className="relative h-7 w-12 shrink-0 rounded-full bg-line transition-colors data-checked:bg-good"
          >
            <SwitchThumb className="block h-6 w-6 translate-x-0.5 rounded-full bg-white shadow transition-transform data-checked:translate-x-[22px]" />
          </Switch>
        </label>

        <section className="flex flex-col gap-1">
          <Label>Usual order</Label>
          {c.usualOrder.map((l) => (
            <div key={l.productId} className="flex items-center justify-between gap-2 border-b border-line/60 py-2">
              <span className="text-[15px] font-medium">{productName(s, l.productId)}</span>
              <BoxStepper
                value={l.boxes}
                onChange={(n) =>
                  set({ usualOrder: n ? c.usualOrder.map((x) => (x.productId === l.productId ? { ...x, boxes: n } : x)) : c.usualOrder.filter((x) => x.productId !== l.productId) })
                }
                label={`${productName(s, l.productId)} usual boxes`}
                size="sm"
              />
            </div>
          ))}
          <Choose
            label="Add a product"
            value={adding}
            onChange={(v) => {
              if (!v) return;
              set({ usualOrder: [...c.usualOrder, { productId: v, boxes: 1 }] });
              setAdding(null);
            }}
            placeholder="Choose"
            options={s.products.filter((p) => !c.usualOrder.some((l) => l.productId === p.id)).map((p) => ({ value: p.id, label: p.name }))}
          />
        </section>

        <section className="flex flex-col gap-1">
          <Label>Prices</Label>
          <p className="text-xs text-muted">List price unless you set one. Cost is what’s in the cooler now, oldest box first.</p>
          {priced.map((id) => {
            const price = priceOf(id);
            const cost = costs[id] ?? 0;
            const margin = price && cost ? ((price - cost) / price) * 100 : 0;
            const custom = c.prices?.[id] !== undefined;
            return (
              <div key={id} className="grid grid-cols-[1fr_8rem] items-center gap-2 border-b border-line/60 py-2">
                <div className="min-w-0">
                  <p className="text-[15px] font-medium">{productName(s, id)}</p>
                  <p className={cx("text-xs", margin < 15 ? "text-bad" : "text-muted")}>
                    {cost ? `Cost ${money(cost)} · ${margin.toFixed(0)}% margin` : "Not in the cooler"}
                    {custom ? " · custom" : " · list"}
                  </p>
                </div>
                <MoneyField
                  label={`${productName(s, id)} price`}
                  value={price}
                  onChange={(n) => {
                    const prices = { ...(c.prices ?? {}) };
                    const list = s.products.find((p) => p.id === id)!.price;
                    if (n === null || n === list) delete prices[id];
                    else prices[id] = n;
                    set({ prices });
                  }}
                />
              </div>
            );
          })}
          <Choose
            label="Set a price for another product"
            value={pricing}
            onChange={(v) => {
              if (!v) return;
              set({ prices: { ...(c.prices ?? {}), [v]: s.products.find((p) => p.id === v)!.price } });
              setPricing(null);
            }}
            placeholder="Choose"
            options={s.products.filter((p) => !priced.includes(p.id)).map((p) => ({ value: p.id, label: p.name }))}
          />
        </section>

        <button className={btn.primary} disabled={!ready} onClick={save}>
          {isNew ? "Add customer" : "Save"}
        </button>
      </div>
    </Sheet>
  );
}
