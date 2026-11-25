import { useEffect, useState, type ReactNode } from "react";
import { LayoutDashboard, FileText, CreditCard, CalendarDays, BookOpen, ClipboardCheck, BarChart3, Award, Bell, LogOut, Download, PlayCircle, Lock, FileDown, CheckCircle2 } from "lucide-react";
import { Button, Container } from "../components/ui";
import { cn } from "../utils/cn";
import { daysUntil, fmtDate, getProgramme, money } from "../data";
import { useStore, type Application } from "../store";
import { downloadReceipt } from "../receipt";
import { navigate } from "../router";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "applications", label: "Applications", icon: FileText },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "schedule", label: "Schedule", icon: CalendarDays },
  { id: "materials", label: "Materials", icon: BookOpen },
  { id: "attendance", label: "Attendance", icon: ClipboardCheck },
  { id: "results", label: "Results", icon: BarChart3 },
  { id: "certificates", label: "Certificates", icon: Award },
  { id: "notifications", label: "Notifications", icon: Bell },
] as const;
type Tab = (typeof tabs)[number]["id"];

const statusStyle = (s: string) => (s === "Paid" ? "bg-emerald-100 text-emerald-800" : s === "Approved" ? "bg-blue-100 text-blue-800" : s === "Rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800");
const statusLabel = (s: Application["status"]) => (s === "Submitted" ? "Awaiting review" : s === "Approved" ? "Approved · awaiting payment" : s === "Rejected" ? "Not approved" : s);

const Card = ({ title, children, className, action }: { title?: string; children: ReactNode; className?: string; action?: ReactNode }) => (
  <div className={cn("rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", className)}>
    {(title || action) && <div className="mb-4 flex items-center justify-between gap-3">{title && <h3 className="text-2xl font-bold uppercase text-navy-900">{title}</h3>}{action}</div>}
    {children}
  </div>
);
const Empty = ({ icon: I, title, text, cta }: { icon: typeof Award; title: string; text: string; cta?: ReactNode }) => (
  <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white px-6 py-14 text-center">
    <I className="mx-auto h-10 w-10 text-slate-400" />
    <h3 className="mt-3 text-2xl font-bold uppercase text-navy-900">{title}</h3>
    <p className="mx-auto mt-1 max-w-sm text-slate-600">{text}</p>
    {cta && <div className="mt-5">{cta}</div>}
  </div>
);

