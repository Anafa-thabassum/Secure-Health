"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Bell, BookOpenCheck, ChevronDown, ChevronLeft, ChevronRight, CircleUserRound, ClipboardCheck, Database, FileClock, FileKey2, FileText, HeartPulse, KeyRound, LayoutDashboard, LockKeyhole, LogOut, Menu, Moon, Network, Search, Settings, ShieldAlert, ShieldCheck, Siren, Stethoscope, Sun, UserRoundCog, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SecurityTimeline, StatusBadge } from "./security-ui";

type Role = "patient" | "doctor" | "admin";
type NavItem = { label: string; href: string; icon: React.ComponentType<{ className?: string }> };

const nav: Record<Role, { section: string; items: NavItem[] }[]> = {
  patient: [
    { section: "Workspace", items: [{ label: "Overview", href: "/patient/dashboard", icon: LayoutDashboard }, { label: "Health records", href: "/patient/records", icon: FileText }, { label: "Lab results", href: "/patient/labs", icon: Activity }, { label: "Prescriptions", href: "/patient/prescriptions", icon: ClipboardCheck }, { label: "Appointments", href: "/patient/appointments", icon: Stethoscope }] },
    { section: "Privacy", items: [{ label: "Consent center", href: "/patient/consent", icon: KeyRound }, { label: "Security activity", href: "/patient/security", icon: ShieldCheck }, { label: "Profile", href: "/patient/profile", icon: CircleUserRound }] },
  ],
  doctor: [
    { section: "Clinical", items: [{ label: "Overview", href: "/doctor/dashboard", icon: LayoutDashboard }, { label: "Patients", href: "/doctor/patients", icon: Users }, { label: "Records", href: "/doctor/records", icon: FileText }, { label: "Labs", href: "/doctor/labs", icon: Activity }, { label: "Prescriptions", href: "/doctor/prescriptions", icon: ClipboardCheck }, { label: "Appointments", href: "/doctor/appointments", icon: Stethoscope }] },
    { section: "Authorization", items: [{ label: "Access requests", href: "/doctor/access-requests", icon: LockKeyhole }, { label: "Consent visibility", href: "/doctor/consent", icon: KeyRound }] },
  ],
  admin: [
    { section: "Security operations", items: [{ label: "Command center", href: "/admin/dashboard", icon: LayoutDashboard }, { label: "Security center", href: "/admin/security", icon: ShieldCheck }, { label: "Live events", href: "/admin/security-events", icon: Activity }, { label: "Sentinel", href: "/admin/sentinel", icon: Siren }] },
    { section: "Trust controls", items: [{ label: "Audit history", href: "/admin/audit", icon: FileClock }, { label: "Audit integrity", href: "/admin/integrity", icon: FileKey2 }, { label: "Break-glass", href: "/admin/emergency", icon: ShieldAlert }, { label: "FHIR gateway", href: "/admin/fhir", icon: Network }, { label: "Policies", href: "/admin/policies", icon: BookOpenCheck }] },
    { section: "Administration", items: [{ label: "Users", href: "/admin/users", icon: Users }, { label: "Roles", href: "/admin/roles", icon: UserRoundCog }, { label: "Access queue", href: "/admin/access-requests", icon: LockKeyhole }, { label: "System health", href: "/admin/system-health", icon: HeartPulse }] },
  ],
};

const roleIdentity = {
  patient: { name: "Avery Morgan", role: "Patient", initials: "AM", org: "Northstar Health Network" },
  doctor: { name: "Dr. Maya Chen", role: "Cardiologist", initials: "MC", org: "Northstar Medical" },
  admin: { name: "Morgan Reyes", role: "Security Administrator", initials: "MR", org: "Northstar Health Network" },
};

function Brand({ collapsed = false }: { collapsed?: boolean }) { return <a href="/" className="flex h-16 items-center gap-3 px-4" aria-label="SecureHealth home"><span className="grid size-8 shrink-0 place-items-center rounded-md border border-primary/35 bg-primary/10 text-primary"><ShieldCheck className="size-[18px]"/></span>{!collapsed && <span><span className="block text-sm font-bold tracking-[.17em]">SECUREHEALTH</span><span className="block text-[9px] font-semibold tracking-[.12em] text-muted-foreground">ZERO-TRUST EHR</span></span>}</a>; }

function Navigation({ role, path, collapsed = false, onNavigate }: { role: Role; path: string; collapsed?: boolean; onNavigate?: () => void }) {
  return <nav className="flex-1 overflow-y-auto px-2 pb-5" aria-label={`${role} navigation`}>{nav[role].map((group) => <div key={group.section} className="mt-5">{!collapsed && <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">{group.section}</p>}<div className="space-y-1">{group.items.map((item) => { const active = path === item.href || (item.href !== `/${role}/dashboard` && path.startsWith(item.href)); const Icon = item.icon; return <a key={item.href} href={item.href} onClick={onNavigate} title={collapsed ? item.label : undefined} className={cn("flex h-10 items-center gap-3 rounded-md px-2.5 text-sm font-medium transition-colors", active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-muted/55 hover:text-foreground", collapsed && "justify-center px-0")}><Icon className="size-[17px] shrink-0"/>{!collapsed && <span className="truncate">{item.label}</span>}{active && !collapsed && <span className="ml-auto size-1.5 rounded-full bg-primary"/>}</a>; })}</div></div>)}</nav>;
}

