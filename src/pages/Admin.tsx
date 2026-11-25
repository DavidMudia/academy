import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  CheckCircle2, Copy, KeyRound, Loader2, Mail, RefreshCw, ShieldCheck,
  LayoutDashboard, FileText, CalendarClock, X, Trash2, Pencil, Plus,
} from "lucide-react";
import { Button, Container, Field, PageHero, inputCls } from "../components/ui";
import { apiRequest } from "../api";
import { IMG, fmtDate, getProgramme, money, programmes } from "../data";
import { useStore, type BatchWithCounts } from "../store";
import { navigate } from "../router";
import { cn } from "../utils/cn";

type Delivery = {
  email: { status: "sent" | "not_configured" | "failed"; detail?: string };
  whatsapp: { status: "sent" | "not_configured" | "failed"; detail?: string };
};

type AdminApplication = {
  id: string;
  email: string;
  programme: string;
  batch: string;
  status: "Submitted" | "Approved" | "Rejected" | "Paid";
  createdAt: string;
  personal: { firstName: string; lastName: string; dob: string; gender: string; phone: string; address: string; city: string; education: string; nextOfKin: string; nextOfKinPhone: string };
  documents: { id: number; kind: string; fileName: string; mimeType: string; size: number }[];
  payment?: { reference: string; method: string; amount: number; paidAt: string };
  deliveries: { kind: string; channel: string; status: string; detail?: string }[];
};

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "applications", label: "Applications", icon: FileText },
  { id: "batches", label: "Batches", icon: CalendarClock },
] as const;
type Tab = (typeof tabs)[number]["id"];

const statusClass: Record<AdminApplication["status"], string> = {
  Submitted: "bg-amber-100 text-amber-800",
  Approved: "bg-blue-100 text-blue-800",
  Rejected: "bg-red-100 text-red-800",
  Paid: "bg-emerald-100 text-emerald-800",
};

function latestDelivery(application: AdminApplication): Delivery | null {
  const kind = application.status === "Paid" ? "credentials" : application.status === "Rejected" ? "rejection" : "payment_link";
  const email = application.deliveries.find((d) => d.kind === kind && d.channel === "email");
  const whatsapp = application.deliveries.find((d) => d.kind === kind && d.channel === "whatsapp");
  if (!email && !whatsapp) return null;
  const s = (x?: { status: string; detail?: string }) => ({
    status: x?.status === "sent" || x?.status === "failed" ? x.status : "not_configured",
    detail: x?.detail,
  }) as Delivery["email"];
  return { email: s(email), whatsapp: s(whatsapp) };
}

function DeliverySummary({ delivery }: { delivery: Delivery }) {
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      {(["email", "whatsapp"] as const).map((ch) => (
        <div key={ch} className="rounded-lg bg-slate-50 p-3 text-sm">
          <div className="font-bold capitalize text-navy-900">{ch === "email" ? "Email" : "WhatsApp"}: {delivery[ch].status.replace("_", " ")}</div>
          {delivery[ch].detail && <p className="mt-1 text-xs text-slate-600">{delivery[ch].detail}</p>}
        </div>
      ))}
    </div>
  );
}

