"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, ArrowDown, Check, CheckCircle2, Clock3, Database, FileKey2, Fingerprint, Gauge, KeyRound, LockKeyhole, Network, ShieldAlert, ShieldCheck, Siren, X, XCircle } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { accessSeries, consentSeries, mockSecurityEvents } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

export type Tone = "success" | "warning" | "critical" | "info" | "neutral";
const toneStyles: Record<Tone, string> = {
  success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
  warning: "border-amber-500/25 bg-amber-500/10 text-amber-400",
  critical: "border-red-500/25 bg-red-500/10 text-red-400",
  info: "border-blue-500/25 bg-blue-500/10 text-blue-400",
  neutral: "border-border bg-muted/55 text-muted-foreground",
};

export function StatusBadge({ children, tone = "neutral", pulse = false }: { children: React.ReactNode; tone?: Tone; pulse?: boolean }) {
  return <span className={cn("inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[10px] font-bold uppercase tracking-[.1em]", toneStyles[tone])}><span className={cn("size-1.5 rounded-full bg-current", pulse && "animate-pulse")} />{children}</span>;
}

export function Panel({ children, className, title, description, action }: { children: React.ReactNode; className?: string; title?: string; description?: string; action?: React.ReactNode }) {
  return <section className={cn("overflow-hidden rounded-lg border bg-card", className)}>{(title || action) && <header className="flex items-start justify-between gap-4 border-b px-4 py-4 sm:px-5"><div>{title && <h2 className="text-sm font-semibold">{title}</h2>}{description && <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>}</div>{action}</header>}<div>{children}</div></section>;
}

export function SecurityMetric({ label, value, change, tone = "neutral", icon: Icon = Activity }: { label: string; value: string; change: string; tone?: Tone; icon?: React.ComponentType<{ className?: string }> }) {
  return <div className="rounded-lg border bg-card p-4"><div className="flex items-start justify-between"><span className="text-xs font-medium text-muted-foreground">{label}</span><span className={cn("grid size-8 place-items-center rounded-md border", toneStyles[tone])}><Icon className="size-4" /></span></div><p className="mt-4 text-2xl font-semibold tracking-tight">{value}</p><p className={cn("mt-1 text-xs", tone === "neutral" ? "text-muted-foreground" : toneStyles[tone].split(" ").at(-1))}>{change}</p></div>;
}

const pipelineChecks = ["IDENTITY", "RBAC", "ABAC", "CONSENT", "RESOURCE", "PURPOSE"];
export function AuthorizationPipeline({ denied = [], running = false, compact = false }: { denied?: string[]; running?: boolean; compact?: boolean }) {
  const [visible, setVisible] = useState(running ? 0 : pipelineChecks.length);
  useEffect(() => { if (!running) { setVisible(pipelineChecks.length); return; } setVisible(0); const timer = setInterval(() => setVisible((n) => n >= pipelineChecks.length ? n : n + 1), 360); return () => clearInterval(timer); }, [running]);
  const isDenied = pipelineChecks.some((item) => denied.includes(item));
  return <div aria-live="polite" className={cn("space-y-2", compact && "space-y-1.5")}>{pipelineChecks.map((item, index) => {
    const fail = denied.includes(item); const shown = visible > index;
    return <div key={item} className={cn("flex items-center gap-3 rounded-md border px-3 transition-all duration-300", compact ? "py-2" : "py-3", shown ? "translate-y-0 opacity-100" : "translate-y-1 opacity-35", fail ? "border-red-500/30 bg-red-500/8" : shown ? "border-emerald-500/20 bg-emerald-500/5" : "bg-muted/25")}><span className={cn("grid size-6 place-items-center rounded-full border", fail ? "border-red-500/30 text-red-400" : shown ? "border-emerald-500/30 text-emerald-400" : "border-border text-muted-foreground")}>{fail ? <X className="size-3.5" /> : shown ? <Check className="size-3.5" /> : <span className="size-1.5 animate-pulse rounded-full bg-current" />}</span><span className="text-xs font-bold tracking-[.1em]">{item}</span><span className={cn("ml-auto text-[10px] font-semibold", fail ? "text-red-400" : shown ? "text-emerald-400" : "text-muted-foreground")}>{fail ? "FAILED" : shown ? (item === "ABAC" ? "CONTEXT ELIGIBLE" : item === "CONSENT" ? "ACTIVE" : item === "IDENTITY" ? "VERIFIED" : "PERMITTED") : "PENDING"}</span></div>;
  })}<div className={cn("mt-4 flex items-center justify-between rounded-md border p-4", isDenied ? "border-red-500/35 bg-red-500/10" : visible === pipelineChecks.length ? "border-emerald-500/35 bg-emerald-500/10" : "border-blue-500/25 bg-blue-500/10")}><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">Final decision</p><p className={cn("mt-1 text-sm font-bold", isDenied ? "text-red-400" : visible === pipelineChecks.length ? "text-emerald-400" : "text-blue-400")}>{isDenied ? "✕ ACCESS DENIED" : visible === pipelineChecks.length ? "✓ ACCESS GRANTED" : "EVALUATION IN PROGRESS"}</p></div>{visible === pipelineChecks.length && <span className="font-mono text-[11px] text-muted-foreground">86.2 ms</span>}</div></div>;
}

