import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { cn } from "@/lib/utils";
import {
  Activity,
  BookOpenCheck,
  Boxes,
  FileText,
  FolderKanban,
  Github,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Network,
  Radar,
  ShieldCheck,
  SlidersHorizontal,
  TerminalSquare,
  UserRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

const navigation = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Programs", href: "/programs", icon: FolderKanban },
  { label: "Assets", href: "/assets", icon: Network },
  { label: "Findings", href: "/findings", icon: Radar },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Header review", href: "/header-review", icon: SlidersHorizontal },
  { label: "Local review", href: "/config-review", icon: TerminalSquare },
];

export function AegisMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="aegis-mark grid h-9 w-9 place-items-center rounded-xl text-white shadow-[0_0_0_1px_rgba(125,211,252,.16),0_12px_28px_rgba(14,165,233,.16)]">
        <ShieldCheck size={19} strokeWidth={2.4} />
      </div>
      {!compact && (
        <div className="leading-none">
          <div className="font-display text-[15px] font-semibold tracking-[0.1em] text-slate-100">AEGIS<span className="text-sky-300">SCOPE</span></div>
          <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.21em] text-slate-500">AppSec workspace</div>
        </div>
      )}
    </div>
  );
}

function AuthGate() {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#07111c] px-5">
      <div className="pointer-events-none absolute inset-0 aegis-grid opacity-70" />
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950/65 p-8 shadow-[0_24px_90px_rgba(0,0,0,.35)] backdrop-blur-xl sm:p-10">
        <AegisMark />
        <div className="mt-10">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-sky-300">Private security operations</p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white">Your authorized security workspace.</h1>
          <p className="mt-4 leading-7 text-slate-400">Programs, assets, findings, and defensive reviews are available only after authentication. Network checks are restricted to verified allowlisted assets.</p>
        </div>
        <Button onClick={() => startLogin()} className="mt-8 h-11 w-full bg-sky-400 font-semibold text-slate-950 hover:bg-sky-300">
          <KeyRound className="mr-2 h-4 w-4" />
          Sign in to workspace
        </Button>
        <Link href="/portfolio" className="mt-5 block text-center text-sm text-slate-400 transition-colors hover:text-sky-300">View the public Portfolio</Link>
      </div>
    </div>
  );
}

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  return (
    <>
      <div className="px-5 pb-7 pt-6"><AegisMark /></div>
      <nav className="flex-1 space-y-1 px-3" aria-label="Workspace navigation">
        <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-600">Operations</p>
        {navigation.map(item => {
          const active = location === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} onClick={onNavigate} className={cn("group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all", active ? "bg-sky-400/[0.11] text-sky-200 shadow-[inset_0_0_0_1px_rgba(56,189,248,.12)]" : "text-slate-400 hover:bg-white/[0.045] hover:text-slate-100")}>
              <Icon className={cn("h-4 w-4", active ? "text-sky-300" : "text-slate-500 group-hover:text-slate-300")} />
              {item.label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_10px_#7dd3fc]" />}
            </Link>
          );
        })}
        <div className="my-6 border-t border-white/[0.06]" />
        <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-600">Knowledge</p>
        <Link href="/safety" onClick={onNavigate} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all", location === "/safety" ? "bg-sky-400/[0.11] text-sky-200" : "text-slate-400 hover:bg-white/[0.045] hover:text-slate-100")}>
          <BookOpenCheck className="h-4 w-4" /> Safety boundaries
        </Link>
        <Link href="/portfolio" onClick={onNavigate} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition-all hover:bg-white/[0.045] hover:text-slate-100">
          <UserRound className="h-4 w-4" /> Public Portfolio
        </Link>
      </nav>
      <div className="m-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-sky-400/10 text-sm font-semibold text-sky-200">{user?.name?.slice(0, 1).toUpperCase() ?? "U"}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-200">{user?.name || "Authenticated user"}</p>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-500">{user?.role === "admin" ? "Workspace owner" : "Workspace user"}</p>
          </div>
        </div>
        <button onClick={logout} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs text-slate-500 transition-colors hover:bg-white/[0.05] hover:text-rose-300"><LogOut size={13} /> Sign out</button>
      </div>
    </>
  );
}

function LoadingWorkspace() {
  return <div className="min-h-screen bg-[#07111c] p-8"><div className="mx-auto max-w-6xl space-y-5"><Skeleton className="h-10 w-48 bg-white/10" /><Skeleton className="h-36 w-full bg-white/5" /><div className="grid grid-cols-1 gap-4 md:grid-cols-3"><Skeleton className="h-32 bg-white/5" /><Skeleton className="h-32 bg-white/5" /><Skeleton className="h-32 bg-white/5" /></div></div></div>;
}

export default function AegisLayout({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (loading) return <LoadingWorkspace />;
  if (!user) return <AuthGate />;

  return (
    <div className="min-h-screen bg-[#07111c] text-slate-100">
      <div className="pointer-events-none fixed inset-0 aegis-grid opacity-40" />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col border-r border-white/[0.07] bg-[#09131f]/90 backdrop-blur-xl lg:flex"><NavContent /></aside>
      <header className="fixed inset-x-0 top-0 z-20 flex h-16 items-center justify-between border-b border-white/[0.07] bg-[#07111c]/80 px-4 backdrop-blur-xl lg:left-[252px] lg:px-8">
        <button onClick={() => setDrawerOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-white/[0.05] lg:hidden" aria-label="Open navigation"><Menu size={19} /></button>
        <div className="hidden items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500 sm:flex"><Activity size={13} className="text-emerald-400" /> Workspace secure</div>
        <div className="flex items-center gap-3"><span className="hidden rounded-full border border-sky-300/15 bg-sky-400/[0.06] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-sky-200 sm:block">Allowlist first</span><Link href="/portfolio" className="text-xs text-slate-400 transition-colors hover:text-sky-300">Portfolio</Link></div>
      </header>
      {drawerOpen && <div className="fixed inset-0 z-40 lg:hidden"><button className="absolute inset-0 bg-slate-950/70" onClick={() => setDrawerOpen(false)} aria-label="Close navigation overlay" /><aside className="relative flex h-full w-[272px] flex-col border-r border-white/[0.07] bg-[#09131f] shadow-2xl"><button onClick={() => setDrawerOpen(false)} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-white/[0.06]" aria-label="Close navigation"><X size={16} /></button><NavContent onNavigate={() => setDrawerOpen(false)} /></aside></div>}
      <main className="relative min-h-screen px-4 pb-10 pt-24 sm:px-7 lg:ml-[252px] lg:px-10">{children}</main>
    </div>
  );
}

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="mb-8 flex flex-col gap-5 border-b border-white/[0.07] pb-7 lg:flex-row lg:items-end lg:justify-between"><div><p className="font-mono text-[11px] uppercase tracking-[0.2em] text-sky-300">{eyebrow}</p><h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">{description}</p></div>{action}</div>;
}
