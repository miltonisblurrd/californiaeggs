"use client";

import Link from "next/link";
import { SEATS } from "@/components/shell";
import { Card, Label, Page, Tag } from "@/components/ui";
import { dayRoutes, statusLabel } from "@/lib/derive";
import { useDemo } from "@/lib/store";

const WALK = [
  { who: "Alejandro", what: "Counts the cooler and receives a delivery", href: "/warehouse" },
  { who: "Alejandro", what: "Loads Junior’s truck. The cooler goes down.", href: "/warehouse/load" },
  { who: "Junior", what: "Runs his stops: signature, cash, check, or charge", href: "/driver" },
  { who: "Junior", what: "Turns in the route bag, with any R.O.A. checks", href: "/driver/bag" },
  { who: "Alejandro", what: "Checks the boxes back in", href: "/warehouse/check-in" },
  { who: "Alma", what: "Calls tomorrow’s routes and prints the invoices", href: "/alma" },
  { who: "Colin", what: "Audits the bags from the lockbox", href: "/colin/audit" },
  { who: "Inputter", what: "Enters the audited routes in QuickBooks", href: "/inputter" },
  { who: "Colin", what: "Sees the cooler, the day, and who owes what", href: "/colin" },
  { who: "Anyone", what: "Close the day from the seat menu. Tomorrow starts.", href: "/" },
];

export default function Home() {
  const s = useDemo();
  const today = dayRoutes(s, s.today);

  return (
    <Page title="Who’s using it?" sub="Pick a seat. Each person sees only their part of the day.">
      <div className="grid grid-cols-2 gap-3">
        {SEATS.map((seat) => (
          <Card key={seat.key} href={seat.home} className="min-h-28">
            <p className="text-lg font-bold">{seat.name}</p>
            <p className="text-sm text-muted">{seat.role}</p>
            <p className="mt-3 text-xs text-muted">{seat.tabs.map((t) => t.label).join(" · ")}</p>
          </Card>
        ))}
      </div>

      <Card>
        <Label>Today’s trucks</Label>
        <div className="mt-2 flex flex-col">
          {today.map((r) => (
            <div key={r.id} className="flex items-center justify-between border-b border-line/70 py-2.5 last:border-0">
              <p className="text-[15px]">
                <span className="font-semibold">Route {r.number}</span> · {r.driver}
              </p>
              <Tag tone={r.status === "out" ? "yolk" : r.status === "calling" ? "warn" : "neutral"}>{statusLabel(r.status)}</Tag>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <Label>Walk the day, in order</Label>
        <ol className="mt-2 flex flex-col">
          {WALK.map((step, i) => (
            <li key={step.href + i}>
              <Link href={step.href} className="flex items-start gap-3 border-b border-line/70 py-3 last:border-0 active:opacity-70">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-paper">{i + 1}</span>
                <span>
                  <span className="block text-[15px] font-semibold">{step.who}</span>
                  <span className="block text-sm text-muted">{step.what}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </Card>

      <p className="px-1 text-xs text-muted">
        Sample data shaped like the real business: the 17 cooler lines from Alejandro’s sheet, the yellow invoice, and Junior’s route sheet. Nothing here
        touches QuickBooks. Use Reset demo day in the seat menu to start over.
      </p>
    </Page>
  );
}
