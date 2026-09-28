"use client";
import { useEffect } from "react";
import { AppShell } from "./app-shell";
import { ForgotPasswordPage, LoginPage, RegisterPage } from "./auth-pages";
import { AdminDashboard, DoctorDashboard, PatientDashboard } from "./dashboard-pages";
import { AccessRequestPage, AuditPage, ConsentCenterPage, IntegrityPage, SecurityCenterPage } from "./core-pages";
import { DemoPage, EmergencyPage, FHIRPage, GenericPage, SentinelPage } from "./operations-pages";

const titles: Record<string,string> = {
  "/patient/profile":"Profile", "/patient/records":"Records", "/patient/labs":"Labs", "/patient/prescriptions":"Prescriptions", "/patient/appointments":"Appointments", "/patient/security":"Security activity",
  "/doctor/patients":"Patients", "/doctor/records":"Records", "/doctor/labs":"Labs", "/doctor/prescriptions":"Prescriptions", "/doctor/appointments":"Appointments", "/doctor/consent":"Consent visibility",
  "/admin/users":"Users", "/admin/roles":"Roles", "/admin/access-requests":"Access queue", "/admin/security-events":"Live security events", "/admin/policies":"Policies", "/admin/system-health":"System health",
};

function PatientRoutes({path}:{path:string}){if(path==="/patient/dashboard")return <PatientDashboard/>;if(path==="/patient/consent")return <ConsentCenterPage/>;return <GenericPage role="patient" section={path.startsWith("/patient/records/")?"Record detail":titles[path]||"Patient workspace"} path={path}/>}
function DoctorRoutes({path}:{path:string}){if(path==="/doctor/dashboard")return <DoctorDashboard/>;if(path==="/doctor/access-requests")return <AccessRequestPage/>;return <GenericPage role="doctor" section={path.startsWith("/doctor/patients/")?"Patient access workflow":titles[path]||"Clinical workspace"} path={path}/>}
function AdminRoutes({path}:{path:string}){if(path==="/admin/dashboard")return <AdminDashboard/>;if(path==="/admin/security")return <SecurityCenterPage/>;if(path==="/admin/audit")return <AuditPage/>;if(path.startsWith("/admin/audit/"))return <AuditPage detailId={path.split("/").at(-1)}/>;if(path==="/admin/integrity")return <IntegrityPage/>;if(path==="/admin/emergency")return <EmergencyPage/>;if(path==="/admin/sentinel")return <SentinelPage/>;if(path==="/admin/fhir")return <FHIRPage/>;return <GenericPage role="admin" section={titles[path]||"Security administration"} path={path}/>}

export function SecureHealthApp({ path }: { path: string }) {
  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: unknown) => Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => undefined);
    void register({
      name: "read_security_workspace",
      title: "Read security workspace",
      description: "Return the current SecureHealth route and represented user role without changing application state.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: () => ({ path, role: path.startsWith("/patient") ? "patient" : path.startsWith("/doctor") ? "doctor" : "administrator", systemStatus: "secure" }),
    });
    void register({
      name: "open_security_demo",
      title: "Open security demo",
      description: "Navigate to SecureHealth Security Demo Mode where controlled authorization and integrity scenarios can be run.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: () => { window.location.assign("/demo"); return { destination: "/demo", status: "navigating" }; },
    });
    return () => lifecycle.abort();
  }, [path]);
  if(path==="/login")return <LoginPage/>; if(path==="/register")return <RegisterPage/>; if(path==="/forgot-password")return <ForgotPasswordPage/>; if(path==="/demo")return <AppShell role="admin" path="/demo"><DemoPage/></AppShell>;
  const role=path.startsWith("/patient")?"patient":path.startsWith("/doctor")?"doctor":"admin";
  return <AppShell role={role} path={path}>{role==="patient"?<PatientRoutes path={path}/>:role==="doctor"?<DoctorRoutes path={path}/>:<AdminRoutes path={path}/>}</AppShell>;
}