export default function Admin() {
  const { user, authReady, logIn, logOut, batches, refreshBatches } = useStore();
  const [tab, setTab] = useState<Tab>("overview");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [workingId, setWorkingId] = useState("");
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [issuedLinks, setIssuedLinks] = useState<Record<string, string>>({});
  const [deliveryResults, setDeliveryResults] = useState<Record<string, Delivery>>({});
  const [editingBatch, setEditingBatch] = useState<BatchWithCounts | null>(null);
  const [newBatchOpen, setNewBatchOpen] = useState(false);

  const refresh = useCallback(async () => {
    const [appsResult] = await Promise.all([
      apiRequest<{ applications: AdminApplication[] }>("/admin/applications"),
      refreshBatches(),
    ]);
    setApplications(appsResult.applications);
  }, [refreshBatches]);

  useEffect(() => {
    if (user?.role !== "admin") { setApplications([]); return; }
    void refresh().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Unable to load applications."));
  }, [refresh, user]);

  const submitLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await logIn(email, password);
      if (!result.ok) setError(result.error);
      else if (result.role !== "admin") { await logOut(); setError("This page is for administrators only."); }
    } finally { setLoading(false); }
  };

  const runAction = async (id: string, action: "approve" | "reject" | "payment-link" | "resend-credentials") => {
    setError(""); setWorkingId(id);
    try {
      const result = await apiRequest<{ paymentLink?: string; delivery: Delivery }>(`/admin/applications/${encodeURIComponent(id)}/${action}`, { method: "POST" });
      if (result.paymentLink) setIssuedLinks((p) => ({ ...p, [id]: result.paymentLink! }));
      setDeliveryResults((p) => ({ ...p, [id]: result.delivery }));
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Action failed.");
    } finally { setWorkingId(""); }
  };

  const copyLink = async (link: string) => {
    try { await navigator.clipboard.writeText(link); setError(""); }
    catch { setError("Could not copy — select and copy manually."); }
  };

  // Stats
  const stats = {
    pending: applications.filter((a) => a.status === "Submitted").length,
    approved: applications.filter((a) => a.status === "Approved").length,
    paid: applications.filter((a) => a.status === "Paid").length,
    rejected: applications.filter((a) => a.status === "Rejected").length,
  };

  if (!authReady) {
    return <Container className="py-40 text-center"><Loader2 className="mx-auto h-10 w-10 animate-spin text-brand-red" /><p className="mt-4 text-slate-600">Checking administrator access…</p></Container>;
  }

  if (user?.role !== "admin") {
    return (
      <>
        <PageHero eyebrow="Administrator access" title="Application review" text="Approve applications and issue secure payment links." image={IMG.craneNight} />
        <section className="bg-navy-50 py-12 sm:py-20">
          <Container className="max-w-md">
            <form onSubmit={submitLogin} className="space-y-4 rounded-2xl bg-white p-6 shadow-xl sm:p-8">
              <ShieldCheck className="h-10 w-10 text-brand-red" />
              <h2 className="text-2xl font-extrabold uppercase text-navy-900">Administrator login</h2>
              <Field label="Admin email"><input required type="email" autoComplete="username" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
              <Field label="Password"><input required type="password" autoComplete="current-password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
              {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-brand-red">{error}</p>}
              <Button type="submit" disabled={loading} full size="lg">{loading ? "Signing in…" : "Sign in as administrator"}</Button>
            </form>
          </Container>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHero eyebrow="Admissions console" title="Admin dashboard" text={`Signed in as ${user.email}.`} image={IMG.craneNight} />
      <section className="bg-navy-50 py-8 sm:py-12">
        <Container>
          {/* Tab bar */}
          <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition",
                  tab === t.id ? "bg-navy-900 text-white shadow" : "bg-white text-navy-900 hover:bg-navy-100",
                )}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
            <div className="ml-auto flex gap-2">
              <Button variant="navy" size="sm" onClick={() => void refresh().catch((cause) => setError(cause instanceof Error ? cause.message : "Refresh failed."))}>
                <RefreshCw className="h-4 w-4" />Refresh
              </Button>
              <Button variant="outlineDark" size="sm" onClick={() => void logOut().then(() => navigate("/")).catch((cause) => setError(cause instanceof Error ? cause.message : "Log out failed."))}>
                Log out
              </Button>
            </div>
          </div>

          {error && <p role="alert" className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-brand-red">{error}</p>}

          {/* OVERVIEW */}
          {tab === "overview" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Awaiting review", value: stats.pending, tone: "amber" },
                  { label: "Approved · awaiting payment", value: stats.approved, tone: "blue" },
                  { label: "Paid · enrolled", value: stats.paid, tone: "emerald" },
                  { label: "Rejected", value: stats.rejected, tone: "red" },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className={cn(
                      "h-2 w-12 rounded-full",
                      s.tone === "amber" && "bg-amber-400",
                      s.tone === "blue" && "bg-blue-400",
                      s.tone === "emerald" && "bg-emerald-400",
                      s.tone === "red" && "bg-red-400",
                    )} />
                    <div className="mt-3 font-display text-4xl font-extrabold text-navy-900">{s.value}</div>
                    <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <h3 className="text-xl font-bold uppercase text-navy-900">Recent submissions</h3>
                  <ul className="mt-3 divide-y divide-slate-100">
                    {applications.slice(0, 5).map((a) => (
                      <li key={a.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                        <div className="min-w-0">
                          <div className="font-bold text-navy-900">{a.personal.firstName} {a.personal.lastName}</div>
                          <div className="truncate text-slate-500">{a.id} · {a.email}</div>
                        </div>
                        <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold", statusClass[a.status])}>{a.status}</span>
                      </li>
                    ))}
                    {applications.length === 0 && <li className="py-6 text-center text-sm text-slate-500">No applications yet.</li>}
                  </ul>
                  {applications.length > 5 && (
                    <button onClick={() => setTab("applications")} className="mt-2 text-sm font-bold text-brand-red hover:underline">View all →</button>
                  )}
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <h3 className="text-xl font-bold uppercase text-navy-900">Batch availability</h3>
                  <ul className="mt-3 divide-y divide-slate-100">
                    {batches.slice(0, 5).map((b) => {
                      const taken = b.taken + (b.seatsTaken ?? 0);
                      const remaining = Math.max(0, b.seats - taken);
                      const pct = b.seats ? Math.min(100, (taken / b.seats) * 100) : 0;
                      return (
                        <li key={b.id} className="py-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-bold text-navy-900">{b.id}</span>
                            <span className="text-slate-600">{taken}/{b.seats} · {remaining} left</span>
                          </div>
                          <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                            <div className={cn("h-full rounded-full", remaining === 0 ? "bg-red-400" : pct > 80 ? "bg-amber-400" : "bg-emerald-400")} style={{ width: `${pct}%` }} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <button onClick={() => setTab("batches")} className="mt-2 text-sm font-bold text-brand-red hover:underline">Manage batches →</button>
                </div>
              </div>
            </div>
          )}

          {/* APPLICATIONS */}
          {tab === "applications" && (
            <div className="space-y-5">
              {applications.length === 0 ? (
                <div className="rounded-2xl bg-white p-10 text-center text-slate-600 shadow-sm">No applications have been submitted yet.</div>
              ) : (
                applications.map((application) => {
                  const programme = getProgramme(application.programme);
                  const busy = workingId === application.id;
                  const delivery = deliveryResults[application.id] ?? latestDelivery(application);
                  return (
                    <article key={application.id} className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-2xl font-extrabold uppercase text-navy-900">{application.personal.firstName} {application.personal.lastName}</h2>
                            <span className={cn("rounded-full px-3 py-1 text-xs font-bold", statusClass[application.status])}>{application.status}</span>
                          </div>
                          <p className="mt-1 text-sm text-slate-600">{application.id} · submitted {fmtDate(application.createdAt.slice(0, 10))}</p>
                          <p className="mt-1 font-semibold text-navy-900">{programme?.title ?? application.programme} · Batch {application.batch}</p>
                          <p className="mt-1 text-sm text-slate-600">{application.email} · {application.personal.phone}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {application.status === "Submitted" && (
                            <>
                              <Button disabled={busy} onClick={() => void runAction(application.id, "approve")}>
                                <CheckCircle2 className="h-4 w-4" />Approve
                              </Button>
                              <Button variant="outlineDark" disabled={busy} onClick={() => void runAction(application.id, "reject")}>Reject</Button>
                            </>
                          )}
                          {application.status === "Approved" && (
                            <Button disabled={busy} onClick={() => void runAction(application.id, "payment-link")}>
                              <Mail className="h-4 w-4" />Resend link
                            </Button>
                          )}
                          {application.status === "Paid" && (
                            <Button variant="navy" disabled={busy} onClick={() => void runAction(application.id, "resend-credentials")}>
                              <KeyRound className="h-4 w-4" />Resend credentials
                            </Button>
                          )}
                          {busy && <Loader2 className="h-5 w-5 animate-spin self-center text-brand-red" />}
                        </div>
                      </div>

                      <details className="mt-4">
                        <summary className="cursor-pointer text-sm font-bold text-navy-900 hover:text-brand-red">View applicant details</summary>
                        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                          <div><dt className="text-slate-500">Date of birth / gender</dt><dd className="font-semibold text-navy-900">{application.personal.dob} · {application.personal.gender}</dd></div>
                          <div><dt className="text-slate-500">Education</dt><dd className="font-semibold text-navy-900">{application.personal.education}</dd></div>
                          <div><dt className="text-slate-500">Address</dt><dd className="font-semibold text-navy-900">{application.personal.address}, {application.personal.city}</dd></div>
                          <div><dt className="text-slate-500">Next of kin</dt><dd className="font-semibold text-navy-900">{application.personal.nextOfKin} · {application.personal.nextOfKinPhone}</dd></div>
                        </dl>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {application.documents.map((doc) => (
                            <a
                              key={doc.id}
                              href={`/api/admin/applications/${encodeURIComponent(application.id)}/documents/${doc.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 hover:bg-navy-100"
                            >
                              {doc.kind}: {doc.fileName} · open
                            </a>
                          ))}
                        </div>
                      </details>

                      {application.payment && (
                        <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                          Verified {application.payment.reference} · {money(application.payment.amount)} · {application.payment.method}
                        </p>
                      )}
                      {issuedLinks[application.id] && (
                        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                          <p className="font-bold text-blue-950">Payment link (7-day expiry)</p>
                          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                            <input readOnly value={issuedLinks[application.id]} className={inputCls + " min-w-0 flex-1 bg-white"} aria-label="Payment link" />
                            <Button variant="navy" onClick={() => void copyLink(issuedLinks[application.id])}><Copy className="h-4 w-4" />Copy</Button>
                          </div>
                        </div>
                      )}
                      {delivery && <DeliverySummary delivery={delivery} />}
                    </article>
                  );
                })
              )}
            </div>
          )}

          {/* BATCHES */}
          {tab === "batches" && (
            <BatchManager
              batches={batches}
              editing={editingBatch}
              onEdit={setEditingBatch}
              onCloseEdit={() => setEditingBatch(null)}
              newOpen={newBatchOpen}
              setNewOpen={setNewBatchOpen}
              onChanged={() => {
                void refreshBatches().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Unable to refresh batches."));
              }}
              onError={setError}
            />
          )}
        </Container>
      </section>
    </>
  );
}

/* ─── Batches management tab ───────────────────────────────────────────── */

function BatchManager({
  batches, editing, onEdit, onCloseEdit, newOpen, setNewOpen, onChanged, onError,
}: {
  batches: BatchWithCounts[];
  editing: BatchWithCounts | null;
  onEdit: (b: BatchWithCounts | null) => void;
  onCloseEdit: () => void;
  newOpen: boolean;
  setNewOpen: (v: boolean) => void;
  onChanged: () => void;
  onError: (msg: string) => void;
}) {
  const [busyId, setBusyId] = useState("");

  const remove = async (id: string) => {
    if (!confirm(`Delete batch ${id}? This can't be undone.`)) return;
    setBusyId(id);
    try {
      await apiRequest<void>(`/admin/batches/${encodeURIComponent(id)}`, { method: "DELETE" });
      onChanged();
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "Delete failed.");
    } finally { setBusyId(""); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">{batches.length} batch{batches.length === 1 ? "" : "es"}</p>
        <Button onClick={() => setNewOpen(true)}><Plus className="h-4 w-4" />Add batch</Button>
      </div>

      {batches.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center text-slate-600 shadow-sm">No batches configured yet.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-navy-900 text-white">
              <tr>
                <th className="px-4 py-3 font-bold">ID</th>
                <th className="px-4 py-3 font-bold">Programme</th>
                <th className="px-4 py-3 font-bold">Start</th>
                <th className="px-4 py-3 font-bold">Deadline</th>
                <th className="px-4 py-3 font-bold">Mode</th>
                <th className="px-4 py-3 font-bold">Seats</th>
                <th className="px-4 py-3 font-bold">Early-bird</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batches.map((b) => {
                const taken = b.taken + (b.seatsTaken ?? 0);
                const remaining = Math.max(0, b.seats - taken);
                return (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-navy-900">{b.id}</td>
                    <td className="px-4 py-3">{getProgramme(b.programme)?.title ?? b.programme}</td>
                    <td className="px-4 py-3">{fmtDate(b.start)}</td>
                    <td className="px-4 py-3">{fmtDate(b.deadline)}</td>
                    <td className="px-4 py-3">{b.mode}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-navy-900">{taken}/{b.seats}</div>
                      <div className="text-xs text-slate-500">{remaining} remaining</div>
                    </td>
                    <td className="px-4 py-3">{b.earlyBird ? "Yes" : "No"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => onEdit(b)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => void remove(b.id)} disabled={busyId === b.id || taken > 0} className="grid h-8 w-8 place-items-center rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:hover:bg-transparent" aria-label="Delete" title={taken > 0 ? "Cannot delete — has applications" : "Delete"}>
                          {busyId === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && <BatchEditor batch={editing} onClose={() => { onCloseEdit(); onChanged(); }} onError={onError} />}
      {newOpen && <BatchEditor batch={null} onClose={() => { setNewOpen(false); onChanged(); }} onError={onError} />}
    </div>
  );
}

function BatchEditor({ batch, onClose, onError }: { batch: BatchWithCounts | null; onClose: () => void; onError: (msg: string) => void }) {
  const isNew = !batch;
  const [id, setId] = useState(batch?.id ?? "");
  const [programme, setProgramme] = useState(batch?.programme ?? programmes[0]?.slug ?? "");
  const [start, setStart] = useState(batch?.start ?? "");
  const [deadline, setDeadline] = useState(batch?.deadline ?? "");
  const [mode, setMode] = useState<"Full-time" | "Weekend">(batch?.mode === "Weekend" ? "Weekend" : "Full-time");
  const [campus, setCampus] = useState(batch?.campus ?? "Main Campus");
  const [seats, setSeats] = useState(String(batch?.seats ?? 20));
  const [earlyBird, setEarlyBird] = useState(batch?.earlyBird ?? true);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const body = {
        ...(isNew ? { id } : {}),
        ...(isNew ? { programme } : {}),
        start, deadline, mode, campus,
        seats: Number(seats),
        earlyBird,
      };
      if (isNew) {
        await apiRequest(`/admin/batches`, { method: "POST", body: JSON.stringify(body) });
      } else {
        await apiRequest(`/admin/batches/${encodeURIComponent(batch!.id)}`, { method: "PATCH", body: JSON.stringify(body) });
      }
      onClose();
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "Save failed.");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-extrabold uppercase text-navy-900">{isNew ? "Add batch" : `Edit ${batch?.id}`}</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {isNew && (
            <>
              <Field label="Batch ID"><input className={inputCls} value={id} onChange={(e) => setId(e.target.value.toLowerCase())} placeholder="e.g. trk-d" /></Field>
              <Field label="Programme">
                <select className={inputCls} value={programme} onChange={(e) => setProgramme(e.target.value)}>
                  {programmes.map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}
                </select>
              </Field>
            </>
          )}
          <Field label="Start date"><input type="date" className={inputCls} value={start} onChange={(e) => setStart(e.target.value)} /></Field>
          <Field label="Registration deadline"><input type="date" className={inputCls} value={deadline} onChange={(e) => setDeadline(e.target.value)} /></Field>
          <Field label="Mode">
            <select className={inputCls} value={mode} onChange={(e) => setMode(e.target.value as "Full-time" | "Weekend")}>
              <option>Full-time</option>
              <option>Weekend</option>
            </select>
          </Field>
          <Field label="Campus"><input className={inputCls} value={campus} onChange={(e) => setCampus(e.target.value)} /></Field>
          <Field label="Total seats"><input type="number" min={1} max={500} className={inputCls} value={seats} onChange={(e) => setSeats(e.target.value)} /></Field>
          <label className="flex items-center gap-3 self-end rounded-lg border border-slate-200 px-4 py-3">
            <input type="checkbox" className="h-5 w-5 accent-[#d8232a]" checked={earlyBird} onChange={(e) => setEarlyBird(e.target.checked)} />
            <span className="text-sm font-semibold text-navy-900">Early-bird discount</span>
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outlineDark" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : isNew ? "Create batch" : "Save changes"}</Button>
        </div>
      </div>
    </div>
  );
}