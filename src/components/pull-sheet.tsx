"use client";

import { useState } from "react";
import { toast } from "@ui-sdk/react/toast";
import { onHand } from "@/lib/derive";
import { actions, useDemo } from "@/lib/store";
import { boxes as boxesText } from "@/lib/format";
import { BoxStepper, Choose, Notice, Sheet, btn } from "./ui";

const REASONS = ["Owner pickup", "Broken or damaged", "Sample for a new customer", "Staff", "Other"];

export function PullSheet({
  open,
  onOpenChange,
  who,
  productId: preset,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  who: string;
  productId?: string;
}) {
  const s = useDemo();
  const [productId, setProductId] = useState<string | null>(preset ?? null);
  const [n, setN] = useState<number | null>(1);
  const [reason, setReason] = useState<string | null>(null);
  const pid = preset ?? productId;
  const have = pid ? onHand(s, pid) : 0;

  function save() {
    if (!pid || !n || !reason) return;
    actions.pull({ productId: pid, boxes: n, reason, who });
    toast(`Pulled ${boxesText(n)}`, { description: `${s.products.find((p) => p.id === pid)!.name}. ${reason}.` });
    setN(1);
    setReason(null);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Pull boxes" description="Boxes leaving the cooler with no invoice.">
      <div className="flex flex-col gap-4">
        {!preset ? (
          <Choose
            label="Product"
            value={productId}
            onChange={setProductId}
            placeholder="Choose a product"
            options={s.products.filter((p) => onHand(s, p.id) > 0).map((p) => ({ value: p.id, label: `${p.name} · ${onHand(s, p.id)} on hand` }))}
          />
        ) : null}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Boxes</p>
            {pid ? <p className="text-xs text-muted">{have} in the cooler</p> : null}
          </div>
          <BoxStepper value={n} onChange={setN} label="boxes to pull" min={1} max={have || undefined} size="lg" />
        </div>
        <Choose label="Why" value={reason} onChange={setReason} placeholder="Choose a reason" options={REASONS.map((r) => ({ value: r, label: r }))} />
        <Notice tone="neutral">
          This shows on Colin’s screen as boxes out with no invoice, so the Friday count doesn’t come up short with no explanation.
        </Notice>
        <button className={btn.primary} disabled={!pid || !n || !reason} onClick={save}>
          Pull {n ? boxesText(n) : ""}
        </button>
      </div>
    </Sheet>
  );
}
