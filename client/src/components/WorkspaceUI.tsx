import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { AlertTriangle, FolderPlus, type LucideIcon } from "lucide-react";

export const fieldClass = "mt-1.5 h-10 w-full rounded-lg border border-white/[0.09] bg-slate-950/45 px-3 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-sky-300/45 focus:ring-2 focus:ring-sky-400/10";
export const textareaClass = "mt-1.5 min-h-24 w-full rounded-lg border border-white/[0.09] bg-slate-950/45 px-3 py-2.5 text-sm leading-6 text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-sky-300/45 focus:ring-2 focus:ring-sky-400/10";

export function StatusPill({ value }: { value: string }) {
  const color: Record<string, string> = {
    active: "border-emerald-300/15 bg-emerald-400/[0.09] text-emerald-300",
    verified: "border-emerald-300/15 bg-emerald-400/[0.09] text-emerald-300",
    open: "border-sky-300/15 bg-sky-400/[0.09] text-sky-200",
    in_progress: "border-amber-300/15 bg-amber-400/[0.08] text-amber-200",
    paused: "border-amber-300/15 bg-amber-400/[0.08] text-amber-200",
    pending: "border-amber-300/15 bg-amber-400/[0.08] text-amber-200",
    resolved: "border-emerald-300/15 bg-emerald-400/[0.09] text-emerald-300",
    completed: "border-emerald-300/15 bg-emerald-400/[0.09] text-emerald-300",
    low: "border-sky-300/15 bg-sky-400/[0.09] text-sky-200",
    medium: "border-amber-300/15 bg-amber-400/[0.08] text-amber-200",
    high: "border-orange-300/15 bg-orange-400/[0.08] text-orange-200",
    critical: "border-rose-300/15 bg-rose-400/[0.08] text-rose-300",
  };
  return <span className={cn("inline-flex rounded-full border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em]", color[value] ?? "border-white/10 bg-white/[0.04] text-slate-400")}>{value.replaceAll("_", " ")}</span>;
}

export function EmptyWorkspace({ icon: Icon = FolderPlus, title, description }: { icon?: LucideIcon; title: string; description: string }) {
  return <Card className="border-dashed border-white/[0.1] bg-white/[0.02] px-6 py-12 text-center shadow-none"><div className="mx-auto grid h-11 w-11 place-items-center rounded-xl border border-white/[0.08] bg-slate-950/40 text-sky-200"><Icon size={19} /></div><h2 className="mt-5 font-display text-lg font-semibold text-slate-100">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p></Card>;
}

export function SafetyNotice({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-3 rounded-xl border border-amber-300/10 bg-amber-400/[0.035] px-4 py-3 text-xs leading-5 text-amber-100/80"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />{children}</div>;
}