export function DecisionChart() {
  return <div className="h-[248px] w-full p-4"><ResponsiveContainer width="100%" height="100%"><AreaChart data={accessSeries}><defs><linearGradient id="allowed" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--chart-1)" stopOpacity={.35}/><stop offset="1" stopColor="var(--chart-1)" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false}/><XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}/><YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}/><Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} /><Area type="monotone" dataKey="allowed" stroke="var(--chart-1)" strokeWidth={2} fill="url(#allowed)"/><Area type="monotone" dataKey="denied" stroke="var(--chart-4)" strokeWidth={2} fill="transparent"/></AreaChart></ResponsiveContainer></div>;
}

export function ConsentChart() {
  return <div className="h-[248px] w-full p-4"><ResponsiveContainer width="100%" height="100%"><BarChart data={consentSeries} barGap={3}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false}/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}/><YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}/><Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}/><Bar dataKey="granted" fill="var(--chart-2)" radius={[3,3,0,0]} /><Bar dataKey="revoked" fill="var(--chart-3)" radius={[3,3,0,0]} /></BarChart></ResponsiveContainer></div>;
}

export function DecisionDonut() {
  const data = [{ name: "Allowed", value: 4820, color: "var(--chart-2)" }, { name: "Denied", value: 312, color: "var(--chart-4)" }];
  return <div className="relative h-[248px] w-full p-3"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} innerRadius={60} outerRadius={84} paddingAngle={3} dataKey="value">{data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}/></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 grid place-items-center"><div className="text-center"><p className="text-2xl font-semibold">93.9%</p><p className="text-[10px] uppercase tracking-[.12em] text-muted-foreground">Allowed</p></div></div></div>;
}

