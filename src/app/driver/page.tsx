"use client";

import Link from "next/link";
import { confirm } from "@ui-sdk/react/alert-dialog";
import { toast } from "@ui-sdk/react/toast";
import { Bar, Card, Notice, Page, Tag, btn, cx } from "@/components/ui";
import { customerOf, dayRoutes, invoiceTotal, productName, routeInvoices, routeTally, statusLabel } from "@/lib/derive";
import { money } from "@/lib/format";
import { actions, useDemo } from "@/lib/store";

const METHOD = { cash: "Cash", check: "Check", charge: "Charge" };

export default function MyRoute() {
  const s = useDemo();
  const routes = dayRoutes(s, s.today);
  const route = routes.find((r) => r.id === s.driverRoute) ?? routes[0];
  const invoices = routeInvoices(s, route.id);
  const done = invoices.filter((i) => i.status !== "open").length;
  const boxes = routeTally(s, route.id);
  const eggs = boxes.filter((b) => b.kind === "egg").reduce((n, b) => n + b.boxes, 0);
  const cheese = boxes.filter((b) => b.kind === "cheese").reduce((n, b) => n + b.boxes, 0);
  const next = invoices.find((i) => i.status === "open");

  async function start() {
    const yes = await confirm({
      title: `Start route ${route.number}?`,
      description: `${invoices.length} stops, ${eggs} boxes of eggs${cheese ? ` and ${cheese} cheese` : ""} on the truck.`,
      confirmLabel: "Start route",
    });
    if (!yes) return;
    actions.startRoute(route.id);
    toast("Route started", { description: "Stops are in your usual order." });
  }

  return (
    <Page title={`Route ${route.number}`} sub={`${route.driver} · ${statusLabel(route.status)}`}>
      {route.status === "calling" ? <Notice>Alma is still calling this route. Nothing to deliver yet.</Notice> : null}
      {route.status === "ready" ? (
        <Notice>
          Invoices are printed. Alejandro hasn’t loaded the truck yet.{" "}
          <Link href="/warehouse/load" className="font-semibold underline">
            Go to Load
          </Link>
        </Notice>
      ) : null}

      {invoices.length ? (
        <Card>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[28px] font-bold leading-none tabular-nums">
                {done}
                <span className="text-muted">/{invoices.length}</span>
              </p>
              <p className="mt-1 text-xs text-muted">Stops done</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold tabular-nums">
                {eggs} boxes{cheese ? ` · ${cheese} cheese` : ""}
              </p>
              <p className="text-xs text-muted">On the truck this morning</p>
            </div>
          </div>
          <div className="mt-3">
            <Bar value={done} max={invoices.length} label="Stops done" tone="good" />
          </div>
        </Card>
      ) : null}

      {route.status === "loaded" ? (
        <button className={btn.primary} onClick={start}>
          Start route
        </button>
      ) : null}

      {route.status === "out" && next ? (
        <Link href={`/driver/stop/${next.number}`} className={btn.primary}>
          Next stop: {customerOf(s, next.customerId).name}
        </Link>
      ) : null}

      {route.status === "out" && !next ? (
        <Link href="/driver/bag" className={btn.primary}>
          All stops done. Fill the route bag
        </Link>
      ) : null}

      {["back", "checkedIn", "audited", "entered"].includes(route.status) ? (
        <Notice tone="good">Route bag turned in. It’s in the lockbox for Colin.</Notice>
      ) : null}

      <div className="flex flex-col gap-2">
        {invoices.map((inv) => {
          const c = customerOf(s, inv.customerId);
          const canOpen = route.status === "out" || inv.status !== "open";
          const body = (
            <div className={cx("flex items-center gap-3 rounded-3xl border border-line bg-card p-4", inv.status !== "open" && "bg-card/60")}>
              <span
                className={cx(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold",
                  inv.status === "delivered" ? "bg-good text-white" : inv.status === "void" ? "bg-line text-muted" : "bg-ink text-paper"
                )}
              >
                {inv.status === "delivered" ? "✓" : inv.status === "void" ? "—" : c.routeNo === route.number ? c.stop : "+"}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cx("truncate text-[16px] font-semibold", inv.status === "void" && "text-muted line-through")}>{c.name}</p>
                <p className="truncate text-xs text-muted">
                  {c.city} · {inv.lines.map((l) => `${productName(s, l.productId)} ${l.boxes}`).join(", ")}
                  {inv.swap ? " · swap 1 expired" : ""}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[15px] font-semibold tabular-nums">{money(inv.result?.amount ?? invoiceTotal(inv))}</p>
                {inv.status === "delivered" ? (
                  <Tag tone={inv.result!.method === "charge" ? "warn" : "good"}>{METHOD[inv.result!.method]}</Tag>
                ) : inv.status === "void" ? (
                  <Tag>Void</Tag>
                ) : (
                  <Tag tone={c.terms === "Net 30" ? "warn" : "neutral"}>{c.terms === "Net 30" ? "Charge" : "COD"}</Tag>
                )}
              </div>
            </div>
          );
          return canOpen ? (
            <Link key={inv.number} href={`/driver/stop/${inv.number}`} className="active:scale-[0.99] transition">
              {body}
            </Link>
          ) : (
            <div key={inv.number}>{body}</div>
          );
        })}
      </div>
    </Page>
  );
}
