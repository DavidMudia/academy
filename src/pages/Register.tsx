import { useEffect, useMemo, useState } from "react";
import { Check, ArrowLeft, ArrowRight, Upload, FileCheck2, X, CheckCircle2, Pencil } from "lucide-react";
import { Button, Container, Field, PageHero, ProgrammeIcon, inputCls } from "../components/ui";
import { BatchStatus, useBatchState } from "../components/shared";
import { cn } from "../utils/cn";
import { IMG, daysUntil, documents, fmtDate, getProgramme, money, programmes, type Batch } from "../data";
import { computeBreakdown, useStore, type Personal } from "../store";
import { navigate, useRoute } from "../router";

const steps = ["Contact", "Programme", "Batch", "Details", "Documents", "Review"];

const emptyPersonal = (name = "", phone = ""): Personal => ({
  firstName: name.split(" ")[0] ?? "",
  lastName: name.split(" ").slice(1).join(" "),
  dob: "",
  gender: "",
  phone,
  address: "",
  city: "",
  education: "",
  nextOfKin: "",
  nextOfKinPhone: "",
});

function BatchOption({ b, selected, onSelect }: { b: Batch; selected: boolean; onSelect: () => void }) {
  const { left, closed } = useBatchState(b);
  return (
    <button type="button" disabled={closed} onClick={onSelect} className={cn("flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition", selected ? "border-brand-red bg-red-50/50 shadow-md" : "border-slate-200 bg-white hover:border-navy-300", closed && "cursor-not-allowed opacity-50")}>
      <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full border-2", selected ? "border-brand-red bg-brand-red text-white" : "border-slate-300")}>{selected && <Check className="h-3.5 w-3.5" />}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-2xl font-bold text-navy-900">Starts {fmtDate(b.start)}</span>
        <span className="block text-sm text-slate-600">{b.mode} · {b.campus} · Register by {fmtDate(b.deadline)}</span>
        <span className="mt-1 block text-xs font-semibold text-slate-500">{left} seats left {b.earlyBird && !closed && <span className="ml-2 text-brand-red">Early-bird −10%</span>}</span>
      </span>
      <BatchStatus b={b} />
    </button>
  );
}

