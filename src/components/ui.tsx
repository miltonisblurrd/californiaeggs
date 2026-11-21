"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  NumberInput,
  NumberInputControl,
  NumberInputDecrement,
  NumberInputGroup,
  NumberInputIncrement,
} from "@ui-sdk/react/number-input";
import {
  Drawer,
  DrawerBackdrop,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@ui-sdk/react/drawer";
import {
  SegmentedControl,
  SegmentedControlIndicator,
  SegmentedControlItem,
} from "@ui-sdk/react/segmented-control";
import { Progress, ProgressIndicator, ProgressTrack } from "@ui-sdk/react/progress";
import { Meter, MeterIndicator, MeterTrack } from "@ui-sdk/react/meter";
import { Field, FieldDescription, FieldLabel } from "@ui-sdk/react/field";
import { Input } from "@ui-sdk/react/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui-sdk/react/select";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export const btn = {
  primary:
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-ink px-5 text-[15px] font-semibold text-paper active:scale-[0.98] disabled:opacity-40 transition",
  secondary:
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-line bg-card px-5 text-[15px] font-semibold text-ink active:scale-[0.98] disabled:opacity-40 transition",
  ghost:
    "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-medium text-muted hover:bg-line/50 active:scale-[0.98] transition",
  danger:
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-bad/30 bg-card px-5 text-[15px] font-semibold text-bad active:scale-[0.98] transition",
};

export function Page({ title, sub, action, children }: { title: string; sub?: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-28 pt-4">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold leading-tight tracking-tight">{title}</h1>
          {sub ? <p className="mt-0.5 text-sm text-muted">{sub}</p> : null}
        </div>
        {action}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

export function Card({ children, className, href }: { children: ReactNode; className?: string; href?: string }) {
  const cls = cx("rounded-3xl border border-line bg-card p-4", href && "block active:scale-[0.99] transition", className);
  return href ? (
    <Link href={href} className={cls}>
      {children}
    </Link>
  ) : (
    <div className={cls}>{children}</div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{children}</p>;
}

export function Big({ value, label, tone }: { value: ReactNode; label: string; tone?: "good" | "warn" | "bad" }) {
  return (
    <div>
      <p
        className={cx(
          "text-[28px] font-bold leading-none tracking-tight tabular-nums",
          tone === "good" && "text-good",
          tone === "warn" && "text-warn",
          tone === "bad" && "text-bad"
        )}
      >
        {value}
      </p>
      <p className="mt-1.5 text-xs text-muted">{label}</p>
    </div>
  );
}

export function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" | "bad" | "yolk" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tone === "neutral" && "bg-line/60 text-muted",
        tone === "good" && "bg-good/12 text-good",
        tone === "warn" && "bg-warn/15 text-warn",
        tone === "bad" && "bg-bad/10 text-bad",
        tone === "yolk" && "bg-yolk/20 text-shell"
      )}
    >
      {children}
    </span>
  );
}

export function Row({ left, right, sub, strong }: { left: ReactNode; right: ReactNode; sub?: ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line/70 py-2.5 last:border-0">
      <div className="min-w-0">
        <p className={cx("truncate text-[15px]", strong && "font-semibold")}>{left}</p>
        {sub ? <p className="truncate text-xs text-muted">{sub}</p> : null}
      </div>
      <div className={cx("shrink-0 text-right tabular-nums text-[15px]", strong && "font-semibold")}>{right}</div>
    </div>
  );
}

export function Notice({ children, tone = "warn" }: { children: ReactNode; tone?: "warn" | "good" | "bad" | "neutral" }) {
  return (
    <div
      className={cx(
        "rounded-2xl px-4 py-3 text-sm",
        tone === "warn" && "bg-warn/12 text-[#7a4f0f]",
        tone === "good" && "bg-good/10 text-good",
        tone === "bad" && "bg-bad/10 text-bad",
        tone === "neutral" && "bg-line/50 text-muted"
      )}
    >
      {children}
    </div>
  );
}

