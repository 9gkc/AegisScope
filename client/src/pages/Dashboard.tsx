import { PageHeading } from "@/components/AegisLayout";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, Boxes, CheckCircle2, Radar, ShieldAlert, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

const severityConfig = [
  { key: "critical", label: "Critical", color: "bg-rose-400", text: "text-rose-300" },
  { key: "high", label: "High", color: "bg-orange-400", text: "text-orange-300" },
  { key: "medium", label: "Medium", color: "bg-amber-300", text: "text-amber-200" },
  { key: "low", label: "Low", color: "bg-sky-300", text: "text-sky-200" },
  { key: "info", label: "Info", color: "bg-slate-500", text: "text-slate-400" },
] as const;

function MetricCard({ label, value, hint, icon: Icon, tone }: { label: string; value: number; hint: string; icon: typeof Boxes; tone: string }) {
  return <Card className="relative overflow-hidden border-white/[0.08] bg-white/[0.035] p-5 shadow-none transition-transform duration-200 hover:-translate-y-0.5">
    <div className={`absolute right-0 top-0 h-24 w-24 rounded-full blur-3xl ${tone}`} />
    <div className="relative flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</p><p className="mt-4 font-display text-3xl font-semibold text-slate-50">{value}</p><p className="mt-2 text-xs text-slate-500">{hint}</p></div><div className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.08] bg-slate-950/35 text-slate-200"><Icon size={18} /></div></div>
  </Card>;
}

export default function Dashboard() {
  const metrics = trpc.dashboard.metrics.useQuery();
  if (metrics.isLoading) return <div className="space-y-6"><Skeleton className="h-28 bg-white/5" /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Skeleton className="h-36 bg-white/5" /><Skeleton className="h-36 bg-white/5" /><Skeleton className="h-36 bg-white/5" /><Skeleton className="h-36 bg-white/5" /></div></div>;
  const data = metrics.data;
  const maximum = Math.max(...severityConfig.map(item => data?.severityCounts[item.key] ?? 0), 1);
  return <>
    <PageHeading eyebrow="Security operations" title="Operational clarity, inside scope." description="Track only authorized assets, document security findings responsibly, and preserve defensible evidence throughout the remediation lifecycle." action={<Badge className="w-fit border-emerald-300/15 bg-emerald-400/[0.08] px-3 py-1.5 text-emerald-300 hover:bg-emerald-400/[0.08]"><CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Controls active</Badge>} />
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Authorized assets" value={data?.totals.assets ?? 0} hint={`${data?.totals.verifiedAssets ?? 0} verified for review`} icon={Boxes} tone="bg-sky-500/10" />
      <MetricCard label="Open findings" value={data?.totals.findings ?? 0} hint="Across your private workspace" icon={Radar} tone="bg-violet-500/10" />
      <MetricCard label="Active programs" value={data?.programStatus.active ?? 0} hint={`${data?.totals.programs ?? 0} total engagements`} icon={ShieldCheck} tone="bg-emerald-500/10" />
      <MetricCard label="Priority exposure" value={(data?.severityCounts.critical ?? 0) + (data?.severityCounts.high ?? 0)} hint="Critical and high severity" icon={ShieldAlert} tone="bg-rose-500/10" />
    </section>
    <section className="mt-6 grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
      <Card className="border-white/[0.08] bg-white/[0.035] p-5 shadow-none sm:p-6">
        <div className="flex items-center justify-between"><div><p className="font-display text-lg font-semibold text-slate-100">Finding posture</p><p className="mt-1 text-xs text-slate-500">Current distribution by declared severity</p></div><span className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500">Live aggregate</span></div>
        <div className="mt-8 space-y-5">{severityConfig.map(item => { const value = data?.severityCounts[item.key] ?? 0; return <div key={item.key} className="grid grid-cols-[74px_1fr_28px] items-center gap-3"><span className={`text-xs font-medium ${item.text}`}>{item.label}</span><div className="h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className={`h-full rounded-full ${item.color} transition-all duration-500`} style={{ width: `${(value / maximum) * 100}%` }} /></div><span className="text-right font-mono text-xs text-slate-400">{value}</span></div>; })}</div>
        {(data?.totals.findings ?? 0) === 0 && <div className="mt-8 rounded-xl border border-dashed border-white/10 bg-slate-950/25 p-4 text-sm leading-6 text-slate-400">No findings are recorded yet. Start by creating a program and adding a documented authorized asset; then record observations with a clear impact and remediation path.</div>}
      </Card>
      <Card className="border-white/[0.08] bg-gradient-to-b from-sky-400/[0.09] to-white/[0.025] p-5 shadow-none sm:p-6">
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-sky-300/15 bg-sky-400/10 text-sky-200"><ShieldCheck size={19} /></div>
        <h2 className="mt-5 font-display text-xl font-semibold text-slate-100">Scope controls are non-negotiable.</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">Header reviews require an active verified asset. Local configuration review runs in your browser and never uploads the submitted text.</p>
        <Link href="/safety" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-sky-300 transition-colors hover:text-sky-200">Review safety boundaries <ArrowUpRight size={15} /></Link>
      </Card>
    </section>
  </>;
}