export default function Register() {
  const { params } = useRoute();
  const { user, batches, saveApplication } = useStore();

  // Admin cannot apply
  useEffect(() => {
    if (user?.role === "admin") navigate("/admin");
  }, [user]);

  const initialProgramme = params.get("programme") && getProgramme(params.get("programme")!) ? params.get("programme")! : "";
  const initialBatch = params.get("batch") ?? "";

  const [step, setStep] = useState(user ? (initialProgramme ? (initialBatch ? 3 : 2) : 1) : 0);
  const [programme, setProgramme] = useState(initialProgramme);
  const [batch, setBatch] = useState(initialBatch);
  const [email, setEmail] = useState(user?.email ?? "");
  const [personal, setPersonal] = useState<Personal>(() => emptyPersonal(user?.name, user?.phone));
  const [docs, setDocs] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File>>({});
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [docError, setDocError] = useState("");
  const [submissionError, setSubmissionError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && !personal.firstName && !personal.phone) setPersonal(emptyPersonal(user.name, user.phone));
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (user) setEmail(user.email);
  }, [user]);

  const prog = getProgramme(programme);
  const bat = useMemo(() => batches.find((b) => b.id === batch), [batches, batch]);
  const progBatches = useMemo(
    () => batches.filter((b) => b.programme === programme).sort((a, b) => a.start.localeCompare(b.start)),
    [batches, programme],
  );
  const bd = prog && bat ? computeBreakdown(prog.tuition, bat.earlyBird) : null;

  const setP = <K extends keyof Personal>(k: K, v: Personal[K]) => {
    setPersonal({ ...personal, [k]: v });
    if (errors[k]) setErrors({ ...errors, [k]: "" });
  };

  const validateDetails = () => {
    const e: Record<string, string> = {};
    const req: (keyof Personal)[] = ["firstName", "lastName", "dob", "gender", "phone", "address", "city", "education", "nextOfKin", "nextOfKinPhone"];
    req.forEach((k) => {
      if (!String(personal[k]).trim()) e[k] = "Required";
    });
    if (personal.dob) {
      const age = (Date.now() - new Date(personal.dob).getTime()) / 31557600000;
      if (age < 18) e.dob = "You must be at least 18 years old";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (step === 0 && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setErrors({ email: "Enter a valid email address." });
      return;
    }
    if (step === 1 && !programme) return;
    if (step === 2 && !batch) return;
    if (step === 3 && !validateDetails()) return;
    if (step === 4) {
      const missing = documents.filter((d) => d.required && !docs[d.key]);
      if (missing.length) return setDocError(`Please upload: ${missing.map((m) => m.label).join(", ")}`);
      setDocError("");
    }
    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const back = () => {
    setStep(Math.max(user ? 1 : 0, step - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    setSubmissionError("");
    setSubmitting(true);
    try {
      const application = await saveApplication({ programme, batch, personal, docs, email: email.trim().toLowerCase() }, files);
      navigate(`/application-submitted?id=${encodeURIComponent(application.id)}`);
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : "Unable to submit your application.");
    } finally {
      setSubmitting(false);
    }
  };

  const upload = (key: string, file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setDocError(`${file.name} is larger than 5 MB.`);
    setDocError("");
    setDocs({ ...docs, [key]: file.name });
    setFiles({ ...files, [key]: file });
  };

  const canNext =
    (step === 0 && /^\S+@\S+\.\S+$/.test(email.trim())) ||
    (step === 1 && !!programme) ||
    (step === 2 && !!batch) ||
    step === 3 ||
    step === 4;

  // Admins shouldn't see this page while redirecting
  if (user?.role === "admin") return null;

  return (
    <>
      <PageHero eyebrow="Admissions" title="Apply online" text="Six short steps. Your progress is clear at every stage — it takes about ten minutes." image={IMG.crew} />
      <section className="bg-navy-50 pb-20 pt-8 sm:pt-12">
        <Container className="max-w-4xl">
          <ol className="mb-8 flex items-start justify-between" aria-label="Progress">
            {steps.map((s, i) => (
              <li key={s} className="relative flex flex-1 flex-col items-center">
                {i > 0 && <span className={cn("absolute right-1/2 top-4 -z-0 h-0.5 w-full transition-colors duration-500", i <= step ? "bg-brand-red" : "bg-slate-300")} />}
                <span className={cn("relative z-10 grid h-8 w-8 place-items-center rounded-full text-sm font-bold ring-4 ring-navy-50 transition-all duration-300", i < step ? "bg-brand-red text-white" : i === step ? "scale-110 bg-navy-900 text-white" : "bg-slate-300 text-slate-600")}>
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span className={cn("mt-2 hidden text-xs font-bold uppercase tracking-wide sm:block", i === step ? "text-navy-900" : "text-slate-500")}>{s}</span>
              </li>
            ))}
          </ol>
          <div className="mb-3 text-center text-sm font-bold uppercase tracking-wide text-navy-900 sm:hidden">Step {step + 1} of 6 · {steps[step]}</div>

          <div key={step} className="animate-fade-up rounded-2xl bg-white p-5 shadow-xl sm:p-8">
            {step === 0 && (
              <div className="mx-auto max-w-md">
                <h2 className="text-3xl font-extrabold uppercase text-navy-900">Where should we contact you?</h2>
                <p className="mb-5 mt-1 text-slate-600">We'll send your application decision and, if approved, your secure payment link to this email. A student account is created only after payment is verified.</p>
                <form onSubmit={(e) => { e.preventDefault(); next(); }}>
                  <Field label="Email address" error={errors.email}>
                    <input type="email" autoComplete="email" autoFocus required className={inputCls} value={email} onChange={(e) => { setEmail(e.target.value); setErrors({ ...errors, email: "" }); }} />
                  </Field>
                  <button type="submit" className="sr-only" aria-hidden tabIndex={-1}>Continue</button>
                </form>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="text-3xl font-extrabold uppercase text-navy-900">Select your programme</h2>
                <p className="mb-5 mt-1 text-slate-600">Hello{user ? `, ${user.name.split(" ")[0]}` : ""}! Which training would you like to take?</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {programmes.map((p) => (
                    <button key={p.slug} type="button" onClick={() => { setProgramme(p.slug); if (p.slug !== programme) setBatch(""); }} className={cn("group relative overflow-hidden rounded-xl border-2 text-left transition", programme === p.slug ? "border-brand-red shadow-lg" : "border-slate-200 hover:border-navy-300")}>
                      <img src={p.image} alt="" className="h-28 w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                      <div className="flex items-start gap-3 p-4">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-navy-900 text-white"><ProgrammeIcon icon={p.icon} className="h-5 w-5" /></span>
                        <div className="flex-1"><div className="font-display text-xl font-bold uppercase text-navy-900">{p.title}</div><div className="text-sm text-slate-600">{p.duration} · {money(p.tuition)}</div></div>
                        {programme === p.slug && <CheckCircle2 className="h-6 w-6 text-brand-red" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && prog && (
              <div>
                <h2 className="text-3xl font-extrabold uppercase text-navy-900">Choose your training batch</h2>
                <p className="mb-5 mt-1 text-slate-600">Available intakes for <b>{prog.title}</b>.</p>
                <div className="space-y-3">{progBatches.map((b) => <BatchOption key={b.id} b={b} selected={batch === b.id} onSelect={() => setBatch(b.id)} />)}</div>
                {progBatches.length === 0 && <p className="text-slate-600">No batches currently open. Contact admissions.</p>}
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-3xl font-extrabold uppercase text-navy-900">Personal information</h2>
                <p className="mb-5 mt-1 text-slate-600">As it appears on your ID.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="First name" error={errors.firstName}><input className={inputCls} value={personal.firstName} onChange={(e) => setP("firstName", e.target.value)} /></Field>
                  <Field label="Last name" error={errors.lastName}><input className={inputCls} value={personal.lastName} onChange={(e) => setP("lastName", e.target.value)} /></Field>
                  <Field label="Date of birth" error={errors.dob}><input type="date" className={inputCls} value={personal.dob} onChange={(e) => setP("dob", e.target.value)} /></Field>
                  <Field label="Gender" error={errors.gender}>
                    <select className={inputCls} value={personal.gender} onChange={(e) => setP("gender", e.target.value)}><option value="">Select…</option><option>Male</option><option>Female</option><option>Prefer not to say</option></select>
                  </Field>
                  <Field label="Phone / WhatsApp" error={errors.phone}><input type="tel" className={inputCls} value={personal.phone} onChange={(e) => setP("phone", e.target.value)} /></Field>
                  <Field label="Highest education" error={errors.education}>
                    <select className={inputCls} value={personal.education} onChange={(e) => setP("education", e.target.value)}><option value="">Select…</option><option>Primary School</option><option>Secondary School (SSCE)</option><option>OND / Diploma</option><option>Degree / HND</option></select>
                  </Field>
                  <div className="sm:col-span-2"><Field label="Home address" error={errors.address}><input className={inputCls} value={personal.address} onChange={(e) => setP("address", e.target.value)} /></Field></div>
                  <Field label="City / State" error={errors.city}><input className={inputCls} value={personal.city} onChange={(e) => setP("city", e.target.value)} /></Field>
                  <span />
                  <Field label="Next of kin" error={errors.nextOfKin}><input className={inputCls} value={personal.nextOfKin} onChange={(e) => setP("nextOfKin", e.target.value)} /></Field>
                  <Field label="Next of kin phone" error={errors.nextOfKinPhone}><input type="tel" className={inputCls} value={personal.nextOfKinPhone} onChange={(e) => setP("nextOfKinPhone", e.target.value)} /></Field>
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="text-3xl font-extrabold uppercase text-navy-900">Upload documents</h2>
                <p className="mb-5 mt-1 text-slate-600">JPG, PNG or PDF — up to 5 MB each.</p>
                <div className="space-y-3">
                  {documents.map((d) => (
                    <div key={d.key} className={cn("flex flex-col gap-3 rounded-xl border-2 border-dashed p-4 transition sm:flex-row sm:items-center", docs[d.key] ? "border-emerald-300 bg-emerald-50/50" : "border-slate-300")}>
                      <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-lg", docs[d.key] ? "bg-emerald-500 text-white" : "bg-navy-50 text-navy-900")}>{docs[d.key] ? <FileCheck2 className="h-5 w-5" /> : <Upload className="h-5 w-5" />}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-navy-900">{d.label} {d.required ? <span className="text-brand-red">*</span> : <span className="text-xs font-normal text-slate-500">(optional)</span>}</div>
                        <div className="truncate text-sm text-slate-600">{docs[d.key] ?? d.hint}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-700">
                          {docs[d.key] ? "Replace" : "Choose file"}
                          <input type="file" accept="image/jpeg,image/png,application/pdf" className="sr-only" onChange={(e) => upload(d.key, e.target.files?.[0])} />
                        </label>
                        {docs[d.key] && <button type="button" aria-label="Remove" onClick={() => { const nD = { ...docs }; const nF = { ...files }; delete nD[d.key]; delete nF[d.key]; setDocs(nD); setFiles(nF); }} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>}
                      </div>
                    </div>
                  ))}
                </div>
                {docError && <div role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-brand-red">{docError}</div>}
              </div>
            )}

            {step === 5 && prog && bat && bd && (
              <div>
                <h2 className="text-3xl font-extrabold uppercase text-navy-900">Review your application</h2>
                <p className="mb-5 mt-1 text-slate-600">Check your details before sending. Payment is not due until an administrator approves your application and sends you a secure link.</p>
                <div className="space-y-4">
                  <ReviewBlock title="Programme & batch" onEdit={() => setStep(1)}>
                    <b>{prog.title}</b> · {prog.duration}<br />Batch {bat.id} · starts {fmtDate(bat.start)} · {bat.mode} · {bat.campus}
                  </ReviewBlock>
                  <ReviewBlock title="Personal details" onEdit={() => setStep(3)}>
                    Contact email: {email}<br />
                    {personal.firstName} {personal.lastName} · {personal.gender} · born {personal.dob}<br />
                    {personal.phone} · {personal.address}, {personal.city}<br />
                    Education: {personal.education} · Next of kin: {personal.nextOfKin} ({personal.nextOfKinPhone})
                  </ReviewBlock>
                  <ReviewBlock title="Documents" onEdit={() => setStep(4)}>
                    {Object.values(docs).map((d) => <span key={d} className="mr-2 mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800"><Check className="h-3 w-3" />{d}</span>)}
                  </ReviewBlock>
                  <div className="rounded-xl bg-navy-900 p-5 text-white">
                    <div className="flex items-center justify-between"><span className="text-navy-100">Estimated total payable</span><span className="font-display text-4xl font-extrabold">{money(bd.total)}</span></div>
                    <div className="mt-1 text-xs text-navy-200">Final amount and payment instructions will be provided after approval.</div>
                  </div>
                  <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-700">
                    <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-5 w-5 accent-[#d8232a]" />
                    I confirm the information provided is accurate and I agree to the academy's Terms of Enrolment and safety regulations.
                  </label>
                </div>
                {submissionError && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-brand-red">{submissionError}</p>}
              </div>
            )}

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="ghost" onClick={back} disabled={step === 0} className={step === 0 ? "invisible" : ""}>
                <ArrowLeft className="h-4 w-4" />Back
              </Button>
              {step < 5 ? (
                <Button onClick={next} disabled={!canNext} size="lg" className="sm:min-w-48">
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={submit} disabled={!agree || submitting} size="lg" className="sm:min-w-56">
                  {submitting ? "Sending application…" : "Submit application"} <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          {step === 2 && bat && daysUntil(bat.deadline) < 3 && <p className="mt-3 text-center text-sm font-semibold text-brand-red">Deadline is almost here — complete your payment soon to hold your seat.</p>}
        </Container>
      </section>
    </>
  );
}

function ReviewBlock({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="mb-1.5 flex items-center justify-between">
        <h3 className="text-xl font-bold uppercase text-navy-900">{title}</h3>
        <button type="button" onClick={onEdit} className="flex items-center gap-1 text-sm font-semibold text-brand-red hover:underline"><Pencil className="h-3.5 w-3.5" />Edit</button>
      </div>
      <div className="text-sm leading-relaxed text-slate-700">{children}</div>
    </div>
  );
}