export function BoxStepper({
  value,
  onChange,
  label,
  min = 0,
  max,
  size = "md",
}: {
  value: number | null;
  onChange: (n: number | null) => void;
  label: string;
  min?: number;
  max?: number;
  size?: "sm" | "md" | "lg";
}) {
  const h = size === "lg" ? "h-14" : size === "sm" ? "h-10" : "h-12";
  const w = size === "lg" ? "w-14" : size === "sm" ? "w-10" : "w-12";
  return (
    <NumberInput value={value} onValueChange={onChange} min={min} max={max} step={1}>
      <NumberInputGroup className={cx("inline-flex items-stretch overflow-hidden rounded-2xl border border-line bg-card", h)}>
        <NumberInputDecrement
          aria-label={`Fewer ${label}`}
          className={cx(w, "h-auto rounded-none border-0 bg-transparent text-ink [--ui-icon-size:1.25rem] active:bg-line/60 data-disabled:opacity-30")}
        />
        <NumberInputControl
          aria-label={label}
          inputMode="numeric"
          className={cx(
            "m-0 h-auto w-16 rounded-none border-0 border-x border-line bg-transparent text-center font-semibold tabular-nums outline-none focus:bg-yolk/10",
            size === "lg" ? "text-2xl" : "text-lg"
          )}
        />
        <NumberInputIncrement
          aria-label={`More ${label}`}
          className={cx(w, "h-auto rounded-none border-0 bg-transparent text-ink [--ui-icon-size:1.25rem] active:bg-line/60 data-disabled:opacity-30")}
        />
      </NumberInputGroup>
    </NumberInput>
  );
}

export function MoneyField({ label, value, onChange, hint }: { label: string; value: number | null; onChange: (n: number | null) => void; hint?: string }) {
  return (
    <Field className="flex flex-col gap-1.5">
      <FieldLabel className="text-sm font-medium">{label}</FieldLabel>
      <NumberInput value={value} onValueChange={onChange} min={0} step={0.01} format={{ style: "currency", currency: "USD" }} locale="en-US">
        <NumberInputGroup className="flex h-12 overflow-hidden rounded-2xl border border-line bg-card">
          <NumberInputControl inputMode="decimal" className="m-0 h-auto w-full border-0 bg-transparent px-4 text-lg font-semibold tabular-nums outline-none focus:bg-yolk/10" />
        </NumberInputGroup>
      </NumberInput>
      {hint ? <FieldDescription className="text-xs text-muted">{hint}</FieldDescription> : null}
    </Field>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "numeric" | "text";
  hint?: string;
}) {
  return (
    <Field className="flex flex-col gap-1.5">
      <FieldLabel className="text-sm font-medium">{label}</FieldLabel>
      <Input
        value={value}
        onValueChange={(v) => onChange(String(v ?? ""))}
        placeholder={placeholder}
        inputMode={inputMode}
        className="h-12 rounded-2xl border border-line bg-card px-4 text-[16px] outline-none focus:border-shell"
      />
      {hint ? <FieldDescription className="text-xs text-muted">{hint}</FieldDescription> : null}
    </Field>
  );
}

