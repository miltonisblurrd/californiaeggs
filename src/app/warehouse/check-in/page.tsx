"use client";

import { useState } from "react";
import { confirm } from "@ui-sdk/react/alert-dialog";
import { toast } from "@ui-sdk/react/toast";
import { Card, Label, Notice, Page, Row, Tag, btn, cx } from "@/components/ui";
import { day, time } from "@/lib/format";
import { productName, routeReturns, routeSheet } from "@/lib/derive";
import { actions, useDemo } from "@/lib/store";
import { SignaturePad } from "@/components/signature-pad";

const WHY = { void: "Voided stop", short: "Short at the door", expired: "Expired, swapped out" };

export default function CheckIn() {
  const s = useDemo();
  const cameBack = s.routes.filter((r) => ["back", "checkedIn", "audited", "entered"].includes(r.status));
  const waiting = cameBack.filter((r) => !r.managerSigned).sort((a, b) => a.number - b.number);
  const done = cameBack.filter((r) => r.managerSigned).sort((a, b) => b.number - a.number);

  return (
    <Page title="Check in" sub="Boxes that came back on the truck. Matches the Eggs In line on the route sheet.">
      {!waiting.length ? <Notice tone="good">No trucks waiting. Every bag that came back is checked in.</Notice> : null}

      {waiting.map((r) => (
        <WaitingRoute key={r.id} routeId={r.id} />
      ))}

      {done.length ? (
        <Card>
          <Label>Checked in</Label>
          <div className="mt-1">
            {done.map((r) => (
              <Row key={r.id} left={`Route ${r.number} · ${r.driver}`} sub={`${day(r.date)} · signed by ${r.managerSigned ?? "Alejandro"}`} right={<Tag tone="good">Signed</Tag>} />
            ))}
          </div>
        </Card>
      ) : null}
    </Page>
  );
}

function WaitingRoute({ routeId }: { routeId: string }) {
  const s = useDemo();
  const r = s.routes.find((x) => x.id === routeId)!;
  const sheet = routeSheet(s, r.id);
  const returns = routeReturns(s, r.id);
  const [signature, setSignature] = useState<string | undefined>();

  async function checkIn() {
    const good = returns.filter((x) => x.why !== "expired").reduce((n, x) => n + x.boxes, 0);
    const yes = await confirm({
      title: `Check in route ${r.number}?`,
      description: good ? `${good} ${good === 1 ? "box goes" : "boxes go"} back in the cooler.` : "Nothing goes back in the cooler.",
      confirmLabel: "Check in",
    });
    if (!yes) return;
    actions.checkIn(r.id, signature);
    toast(`Route ${r.number} checked in`, { description: good ? `${good} back in the cooler.` : "Signed." });
  }

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg font-bold">
            Route {r.number} · {r.driver}
          </p>
          <p className="text-sm text-muted">
            {day(r.date)} · back {time(r.backAt)}
          </p>
        </div>
        <Tag tone="yolk">Waiting</Tag>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-paper p-3 text-center">
        <div>
          <p className="text-xl font-bold tabular-nums">{sheet.eggsOut}</p>
          <p className="text-xs text-muted">Eggs out</p>
        </div>
        <div>
          <p className="text-xl font-bold tabular-nums">{sheet.eggsIn}</p>
          <p className="text-xs text-muted">Eggs in</p>
        </div>
        <div>
          <p className="text-xl font-bold tabular-nums">{sheet.eggsSold}</p>
          <p className="text-xs text-muted">Sold</p>
        </div>
      </div>
      <div className="mt-2">
        {returns.length ? (
          returns.map((x, i) => (
            <Row
              key={i}
              left={productName(s, x.productId)}
              sub={x.why === "expired" ? `${WHY[x.why]} · stays out of the cooler` : WHY[x.why]}
              right={<span className={cx("font-bold", x.why === "expired" ? "text-bad" : "text-good")}>{x.boxes}</span>}
            />
          ))
        ) : (
          <p className="py-2 text-sm text-muted">Nothing came back. Every box was delivered.</p>
        )}
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <Label>Warehouse manager signs</Label>
        <SignaturePad value={signature} onChange={setSignature} placeholder="Alejandro signs here" />
      </div>
      <button className={cx(btn.primary, "mt-3 w-full")} disabled={!signature} onClick={checkIn}>
        {signature ? "Check in" : "Sign to check in"}
      </button>
    </Card>
  );
}
