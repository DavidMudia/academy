import { useState } from "react";
import { ChevronDown, Clock, CalendarDays, Users, MapPin } from "lucide-react";
import { Link } from "../router";
import { Button, ProgrammeIcon, Reveal } from "./ui";
import { cn } from "../utils/cn";
import { daysUntil, fmtDate, getProgramme, money, type Batch, type Programme } from "../data";
import { useStore } from "../store";

export function ProgrammeCard({ p, delay = 0 }: { p: Programme; delay?: number }) {
  return (
    <Reveal delay={delay} className="h-full">
      <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-navy-900/15">
        <Link to={`/programmes/${p.slug}`} className="relative block aspect-[4/3] overflow-hidden" aria-label={p.title}>
          <img src={p.image} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
          <div className="absolute inset-0 bg-linear-to-t from-navy-950/70 via-transparent to-transparent" />
          <span className="absolute left-4 top-4 grid h-12 w-12 place-items-center rounded-xl bg-brand-red text-white shadow-lg">
            <ProgrammeIcon icon={p.icon} className="h-6 w-6" />
          </span>
          <span className="absolute bottom-3 right-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-navy-900">{p.duration}</span>
        </Link>
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <h3 className="text-3xl font-extrabold uppercase text-navy-900">{p.title}</h3>
          <p className="mt-2 flex-1 text-[15px] leading-relaxed text-slate-600">{p.short}</p>
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tuition from</div>
              <div className="font-display text-2xl font-bold text-navy-900">{money(p.tuition)}</div>
            </div>
            <Button to={`/programmes/${p.slug}`} variant="navy" size="sm" arrow>Learn More</Button>
          </div>
        </div>
      </article>
    </Reveal>
  );
}

export function BatchStatus({ b }: { b: Batch }) {
  const { seatsLeft } = useStore();
  const left = seatsLeft(b);
  const closed = daysUntil(b.deadline) < 0 || left === 0;
  const filling = !closed && left <= Math.ceil(b.seats * 0.25);
  const label = closed ? (left === 0 ? "Full" : "Closed") : filling ? "Filling fast" : "Open";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold", closed ? "bg-slate-100 text-slate-500" : filling ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800")}>
      <span className={cn("h-1.5 w-1.5 rounded-full", closed ? "bg-slate-400" : filling ? "bg-amber-500" : "bg-emerald-500")} />
      {label}
    </span>
  );
}

export function useBatchState(b: Batch) {
  const { seatsLeft } = useStore();
  const left = seatsLeft(b);
  return { left, closed: daysUntil(b.deadline) < 0 || left === 0 };
}

export function BatchCard({ b, showProgramme = true }: { b: Batch; showProgramme?: boolean }) {
  const p = getProgramme(b.programme)!;
  const { left, closed } = useBatchState(b);
  const pct = Math.round(((b.seats - left) / b.seats) * 100);
  const d = daysUntil(b.start);
  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-navy-300 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          {showProgramme && <div className="text-xs font-bold uppercase tracking-wider text-brand-red">{p.title}</div>}
          <div className="mt-1 font-display text-3xl font-bold text-navy-900">{fmtDate(b.start)}</div>
          <div className="text-sm text-slate-500">Starts in {d} days · Batch {b.id}</div>
        </div>
        <BatchStatus b={b} />
      </div>
      <ul className="mt-4 space-y-2 text-sm text-slate-700">
        <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-navy-500" />{p.duration} · {b.mode}</li>
        <li className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-navy-500" />Register by {fmtDate(b.deadline)}</li>
        <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-navy-500" />{b.campus}</li>
      </ul>
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{left} of {b.seats} seats left</span>
          {b.earlyBird && !closed && <span className="text-brand-red">Early-bird −10%</span>}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className={cn("h-full rounded-full transition-all duration-1000", pct > 75 ? "bg-brand-red" : "bg-navy-500")} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="mt-5 flex-1" />
      <Button to={`/register?programme=${b.programme}&batch=${b.id}`} disabled={closed} full variant={closed ? "navy" : "red"}>
        {closed ? "Registration closed" : "Reserve my seat"}
      </Button>
    </div>
  );
}

export function FAQ({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-3">
      {items.map((f, i) => (
        <div key={f.q} className={cn("overflow-hidden rounded-xl border bg-white transition", open === i ? "border-navy-300 shadow-md" : "border-slate-200")}>
          <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
            <span className="text-base font-semibold text-navy-900 sm:text-lg">{f.q}</span>
            <ChevronDown className={cn("h-5 w-5 shrink-0 text-brand-red transition-transform duration-300", open === i && "rotate-180")} />
          </button>
          <div className={cn("grid transition-all duration-300", open === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
            <div className="overflow-hidden">
              <p className="px-5 pb-5 leading-relaxed text-slate-600">{f.a}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CTABand({ title = "Ready to start your operator career?", text = "Apply online and wait for an administrator to review your application. If approved, you'll receive a secure payment link by email or WhatsApp." }: { title?: string; text?: string }) {
  return (
    <section className="relative overflow-hidden bg-brand-red py-14 text-white">
      <div className="stripe-bg absolute inset-0" />
      <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 text-center sm:px-6 md:flex-row md:text-left lg:px-8">
        <div>
          <h2 className="text-4xl font-extrabold uppercase sm:text-5xl">{title}</h2>
          <p className="mt-2 max-w-xl text-red-50">{text}</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button to="/register" variant="navy" size="lg" arrow>Register Now</Button>
          <Button to="/contact" variant="outline" size="lg">Talk to Admissions</Button>
        </div>
      </div>
    </section>
  );
}
