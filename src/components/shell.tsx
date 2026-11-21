"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@ui-sdk/react/menu";
import { OverlayHost } from "@ui-sdk/react/overlays";
import { confirm } from "@ui-sdk/react/alert-dialog";
import { toast } from "@ui-sdk/react/toast";
import { actions, useDemo, useLoaded } from "@/lib/store";
import { day } from "@/lib/format";
import { dayRoutes, nextServiceDay } from "@/lib/derive";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui-sdk/react/select";
import { cx } from "./ui";

export type SeatKey = "colin" | "alma" | "warehouse" | "driver" | "inputter";

export const SEATS: { key: SeatKey; name: string; role: string; home: string; tabs: { href: string; label: string }[] }[] = [
  {
    key: "colin",
    name: "Colin",
    role: "Owner",
    home: "/colin",
    tabs: [
      { href: "/colin", label: "Home" },
      { href: "/colin/cooler", label: "Cooler" },
      { href: "/colin/audit", label: "Audit" },
      { href: "/colin/invoices", label: "Invoices" },
      { href: "/colin/owed", label: "Owed" },
      { href: "/colin/friday", label: "Count" },
    ],
  },
  {
    key: "alma",
    name: "Alma",
    role: "Sales and invoices",
    home: "/alma",
    tabs: [
      { href: "/alma", label: "Call sheet" },
      { href: "/alma/routes", label: "Routes" },
      { href: "/alma/customers", label: "Customers" },
    ],
  },
  {
    key: "warehouse",
    name: "Alejandro",
    role: "Warehouse",
    home: "/warehouse",
    tabs: [
      { href: "/warehouse", label: "Count" },
      { href: "/warehouse/load", label: "Load" },
      { href: "/warehouse/receive", label: "Receive" },
      { href: "/warehouse/check-in", label: "Check in" },
      { href: "/warehouse/friday", label: "Friday" },
    ],
  },
  {
    key: "driver",
    name: "Driver",
    role: "On the route",
    home: "/driver",
    tabs: [
      { href: "/driver", label: "My route" },
      { href: "/driver/bag", label: "Route bag" },
    ],
  },
  {
    key: "inputter",
    name: "Inputter",
    role: "QuickBooks entry",
    home: "/inputter",
    tabs: [{ href: "/inputter", label: "Enter in QuickBooks" }],
  },
];

function seatFor(path: string) {
  return SEATS.find((s) => path === s.home || path.startsWith(`${s.home}/`));
}

function activeTab(path: string, tabs: { href: string }[]) {
  return [...tabs].sort((a, b) => b.href.length - a.href.length).find((t) => path === t.href || path.startsWith(`${t.href}/`))?.href;
}

