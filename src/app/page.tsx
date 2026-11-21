"use client";

import Link from "next/link";
import { SEATS } from "@/components/shell";
import { Card, Page } from "@/components/ui";
import { routeOrders } from "@/lib/derive";
import { day } from "@/lib/format";
import { actions, useDemo } from "@/lib/store";

const FINISHED = ["back", "checkedIn", "audited", "entered"];

const GROUPS = [
  { title: "Owner Operations", keys: ["colin"] },
  { title: "Sales", keys: ["alma"] },
  { title: "Warehouse", keys: ["warehouse"] },
];

export default function Home() {
  const s = useDemo();
  const names = [...new Set(s.routes.map((r) => r.driver))].sort();
  const drivers = names.map((name) => {
    const routes = s.routes.filter((r) => r.driver === name).sort((a, b) => a.date.localeCompare(b.date));
    const last = [...routes].reverse().find((r) => r.date < s.today || FINISHED.includes(r.status));
    const next = routes.find((r) => r.date >= s.today && !FINISHED.includes(r.status)) ?? routes[routes.length - 1];
    return { name, last, next };
  });

  return (
    <Page title="Good Morning," sub="Pick up where you left off. The trucks, the calls, and the cooler are already moving.">
      {GROUPS.map((group) => (
        <section key={group.title} className="flex flex-col gap-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink">{group.title}</h2>
          <div className="grid grid-cols-2 gap-3">
            {group.keys.map((key) => {
              const seat = SEATS.find((st) => st.key === key)!;
              return (
                <Card key={seat.key} href={seat.home} className={group.keys.length === 1 ? "col-span-2 min-h-28" : "min-h-28"}>
                  <p className="text-lg font-bold">{seat.name}</p>
                  <p className="text-sm text-muted">{seat.role}</p>
                  <p className="mt-3 text-xs text-muted">{seat.tabs.map((t) => t.label).join(" · ")}</p>
                </Card>
              );
            })}
          </div>
        </section>
      ))}

      <section className="flex flex-col gap-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink">Drivers</h2>
        <div className="grid grid-cols-2 gap-3">
          {drivers.map(({ name, last, next }) => (
            <Link
              key={name}
              href="/driver"
              onClick={() => next && actions.pickDriverRoute(next.id)}
              className="col-span-2 block rounded-3xl border border-line bg-card p-4 active:scale-[0.99] transition"
            >
              <p className="text-lg font-bold">{name}</p>
              <p className="mt-2 text-sm text-muted">Last drop off {last ? day(last.date) : "—"}</p>
              <p className="text-sm text-ink">{next ? `Next ${day(next.date)} · ${routeOrders(s, next.id).length} orders` : "No route planned"}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink">QuickBooks</h2>
        <div className="grid grid-cols-2 gap-3">
          {SEATS.filter((st) => st.key === "inputter").map((seat) => (
            <Card key={seat.key} href={seat.home} className="col-span-2 min-h-28">
              <p className="text-lg font-bold">{seat.name}</p>
              <p className="text-sm text-muted">{seat.role}</p>
              <p className="mt-3 text-xs text-muted">{seat.tabs.map((t) => t.label).join(" · ")}</p>
            </Card>
          ))}
        </div>
      </section>

      <p className="px-1 text-xs text-muted">
        Sample data shaped like the real business. Nothing here touches QuickBooks. Once you’re in a seat, Reset demo day is in the menu.
      </p>
    </Page>
  );
}