export default function Portal() {
  const { user, authReady, myApplications, batches, logOut } = useStore();
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (!authReady) return;
    if (!user) navigate("/login");
    else if (user.role === "admin") navigate("/admin");
  }, [authReady, user]);
  if (!authReady || !user || user.role !== "student") return null;

  const active = myApplications.find((a) => a.status === "Paid") ?? myApplications[0];
  const activePaid = active?.status === "Paid";
  const prog = active ? getProgramme(active.programme) : undefined;
  const batch = active ? batches.find((item) => item.id === active.batch) : undefined;

  const notifications = [
    ...myApplications.flatMap((a) => {
      const p = getProgramme(a.programme)?.title;
      const items = [{ t: `Application ${a.id} received`, d: `Your application for ${p} was submitted.`, at: a.createdAt, icon: FileText }];
      if (a.payment) items.push({ t: "Payment confirmed", d: `We received ${money(a.payment.amount)} (${a.payment.reference}).`, at: a.payment.paidAt, icon: CreditCard });
      if (a.status === "Approved") items.push({ t: "Application approved", d: "Check your email or WhatsApp for the secure payment link from admissions.", at: a.createdAt, icon: CheckCircle2 });
      if (a.status === "Rejected") items.push({ t: "Application not approved", d: "Contact admissions if you need more information.", at: a.createdAt, icon: FileText });
      return items;
    }),
    { t: "Welcome to the Student Portal", d: "Track your applications, payments and training here.", at: new Date(Date.now() - 20 * 86400000).toISOString(), icon: Bell },
  ].sort((a, b) => b.at.localeCompare(a.at));

  const pendingApp = myApplications.find((a) => a.status === "Submitted" || a.status === "Approved");

  const body = (() => {
    switch (tab) {
      case "overview":
        return (
          <div className="space-y-5">
            {pendingApp && (
              <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-bold text-amber-900">{pendingApp.status === "Submitted" ? "Application under review" : `Application approved for ${getProgramme(pendingApp.programme)?.title}`}</div>
                  <div className="text-sm text-amber-800">{pendingApp.status === "Submitted" ? "Admissions will contact you after reviewing your application." : "Use the secure payment link sent to your email or WhatsApp. Payment is not available from this portal."}</div>
                </div>
              </div>
            )}
            {active && prog && batch ? (
              <Card className="overflow-hidden p-0">
                <div className="relative">
                  <img src={prog.image} alt="" className="h-40 w-full object-cover sm:h-48" />
                  <div className="absolute inset-0 bg-linear-to-t from-navy-950/90 to-navy-900/20" />
                  <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-5 text-white">
                    <div><div className="text-xs font-bold uppercase tracking-wider text-red-300">Current programme</div><div className="font-display text-4xl font-extrabold uppercase">{prog.title}</div></div>
                    <span className={cn("rounded-full px-3 py-1 text-xs font-bold", statusStyle(active.status))}>{statusLabel(active.status)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-4">
                  {[["Batch", batch.id], ["Starts", fmtDate(batch.start)], ["Duration", prog.duration], ["Countdown", daysUntil(batch.start) > 0 ? `${daysUntil(batch.start)} days` : "In progress"]].map(([l, v]) => (
                    <div key={l} className="bg-white p-4"><div className="text-xs font-semibold uppercase text-slate-500">{l}</div><div className="font-display text-2xl font-bold text-navy-900">{v}</div></div>
                  ))}
                </div>
              </Card>
            ) : (
              <Empty icon={FileText} title="No applications yet" text="Start your first application to begin your operator training journey." cta={<Button to="/register" arrow>Apply now</Button>} />
            )}
            <div className="grid gap-5 md:grid-cols-3">
              {[
                [FileText, "Applications", myApplications.length, "applications"],
                [CreditCard, "Payments", myApplications.filter((a) => a.payment).length, "payments"],
                [Bell, "Notifications", notifications.length, "notifications"],
              ].map(([I, l, n, t]) => {
                const Ic = I as typeof Bell;
                return (
                  <button key={l as string} onClick={() => setTab(t as Tab)} className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-red hover:shadow-lg">
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-navy-900 text-white transition group-hover:bg-brand-red"><Ic className="h-6 w-6" /></span>
                    <span><span className="block font-display text-4xl font-extrabold leading-none text-navy-900">{n as number}</span><span className="text-sm font-semibold text-slate-600">{l as string}</span></span>
                  </button>
                );
              })}
            </div>
            <Card title="Latest updates">
              <ul className="divide-y divide-slate-100">
                {notifications.slice(0, 3).map((n) => <li key={n.t + n.at} className="flex gap-3 py-3"><n.icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-red" /><div><div className="font-semibold text-navy-900">{n.t}</div><div className="text-sm text-slate-600">{n.d}</div></div></li>)}
              </ul>
            </Card>
          </div>
        );

      case "applications":
        return myApplications.length ? (
          <div className="space-y-4">
            {myApplications.map((a) => {
              const p = getProgramme(a.programme)!;
              return (
                <Card key={a.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <img src={p.image} alt="" className="h-16 w-16 rounded-xl object-cover" />
                      <div><div className="font-display text-2xl font-bold uppercase text-navy-900">{p.title}</div><div className="text-sm text-slate-600">{a.id} · Batch {a.batch} · Applied {fmtDate(a.createdAt.slice(0, 10))}</div></div>
                    </div>
                    <div className="flex items-center gap-3"><span className={cn("rounded-full px-3 py-1 text-xs font-bold", statusStyle(a.status))}>{statusLabel(a.status)}</span></div>
                  </div>
                  {a.status === "Rejected" ? (
                    <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">This application was not approved. Contact admissions if you need guidance.</p>
                  ) : (
                    <ol className="mt-5 grid grid-cols-4 gap-2 text-center text-[11px] font-bold uppercase tracking-wide sm:text-xs">
                      {["Submitted", "Approved", "Paid", "Started"].map((s, i) => {
                        const applicationBatch = batches.find((item) => item.id === a.batch);
                        const level = a.status === "Submitted" ? 0 : a.status === "Approved" ? 1 : applicationBatch && daysUntil(applicationBatch.start) > 0 ? 2 : 3;
                        return <li key={s}><div className={cn("mb-1.5 h-1.5 rounded-full", i <= level ? "bg-brand-red" : "bg-slate-200")} /><span className={i <= level ? "text-navy-900" : "text-slate-400"}>{s}</span></li>;
                      })}
                    </ol>
                  )}
                </Card>
              );
            })}
            <Button to="/register" variant="outlineDark">+ New application</Button>
          </div>
        ) : <Empty icon={FileText} title="No applications" text="You haven't applied for a programme yet." cta={<Button to="/register">Apply now</Button>} />;

      case "payments": {
        const paidApps = myApplications.filter((a) => a.payment);
        return paidApps.length || pendingApp ? (
          <div className="space-y-4">
            {pendingApp && <Card><div><div className="font-bold text-navy-900">{getProgramme(pendingApp.programme)?.title}</div><div className="text-sm text-slate-600">{pendingApp.id} · {pendingApp.status === "Submitted" ? "Awaiting admin review" : "Approved — payment link sent by admissions"}</div></div></Card>}
            {paidApps.map((a) => (
              <Card key={a.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                <div><div className="font-bold text-navy-900">{getProgramme(a.programme)?.title}</div><div className="text-sm text-slate-600">{a.payment!.reference} · {a.payment!.method} · {fmtDate(a.payment!.paidAt.slice(0, 10))}</div></div>
                <div className="flex items-center gap-4"><div className="text-right"><div className="font-display text-3xl font-extrabold text-navy-900">{money(a.payment!.amount)}</div><span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">Paid</span></div><Button size="sm" variant="navy" onClick={() => downloadReceipt(a, batches.find((item) => item.id === a.batch))}><Download className="h-4 w-4" />Receipt</Button></div>
                </div>
              </Card>
            ))}
          </div>
        ) : <Empty icon={CreditCard} title="No payments yet" text="Payments for your applications will appear here, with downloadable receipts." />;
      }

      case "schedule": {
        if (!activePaid || !prog || !batch) return <Empty icon={CalendarDays} title="Schedule unavailable" text="Your class timetable appears here once your payment is confirmed." />;
        const start = new Date(batch.start + "T12:00:00");
        const weeks = parseInt(prog.duration);
        return (
          <Card title={`${prog.title} — timetable`}>
            <p className="mb-4 text-sm text-slate-600">{batch.mode} · {batch.campus} · Classes begin {fmtDate(batch.start)}. Daily sessions run 8:00 AM – 3:00 PM{batch.mode === "Weekend" ? " on Saturdays and Sundays" : ", Monday to Friday"}.</p>
            <ul className="divide-y divide-slate-100">
              {Array.from({ length: Math.min(weeks, 12) }).map((_, i) => {
                const d = new Date(start); d.setDate(d.getDate() + i * 7);
                const m = prog.outline[Math.min(Math.floor((i / weeks) * prog.outline.length), prog.outline.length - 1)];
                return <li key={i} className="flex items-center gap-4 py-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-navy-900 text-center font-display text-sm font-bold leading-tight text-white">WK<br />{i + 1}</span><div><div className="font-semibold text-navy-900">{m.module}</div><div className="text-sm text-slate-500">Week of {fmtDate(d.toISOString().slice(0, 10))}</div></div></li>;
              })}
            </ul>
          </Card>
        );
      }

      case "materials": {
        if (!activePaid || !prog) return <Empty icon={Lock} title="Materials locked" text="Learning materials unlock as soon as your payment is verified." />;
        return (
          <Card title="Learning materials">
            <ul className="divide-y divide-slate-100">
              {prog.outline.map((m, i) => (
                <li key={m.module} className="flex items-center gap-3 py-3.5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-navy-50 text-brand-red">{i % 2 ? <PlayCircle className="h-5 w-5" /> : <FileDown className="h-5 w-5" />}</span>
                  <div className="min-w-0 flex-1"><div className="truncate font-semibold text-navy-900">Module {i + 1}: {m.module}</div><div className="text-xs text-slate-500">{i % 2 ? "Video lesson · 24 min" : "PDF handbook · 18 pages"}</div></div>
                  <Button size="sm" variant="ghost">{i % 2 ? "Watch" : "Download"}</Button>
                </li>
              ))}
            </ul>
          </Card>
        );
      }

      case "attendance":
        return <Empty icon={ClipboardCheck} title="No attendance yet" text={activePaid && batch ? `Attendance is recorded once classes begin on ${fmtDate(batch.start)}.` : "Attendance records appear after your training starts."} />;

      case "results":
        return <Empty icon={BarChart3} title="No results yet" text="Assessment results will be published here after your modules are graded." />;

      case "certificates":
        return <Empty icon={Award} title="No certificates yet" text="Your certificate will be available to download after you successfully complete your programme." />;

      case "notifications":
        return (
          <Card title="Notifications">
            <ul className="divide-y divide-slate-100">
              {notifications.map((n) => <li key={n.t + n.at} className="flex gap-3 py-3.5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-navy-50 text-brand-red"><n.icon className="h-5 w-5" /></span><div className="flex-1"><div className="font-semibold text-navy-900">{n.t}</div><div className="text-sm text-slate-600">{n.d}</div></div><span className="shrink-0 text-xs text-slate-400">{fmtDate(n.at.slice(0, 10))}</span></li>)}
            </ul>
          </Card>
        );
    }
  })();

  return (
    <div className="min-h-screen bg-navy-50">
      <div className="bg-navy-900 pb-8 pt-28 text-white sm:pt-36 sm:pb-10">
        <Container className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-red font-display text-2xl font-bold">{user.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}</span>
            <div><div className="text-sm text-navy-200">Student Portal</div><h1 className="text-4xl font-extrabold uppercase sm:text-5xl">Welcome, {user.name.split(" ")[0]}</h1></div>
          </div>
          <div className="flex gap-3"><Button to="/register" size="sm">New application</Button><Button variant="outline" size="sm" onClick={() => void logOut().then(() => navigate("/")).catch(() => undefined)}><LogOut className="h-4 w-4" />Log out</Button></div>
        </Container>
      </div>
      <Container className="grid gap-6 py-6 lg:grid-cols-[230px_1fr] lg:py-10">
        <nav aria-label="Portal" className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:sticky lg:top-28 lg:mx-0 lg:flex-col lg:self-start lg:overflow-visible lg:rounded-2xl lg:bg-white lg:p-3 lg:shadow-sm">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn("flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition", tab === t.id ? "bg-navy-900 text-white shadow" : "bg-white text-navy-900 hover:bg-navy-100 lg:bg-transparent")}>
              <t.icon className="h-4 w-4" />{t.label}
            </button>
          ))}
        </nav>
        <div key={tab} className="animate-fade-up min-w-0">{body}</div>
      </Container>
    </div>
  );
}