export function AppShell({ role, path, children }: { role: Role; path: string; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false); const [profileOpen, setProfileOpen] = useState(false); const [theme, setTheme] = useState<"dark"|"light">("dark"); const [search, setSearch] = useState("");
  const identity = roleIdentity[role];
  useEffect(() => { document.documentElement.classList.toggle("dark", theme === "dark"); }, [theme]);
  const searchItems = useMemo(() => nav[role].flatMap((g) => g.items).filter((item) => item.label.toLowerCase().includes(search.toLowerCase())), [role, search]);
  return <div className="min-h-screen bg-background text-foreground">
    <aside className={cn("fixed inset-y-0 left-0 z-40 hidden border-r bg-sidebar transition-[width] duration-200 lg:flex lg:flex-col", collapsed ? "w-[72px]" : "w-[244px]")}>
      <Brand collapsed={collapsed}/><Navigation role={role} path={path} collapsed={collapsed}/><div className="border-t p-2"><button onClick={() => setCollapsed(!collapsed)} className="flex h-9 w-full items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <ChevronRight className="size-4"/> : <><ChevronLeft className="mr-2 size-4"/><span className="text-xs">Collapse sidebar</span></>}</button></div>
    </aside>
    <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-[72px]" : "lg:pl-[244px]")}>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/92 px-4 backdrop-blur-md sm:px-6">
        <Sheet><SheetTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation"><Menu className="size-5"/></Button></SheetTrigger><SheetContent side="left" className="w-[286px] p-0"><SheetHeader className="sr-only"><SheetTitle>Navigation</SheetTitle><SheetDescription>SecureHealth sections</SheetDescription></SheetHeader><Brand/><Navigation role={role} path={path}/></SheetContent></Sheet>
        <Dialog onOpenChange={(open)=>!open&&setSearch("")}><DialogTrigger asChild><button className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border bg-card px-3 text-left text-sm text-muted-foreground hover:border-primary/35 sm:max-w-md"><Search className="size-4"/><span className="truncate">Search patients, events, requests…</span><kbd className="ml-auto hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:block">⌘ K</kbd></button></DialogTrigger><DialogContent className="top-[34%] gap-0 p-0 sm:max-w-xl"><DialogHeader className="sr-only"><DialogTitle>Global search</DialogTitle><DialogDescription>Search SecureHealth</DialogDescription></DialogHeader><div className="border-b p-3"><Input autoFocus value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search SecureHealth…" className="h-11 border-0 bg-muted/60 shadow-none"/></div><div className="p-2"><p className="px-2 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">{search?"Matching destinations":"Quick destinations"}</p>{searchItems.slice(0,6).map((item)=><a key={item.href} href={item.href} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-muted"><item.icon className="size-4 text-muted-foreground"/>{item.label}<ChevronRight className="ml-auto size-4 text-muted-foreground"/></a>)}{searchItems.length===0&&<p className="px-3 py-6 text-center text-sm text-muted-foreground">No matching workspace destinations.</p>}</div></DialogContent></Dialog>
        <a href="/admin/security" className="ml-auto hidden items-center gap-2 rounded-md border border-emerald-500/25 bg-emerald-500/8 px-3 py-2 sm:flex"><span className="size-1.5 rounded-full bg-emerald-400"/><span className="text-[10px] font-bold tracking-[.09em] text-emerald-400">SYSTEM SECURE</span></a>
        <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="grid size-9 place-items-center rounded-md border bg-card text-muted-foreground hover:text-foreground" aria-label="Switch color theme">{theme === "dark" ? <Sun className="size-4"/> : <Moon className="size-4"/>}</button>
        <Sheet><SheetTrigger asChild><button className="relative grid size-9 place-items-center rounded-md border bg-card text-muted-foreground hover:text-foreground" aria-label="Open notifications"><Bell className="size-4"/><span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-red-400 ring-2 ring-card"/></button></SheetTrigger><SheetContent className="w-full p-0 sm:max-w-md"><SheetHeader className="border-b p-5"><SheetTitle>Security notifications</SheetTitle><SheetDescription>Live authorization and integrity activity</SheetDescription></SheetHeader><SecurityTimeline/></SheetContent></Sheet>
        <div className="relative"><button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 rounded-md p-1.5 hover:bg-muted" aria-expanded={profileOpen}><span className="grid size-8 place-items-center rounded-md bg-primary/15 text-xs font-bold text-primary">{identity.initials}</span><span className="hidden text-left xl:block"><span className="block text-xs font-semibold">{identity.name}</span><span className="block text-[10px] text-muted-foreground">{identity.role}</span></span><ChevronDown className="hidden size-3.5 text-muted-foreground xl:block"/></button>{profileOpen && <div className="absolute right-0 top-12 z-50 w-64 rounded-lg border bg-popover p-2 shadow-xl"><div className="border-b px-3 py-2"><p className="text-sm font-semibold">{identity.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{identity.org}</p></div><a href={`/${role}/profile`} className="mt-1 flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"><Settings className="size-4"/>Account settings</a><a href="/login" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-red-400 hover:bg-red-500/8"><LogOut className="size-4"/>Sign out</a></div>}</div>
      </header>
      <div className="min-w-0">{children}</div>
    </div>
  </div>;
}

export function PageHeader({ eyebrow, title, subtitle, actions, status }: { eyebrow?: string; title: string; subtitle: string; actions?: React.ReactNode; status?: React.ReactNode }) {
  return <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div>{eyebrow && <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground"><a href="/" className="hover:text-foreground">SecureHealth</a><ChevronRight className="size-3"/>{eyebrow}</p>}<div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-semibold tracking-[-.025em] sm:text-[28px]">{title}</h1>{status}</div><p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">{subtitle}</p></div>{actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}</div>;
}