export function SecurityTimeline({ limit = 5 }: { limit?: number }) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = { success: CheckCircle2, critical: ShieldAlert, warning: AlertTriangle, info: Activity };
  return <div className="divide-y">{mockSecurityEvents.slice(0, limit).map((event, index) => { const Icon = icons[event.tone] ?? Activity; return <div key={`${event.type}-${index}`} className="group flex gap-3 px-4 py-3.5 transition hover:bg-muted/35"><span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-md border", toneStyles[event.tone as Tone])}><Icon className="size-4" /></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className="truncate text-xs font-bold tracking-[.06em]">{event.type}</p><time className="font-mono text-[10px] text-muted-foreground">{event.time}</time></div><p className="mt-1 text-sm font-medium">{event.title}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{event.detail}</p></div></div>; })}</div>;
}

export function HashChain({ tampered = false }: { tampered?: boolean }) {
  const nodes = ["AUD-849201", "AUD-849202", "AUD-849203", "AUD-849204", "AUD-849205"];
  return <div className="overflow-x-auto p-5"><div className="flex min-w-[710px] items-center justify-between">{nodes.map((node, index) => { const bad = tampered && index === 2; const afterBad = tampered && index > 2; return <div key={node} className="contents"><div className={cn("relative w-[116px] rounded-md border p-3 text-center", bad ? "border-red-500/50 bg-red-500/12" : afterBad ? "border-amber-500/40 bg-amber-500/8" : "border-emerald-500/25 bg-emerald-500/7")}><span className={cn("mx-auto mb-2 grid size-7 place-items-center rounded-full border", bad ? "border-red-500/40 text-red-400" : afterBad ? "border-amber-500/40 text-amber-400" : "border-emerald-500/30 text-emerald-400")}>{bad ? <X className="size-4" /> : afterBad ? <AlertTriangle className="size-3.5" /> : <Check className="size-4" />}</span><p className="font-mono text-[10px] font-semibold">{node}</p><p className={cn("mt-1 text-[9px] font-bold uppercase", bad ? "text-red-400" : afterBad ? "text-amber-400" : "text-emerald-400")}>{bad ? "Mismatch" : afterBad ? "Untrusted" : "Verified"}</p></div>{index < nodes.length - 1 && <div className={cn("h-px flex-1", tampered && index >= 2 ? "bg-red-500/45" : "bg-emerald-500/35")}><span className="sr-only">links to next audit event</span></div>}</div>; })}</div></div>;
}

export function IntegritySequence({ tampered = false }: { tampered?: boolean }) {
  const valid = ["EVENTS VERIFIED", "HASH CHAIN VERIFIED", "CHECKPOINT VERIFIED", "SIGNATURE VERIFIED"];
  const invalid = ["EVENT MODIFIED", "HASH RECHECK", "HASH MISMATCH", "CHECKPOINT FAILED", "TAMPERING DETECTED"];
  const steps = tampered ? invalid : valid;
  return <div className="grid gap-2 p-5 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">{steps.slice(0,4).map((step, index) => <div key={step} className="contents"><div className={cn("rounded-md border px-3 py-3 text-center text-[10px] font-bold tracking-[.08em]", tampered ? index > 1 ? toneStyles.critical : toneStyles.warning : toneStyles.success)}>{tampered && index > 1 ? <XCircle className="mx-auto mb-2 size-4" /> : <CheckCircle2 className="mx-auto mb-2 size-4" />}{step}</div>{index < 3 && <ArrowDown className="mx-auto size-4 self-center text-muted-foreground sm:-rotate-90" />}</div>)}</div>;
}

export const securityIcons = { Activity, AlertTriangle, Clock3, Database, FileKey2, Fingerprint, Gauge, KeyRound, LockKeyhole, Network, ShieldAlert, ShieldCheck, Siren };

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) { return <div className="grid min-h-52 place-items-center p-8 text-center"><div><span className="mx-auto grid size-11 place-items-center rounded-lg border bg-muted/40 text-muted-foreground"><Database className="size-5" /></span><h3 className="mt-4 text-sm font-semibold">{title}</h3><p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>{action && <div className="mt-4">{action}</div>}</div></div>; }

export function ErrorState({ onRetry }: { onRetry: () => void }) { return <div role="alert" className="rounded-lg border border-red-500/25 bg-red-500/8 p-5"><div className="flex gap-3"><ShieldAlert className="mt-0.5 size-5 text-red-400"/><div><h3 className="text-sm font-semibold">Security service unavailable</h3><p className="mt-1 text-sm text-muted-foreground">The service did not return a verified state. Protected data remains withheld.</p><Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>Retry verification</Button></div></div></div>; }

export function LoadingState({ rows = 4 }: { rows?: number }) { return <div className="space-y-3 p-5" aria-label="Loading security data" role="status">{Array.from({length: rows}).map((_,i)=><div key={i} className="h-12 animate-pulse rounded-md bg-muted"/>)}<span className="sr-only">Loading</span></div>; }