function ColinRange() {
  const s = useDemo();
  const dates = [...new Set(s.routes.map((r) => r.date))].sort();
  const value = s.colinRange && (s.colinRange === "30" || s.colinRange === "90" || s.colinRange === "ytd" || s.colinRange === "mom" || s.colinRange === "yoy" || dates.includes(s.colinRange)) ? s.colinRange : s.today;
  const presets = [
    { value: "30", label: "Last 30 days" },
    { value: "90", label: "Last 90 days" },
    { value: "ytd", label: "Year to date" },
    { value: "mom", label: "Month over month" },
    { value: "yoy", label: "Year over year" },
  ];
  return (
    <Select
      items={[{ value: s.today, label: day(s.today) }, ...presets, ...dates.filter((d) => d !== s.today).map((d) => ({ value: d, label: day(d) }))]}
      value={value}
      onValueChange={(v) => v && actions.pickColinRange(v)}
    >
      <SelectTrigger className="inline-flex h-10 max-w-[11rem] items-center gap-2 rounded-2xl border border-line bg-card px-3 text-sm font-semibold">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-72 min-w-48 overflow-auto rounded-2xl border border-line bg-card p-1 shadow-lg">
        {dates.map((d) => (
          <SelectItem key={d} value={d} className="flex min-h-11 items-center rounded-xl px-3 text-[15px] data-highlighted:bg-line/60 data-selected:font-semibold">
            {day(d)}
          </SelectItem>
        ))}
        {presets.map((p) => (
          <SelectItem key={p.value} value={p.value} className="flex min-h-11 items-center rounded-xl px-3 text-[15px] data-highlighted:bg-line/60 data-selected:font-semibold">
            {p.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function DriverDate() {
  const s = useDemo();
  const current = s.routes.find((r) => r.id === s.driverRoute);
  const dates = [...new Set(s.routes.filter((r) => r.driver === current?.driver).map((r) => r.date))].sort();
  const value = s.driverDate === "week" || (s.driverDate && dates.includes(s.driverDate)) ? s.driverDate : current?.date ?? dates[0];
  return (
    <Select
      items={[{ value: "week", label: "This week" }, ...dates.map((d) => ({ value: d, label: day(d) }))]}
      value={value}
      onValueChange={(v) => v && actions.pickDriverDate(v)}
    >
      <SelectTrigger className="inline-flex h-10 items-center gap-2 rounded-2xl border border-line bg-card px-3 text-sm font-semibold">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-72 min-w-44 overflow-auto rounded-2xl border border-line bg-card p-1 shadow-lg">
        <SelectItem value="week" className="flex min-h-11 items-center rounded-xl px-3 text-[15px] data-highlighted:bg-line/60 data-selected:font-semibold">
          This week
        </SelectItem>
        {dates.map((d) => (
          <SelectItem key={d} value={d} className="flex min-h-11 items-center rounded-xl px-3 text-[15px] data-highlighted:bg-line/60 data-selected:font-semibold">
            {day(d)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function AlmaDate() {
  const s = useDemo();
  const dates = [...new Set(s.routes.map((r) => r.date))].sort();
  const value = s.almaDate && dates.includes(s.almaDate) ? s.almaDate : dates.find((d) => d > s.today) ?? dates[dates.length - 1];
  return (
    <Select
      items={dates.map((d) => ({ value: d, label: day(d) }))}
      value={value}
      onValueChange={(v) => v && actions.pickAlmaDate(v)}
    >
      <SelectTrigger className="inline-flex h-10 items-center gap-2 rounded-2xl border border-line bg-card px-3 text-sm font-semibold">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-72 min-w-44 overflow-auto rounded-2xl border border-line bg-card p-1 shadow-lg">
        {dates.map((d) => (
          <SelectItem key={d} value={d} className="flex min-h-11 items-center rounded-xl px-3 text-[15px] data-highlighted:bg-line/60 data-selected:font-semibold">
            {day(d)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const seat = seatFor(path);
  const s = useDemo();
  const loaded = useLoaded();
  const current = activeTab(path, seat?.tabs ?? []);

  async function closeDay() {
    const tomorrow = nextServiceDay(s.today);
    const unprinted = dayRoutes(s, tomorrow).filter((r) => r.status === "calling");
    const stillOut = dayRoutes(s, s.today).filter((r) => ["ready", "loaded", "out"].includes(r.status));
    const notes = [
      unprinted.length && `Alma hasn’t printed ${unprinted.map((r) => `route ${r.number}`).join(", ")}. They print now with what’s on the sheet.`,
      stillOut.length && `${stillOut.map((r) => `Route ${r.number}`).join(", ")} ${stillOut.length === 1 ? "hasn’t" : "haven’t"} turned in a bag. ${stillOut.length === 1 ? "It stays" : "They stay"} open.`,
    ].filter(Boolean);
    const yes = await confirm({
      title: `Close ${day(s.today)}?`,
      description: `${notes.join(" ")} Tomorrow is ${day(tomorrow)}, and Alma starts calling ${day(nextServiceDay(tomorrow))}.`.trim(),
      confirmLabel: "Close the day",
    });
    if (!yes) return;
    actions.closeDay();
    toast(`Good morning, ${day(tomorrow)}`, { description: "New trucks are on the load screen." });
  }

  async function reset() {
    const yes = await confirm({
      title: "Start the demo day over?",
      description: "Every count, load, stop, and audit you entered goes back to the sample morning.",
      confirmLabel: "Start over",
    });
    if (yes) {
      actions.reset();
      toast("Demo day reset", { description: "Back to Tuesday morning." });
    }
  }

  return (
    <>
      <header className="print:hidden sticky top-0 z-20 border-b border-line/80 bg-paper/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-ink text-[13px] font-black text-paper">CX</span>
            {path.startsWith("/alma") || path.startsWith("/driver") || path.startsWith("/colin") ? null : <span className="text-sm font-medium text-ink">{day(s.today)}</span>}
          </Link>
          {path.startsWith("/alma") ? <AlmaDate /> : path.startsWith("/driver") ? <DriverDate /> : path.startsWith("/colin") ? <ColinRange /> : path === "/" || path.startsWith("/warehouse") || path.startsWith("/inputter") ? null : (
          <Menu>
            <MenuTrigger className="inline-flex h-10 items-center gap-2 rounded-2xl border border-line bg-card px-3 text-sm font-semibold">
              {seat ? seat.name : "Choose seat"}
              <span aria-hidden className="text-muted">▾</span>
            </MenuTrigger>
            <MenuContent className="min-w-56 rounded-2xl border border-line bg-card p-1.5 shadow-lg">
              {SEATS.map((st) => (
                <MenuItem
                  key={st.key}
                  render={<Link href={st.home} />}
                  className="flex min-h-11 flex-col justify-center rounded-xl px-3 py-1.5 data-highlighted:bg-line/60"
                >
                  <span className="text-[15px] font-semibold">{st.name}</span>
                  <span className="text-xs text-muted">{st.role}</span>
                </MenuItem>
              ))}
              <MenuSeparator className="my-1 h-px bg-line" />
              <MenuItem onClick={closeDay} className="flex min-h-11 flex-col justify-center rounded-xl px-3 py-1.5 data-highlighted:bg-line/60">
                <span className="text-[15px] font-semibold">Close the day</span>
                <span className="text-xs text-muted">Move to {day(nextServiceDay(s.today))}</span>
              </MenuItem>
              <MenuItem onClick={reset} className="flex min-h-11 items-center rounded-xl px-3 text-[15px] font-medium text-bad data-highlighted:bg-bad/10">
                Reset demo day
              </MenuItem>
            </MenuContent>
          </Menu>
          )}
        </div>
      </header>

      <main className="min-h-[calc(100dvh-3.5rem)]">{loaded ? children : null}</main>

      {seat && seat.tabs.length > 1 ? (
        <nav
          aria-label={`${seat.name} screens`}
          className="print:hidden fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
        >
          <div className="mx-auto grid max-w-3xl" style={{ gridTemplateColumns: `repeat(${seat.tabs.length}, minmax(0, 1fr))` }}>
            {seat.tabs.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                aria-current={current === t.href ? "page" : undefined}
                className={cx(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[12px] font-semibold",
                  current === t.href ? "text-ink" : "text-muted"
                )}
              >
                <span className={cx("h-1.5 w-1.5 rounded-full", current === t.href ? "bg-shell" : "bg-transparent")} />
                {t.label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}

      <OverlayHost toast={{ side: "top", align: "center" }} />
    </>
  );
}
