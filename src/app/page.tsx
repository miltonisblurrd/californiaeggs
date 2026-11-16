"use client";

import Link from "next/link";
import { SEATS } from "@/components/shell";
import { Card, Page } from "@/components/ui";
import { dayRoutes } from "@/lib/derive";
import { actions, useDemo } from "@/lib/store";

const GROUPS = [
  { title: "Owner Operations", keys: ["colin"] },
  { title: "Sales", keys: ["alma"] },
  { title: "Warehouse", keys: ["warehouse"] },
];

export default function Home() {
  const s = useDemo();
  const drivers = dayRoutes(s, s.today);

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
          {drivers.map((r) => (
            <Link
              key={r.id}
              href="/driver"
              onClick={() => actions.pickDriverRoute(r.id)}
              className="block min-h-28 rounded-3xl border border-line bg-card p-4 active:scale-[0.99] transition"
            >
              <p className="text-lg font-bold">{r.driver}</p>
              <p className="text-sm text-muted">Route {r.number}</p>
              <p className="mt-3 text-xs text-muted">My route · Route bag</p>
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
