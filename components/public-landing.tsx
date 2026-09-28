"use client";
import { useState } from "react";
import { ArrowRight, Check, ChevronRight, Fingerprint, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const layers = [
  ["Authentication", "Verifies the requesting identity and session before policy evaluation."],
  ["RBAC", "Confirms the requester's clinical role permits this class of action."],
  ["ABAC", "Evaluates organization, care relationship, location, time, and risk context."],
  ["Consent Firewall", "Checks patient-granted scope, purpose, organization, and expiry."],
  ["Data Protection", "Releases only the minimum permitted clinical resource."],
  ["Audit", "Writes a traceable decision record with the full authorization rationale."],
  ["Tamper Detection", "Verifies the event chain, checkpoint, and signature state."],
  ["Sentinel", "Monitors decisions for anomalous access patterns and coordinated risk."],
] as const;

export function PublicLanding() {
  const [active, setActive] = useState(3);
  return <main className="min-h-screen overflow-hidden bg-background text-foreground">
    <div className="security-grid relative min-h-screen">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,color-mix(in_srgb,var(--primary)_14%,transparent),transparent_34%),linear-gradient(180deg,transparent_75%,var(--background))]" />
      <header className="relative z-10 mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <a href="/" className="flex items-center gap-3" aria-label="SecureHealth home"><span className="grid size-9 place-items-center rounded-md border border-primary/40 bg-primary/10 text-primary"><ShieldCheck className="size-5" /></span><span><span className="block text-[15px] font-bold tracking-[.18em]">SECUREHEALTH</span><span className="block text-[10px] font-semibold tracking-[.14em] text-muted-foreground">ZERO-TRUST EHR SECURITY</span></span></a>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex" aria-label="Public navigation"><a href="#architecture" className="hover:text-foreground">Architecture</a><a href="#trust" className="hover:text-foreground">Security controls</a><a href="/login" className="hover:text-foreground">Sign in</a></nav>
        <Button asChild size="sm" className="h-9 rounded-md"><a href="/login">Open console <ArrowRight className="size-4" /></a></Button>
      </header>
      <section className="relative z-[1] mx-auto grid max-w-[1440px] gap-14 px-5 pb-16 pt-16 sm:px-8 lg:grid-cols-[.82fr_1.18fr] lg:px-12 lg:pb-24 lg:pt-24">
        <div className="flex flex-col justify-center">
          <div className="mb-7 flex w-fit items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/8 px-3 py-1.5 text-xs font-semibold text-emerald-400"><span className="size-1.5 rounded-full bg-emerald-400" /> All security services operational</div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[.16em] text-primary">Zero-Trust Consent-Aware EHR Security</p>
          <h1 className="max-w-xl text-[clamp(2.8rem,6.4vw,5.8rem)] font-semibold leading-[.94] tracking-[-.055em]">Every record.<br />Every request.<br /><span className="text-muted-foreground">Every reason</span> — verified.</h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">Centralized clinical records protected by layered authorization, patient consent, tamper-evident audit history, and explainable security decisions.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Button asChild size="lg" className="h-12 rounded-md px-5"><a href="#architecture">Explore security architecture <ArrowRight className="size-4" /></a></Button><Button asChild size="lg" variant="outline" className="h-12 rounded-md border-border bg-card/40 px-5"><a href="/demo">View security demo <ChevronRight className="size-4" /></a></Button></div>
          <div id="trust" className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-muted-foreground"><span className="flex items-center gap-2"><Fingerprint className="size-4 text-primary" /> Identity-aware</span><span className="flex items-center gap-2"><LockKeyhole className="size-4 text-primary" /> Consent-enforced</span><span className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Tamper-evident</span></div>
        </div>
        <div id="architecture" className="scan-line relative overflow-hidden rounded-xl border border-border/90 bg-card/82 shadow-[0_24px_80px_rgba(0,0,0,.24)] backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="text-sm font-semibold">Authorization decision path</p><p className="mt-0.5 font-mono text-[11px] text-muted-foreground">REQ-7A91F2 · GET /fhir/Observation/OB-4471</p></div><span className="rounded border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold tracking-[.12em] text-emerald-400">EVALUATING</span></div>
          <div className="grid gap-0 md:grid-cols-[.88fr_1.12fr]">
            <div className="border-b border-border p-3 md:border-b-0 md:border-r">{layers.map(([name], index) => <button key={name} onMouseEnter={() => setActive(index)} onClick={() => setActive(index)} className={`group mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition ${active === index ? "bg-primary/12 text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"}`}><span className={`grid size-6 shrink-0 place-items-center rounded-full border text-[10px] ${index <= active ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-400" : "border-border bg-muted"}`}>{index <= active ? <Check className="size-3.5" /> : index + 1}</span><span className="text-sm font-medium">{name}</span>{index < layers.length - 1 && <span className="ml-auto font-mono text-[10px] opacity-50">0{index + 1}</span>}</button>)}</div>
            <div className="flex min-h-[390px] flex-col justify-between p-6 sm:p-8"><div key={active} className="animate-enter"><p className="font-mono text-[11px] uppercase tracking-[.14em] text-primary">Layer {String(active + 1).padStart(2, "0")}</p><h2 className="mt-3 text-2xl font-semibold tracking-tight">{layers[active][0]}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{layers[active][1]}</p><dl className="mt-8 grid grid-cols-2 gap-5 border-t border-border pt-6 text-xs"><div><dt className="text-muted-foreground">Policy outcome</dt><dd className="mt-1 font-semibold text-emerald-400">PASS</dd></div><div><dt className="text-muted-foreground">Decision latency</dt><dd className="mt-1 font-mono font-semibold">12.4 ms</dd></div><div><dt className="text-muted-foreground">Policy version</dt><dd className="mt-1 font-mono font-semibold">v4.12.8</dd></div><div><dt className="text-muted-foreground">Evidence</dt><dd className="mt-1 font-semibold">3 controls</dd></div></dl></div><div className="mt-8 flex items-center justify-between border-t border-border pt-5"><div><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-muted-foreground">Final decision</p><p className="mt-1 text-sm font-bold text-emerald-400">✓ ACCESS GRANTED</p></div><span className="font-mono text-[11px] text-muted-foreground">86.2 ms</span></div></div>
          </div>
        </div>
      </section>
    </div>
  </main>;
}