export function Choose<T extends string>({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: T | null;
  onChange: (v: T | null) => void;
  options: { value: T; label: string }[];
  placeholder?: string;
}) {
  return (
    <Field className="flex flex-col gap-1.5">
      <FieldLabel className="text-sm font-medium">{label}</FieldLabel>
      <Select<T> items={options} value={value} onValueChange={(v) => onChange((v as T) ?? null)} placeholder={placeholder}>
        <SelectTrigger className="flex h-12 w-full items-center justify-between rounded-2xl border border-line bg-card px-4 text-left text-[16px] data-placeholder:text-muted">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-(--available-height) min-w-(--anchor-width) overflow-auto rounded-2xl border border-line bg-card p-1 shadow-lg">
          {options.map((o) => (
            <SelectItem
              key={o.value}
              value={o.value}
              className="flex min-h-11 items-center rounded-xl px-3 text-[15px] data-highlighted:bg-line/60 data-selected:font-semibold"
            >
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

export function Segments<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T | null;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <SegmentedControl
      aria-label={label}
      value={value}
      onValueChange={(v) => v && onChange(v as T)}
      className="relative isolate grid w-full rounded-2xl bg-line/60 p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      <SegmentedControlIndicator className="absolute z-[-1] rounded-xl bg-ink transition-all duration-200 [top:var(--segmented-control-indicator-top)] [left:var(--segmented-control-indicator-left)] [width:var(--segmented-control-indicator-width)] [height:var(--segmented-control-indicator-height)]" />
      {options.map((o) => (
        <SegmentedControlItem
          key={o.value}
          value={o.value}
          className="min-h-12 rounded-xl text-[15px] font-semibold text-ink transition-colors data-checked:text-paper"
        >
          {o.label}
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  );
}

export function Bar({ value, max, label, tone = "ink" }: { value: number; max: number; label: string; tone?: "ink" | "good" | "warn" }) {
  return (
    <Progress value={value} max={max || 1} aria-label={label}>
      <ProgressTrack className="h-2.5 w-full overflow-hidden rounded-full bg-line/70">
        <ProgressIndicator
          className={cx(
            "h-full rounded-full transition-all",
            tone === "ink" && "bg-ink",
            tone === "good" && "bg-good",
            tone === "warn" && "bg-warn"
          )}
          style={{ width: `${max ? Math.min(100, (value / max) * 100) : 0}%` }}
        />
      </ProgressTrack>
    </Progress>
  );
}

export function Gauge({ value, max, label, tone = "good" }: { value: number; max: number; label: string; tone?: "good" | "warn" | "bad" }) {
  return (
    <Meter value={value} max={max || 1} aria-label={label}>
      <MeterTrack className="h-2.5 w-full overflow-hidden rounded-full bg-line/70">
        <MeterIndicator
          className={cx("h-full rounded-full", tone === "good" && "bg-good", tone === "warn" && "bg-warn", tone === "bad" && "bg-bad")}
          style={{ width: `${max ? Math.min(100, (value / max) * 100) : 0}%` }}
        />
      </MeterTrack>
    </Meter>
  );
}

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} side="bottom">
      <DrawerBackdrop className="bg-black/35" />
      <DrawerContent className="sheet-up mx-auto flex max-h-[88dvh] w-full max-w-xl flex-col rounded-t-[28px] bg-paper pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-line" aria-hidden />
        <div className="flex items-start justify-between gap-3 px-5 pt-3">
          <div>
            <DrawerTitle className="text-xl font-bold tracking-tight">{title}</DrawerTitle>
            {description ? <DrawerDescription className="mt-0.5 text-sm text-muted">{description}</DrawerDescription> : null}
          </div>
          <DrawerClose className={btn.ghost}>Close</DrawerClose>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-4">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}

export function CautionSheet({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} side="bottom">
      <DrawerBackdrop className="bg-black/35" />
      <DrawerContent className="sheet-up mx-auto flex w-full max-w-xl flex-col gap-4 rounded-t-[28px] border-t border-amber-200 bg-amber-50 px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-2.5">
        <div className="mx-auto h-1.5 w-10 rounded-full bg-amber-200" aria-hidden />
        <div>
          <DrawerTitle className="text-xl font-bold tracking-tight">{title}</DrawerTitle>
          <DrawerDescription className="mt-1.5 text-[15px] leading-relaxed text-ink/75">{description}</DrawerDescription>
        </div>
        <div className="flex flex-col gap-2">
          <button
            className={`${btn.primary} w-full`}
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
          >
            {confirmLabel}
          </button>
          <DrawerClose className={`${btn.secondary} w-full`}>Cancel</DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
