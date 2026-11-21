"use client";

import { customerOf, routeSheet } from "@/lib/derive";
import { money } from "@/lib/format";
import { useDemo } from "@/lib/store";
import { cx } from "./ui";

export function RouteSheetCard({ routeId, roa, showNumber = true }: { routeId: string; roa?: { count: number; amount: number }; showNumber?: boolean }) {
  const s = useDemo();
  const sheet = routeSheet(s, routeId);
  const route = sheet.route;
  const shownRoa = roa ?? route.roa ?? { count: 0, amount: 0 };
  const bagTotal = sheet.cash.amount + sheet.checks.amount + shownRoa.amount;
  const roaPayments = s.payments.filter((p) => p.routeId === routeId);

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-card">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="font-serif text-lg font-bold italic">Cal Egg X · Route sheet</p>
        {showNumber ? <p className="text-sm font-semibold">#{route.number}</p> : null}
      </div>
      <SheetGrid
        rows={[
          ["Invoices out", sheet.invoicesOut],
          ["Invoices in", sheet.invoicesIn],
          ["Eggs out", sheet.eggsOut],
          ["Eggs in", sheet.eggsIn],
          ["Eggs sold", sheet.eggsSold, true],
          ...(sheet.cheeseOut ? ([["Cheese sold", sheet.cheeseSold]] as const) : []),
          ["Voids", sheet.voids],
          ["Expired back", sheet.expiredIn],
        ]}
      />
      <div className="border-t border-line px-4 py-2">
        <div className="grid grid-cols-[1fr_3rem_6rem] py-1 text-[11px] uppercase tracking-wide text-muted">
          <span />
          <span className="text-right">#</span>
          <span className="text-right">Amount</span>
        </div>
        {(
          [
            ["Checks", sheet.checks],
            ["Cash", sheet.cash],
            ["Charge", sheet.charge],
          ] as const
        ).map(([name, v]) => (
          <div key={name} className="grid grid-cols-[1fr_3rem_6rem] border-t border-line/60 py-2 text-[15px]">
            <span>{name}</span>
            <span className="text-right tabular-nums">{v.count}</span>
            <span className="text-right font-semibold tabular-nums">{money(v.amount)}</span>
          </div>
        ))}
        <div className="grid grid-cols-[1fr_3rem_6rem] border-t border-line/60 py-2 text-[15px]">
          <span>R.O.A.</span>
          <span className="text-right tabular-nums">{shownRoa.count}</span>
          <span className="text-right font-semibold tabular-nums">{money(shownRoa.amount)}</span>
        </div>
        {!roa && roaPayments.length ? (
          <div className="pb-2 text-xs text-muted">
            {roaPayments.map((p) => (
              <p key={p.id}>
                {customerOf(s, p.customerId).name} · {p.checkNo ? `check #${p.checkNo}` : "cash"} · {money(p.amount)}
              </p>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex items-end justify-between border-t border-line bg-paper px-4 py-3">
        <div className="text-xs text-muted">
          <p>Sales {money(sheet.sales)}</p>
          <p>Charge is billed, not in the bag</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wide text-muted">In the bag</p>
          <p className="text-[26px] font-bold leading-none tabular-nums">{money(bagTotal)}</p>
        </div>
      </div>
      {route.driverSigned || route.managerSigned ? (
        <div className="grid grid-cols-2 border-t border-line">
          <Signed label="Driver" name={route.driverSigned} image={route.driverSignature} />
          <Signed label="Warehouse manager" name={route.managerSigned} image={route.managerSignature} />
        </div>
      ) : null}
    </div>
  );
}

function Signed({ label, name, image }: { label: string; name?: string; image?: string }) {
  return (
    <div className="border-line/60 px-4 py-2 first:border-r">
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={`${label} signature`} className="h-12 w-full object-contain object-left" />
      ) : (
        <p className="h-12 pt-3 text-sm italic text-muted">{name ? `${name} (on paper)` : "Not signed"}</p>
      )}
      {name ? <p className="text-xs">{name}</p> : null}
    </div>
  );
}

function SheetGrid({ rows }: { rows: readonly (readonly [string, number, boolean?])[] }) {
  return (
    <div className="grid grid-cols-2">
      {rows.map(([name, value, strong], i) => (
        <div key={name} className={cx("flex items-center justify-between border-line/60 px-4 py-2.5", i % 2 === 0 && "border-r", i >= 2 && "border-t")}>
          <span className="text-sm text-muted">{name}</span>
          <span className={cx("tabular-nums", strong ? "text-xl font-bold" : "text-[17px] font-semibold")}>{value}</span>
        </div>
      ))}
    </div>
  );
}
