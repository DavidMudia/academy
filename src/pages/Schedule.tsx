import { useMemo, useState } from "react";
import { FileText, CreditCard, UserCheck, CalendarClock } from "lucide-react";
import { Button, Container, PageHero, Reveal, SectionHead } from "../components/ui";
import { BatchCard, BatchStatus, CTABand, FAQ, useBatchState } from "../components/shared";
import { cn } from "../utils/cn";
import { IMG, batches, faqs, fmtDate, getProgramme, programmes, type Batch } from "../data";

function Row({ b }: { b: Batch }) {
  const p = getProgramme(b.programme)!;
  const { left, closed } = useBatchState(b);
  return (
    <tr className="transition hover:bg-navy-50/60">
      <td className="px-4 py-4 font-semibold text-navy-900">{p.title}<div className="text-xs font-normal text-slate-500">Batch {b.id} · {b.campus}</div></td>
      <td className="px-4 py-4">{fmtDate(b.start)}</td>
      <td className="px-4 py-4">{p.duration} · {b.mode}</td>
      <td className="px-4 py-4">{fmtDate(b.deadline)}</td>
      <td className="px-4 py-4">{left}/{b.seats}</td>
      <td className="px-4 py-4"><BatchStatus b={b} /></td>
      <td className="px-4 py-4 text-right"><Button size="sm" to={`/register?programme=${b.programme}&batch=${b.id}`} disabled={closed}>Register</Button></td>
    </tr>
  );
}

export default function Schedule() {
  const [filter, setFilter] = useState("all");
  const list = useMemo(() => batches.filter((b) => filter === "all" || b.programme === filter).sort((a, b) => a.start.localeCompare(b.start)), [filter]);

  return (
    <>
      <PageHero eyebrow="Training Schedule" title="Schedule & Admissions" text="See upcoming sessions, start dates, registration deadlines and live seat availability." image={IMG.craneNight} />

      <section className="py-14 sm:py-20">
        <Container>
          <div className="mb-8 -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
            {[{ slug: "all", title: "All programmes" }, ...programmes].map((p) => (
              <button key={p.slug} onClick={() => setFilter(p.slug)} className={cn("shrink-0 rounded-full border-2 px-5 py-2 text-sm font-bold transition", filter === p.slug ? "border-navy-900 bg-navy-900 text-white" : "border-slate-200 bg-white text-navy-900 hover:border-navy-300")}>
                {p.title}
              </button>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-navy-900 text-white">
                <tr>{["Programme", "Starts", "Duration", "Register by", "Seats left", "Status", ""].map((h) => <th key={h} className="px-4 py-4 font-display text-base font-bold uppercase tracking-wide">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">{list.map((b) => <Row key={b.id} b={b} />)}</tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="grid gap-4 md:hidden">{list.map((b) => <BatchCard key={b.id} b={b} />)}</div>

          <p className="mt-6 flex items-start gap-2 text-sm text-slate-500"><CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />Schedules and seat availability are managed by academy staff through the admin system and update here automatically — no website changes required.</p>
        </Container>
      </section>

      <section className="bg-navy-50 py-14 sm:py-20">
        <Container>
          <SectionHead eyebrow="Admissions Information" title="Everything you need to apply" />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              [UserCheck, "Eligibility", "Minimum age 18–21 depending on programme, valid ID, and basic literacy. See each programme page for exact requirements."],
              [FileText, "Documents", "Government ID, passport photograph, education certificate and (where required) a medical fitness certificate."],
              [CreditCard, "Fees & Payment", "Registration fee plus tuition, payable online by card, bank transfer or mobile money. Early-bird discounts available."],
              [CalendarClock, "Deadlines", "Register at least one week before start. Seats are allocated in order of completed payment."],
            ].map(([I, t, d], i) => {
              const Ic = I as typeof FileText;
              return (
                <Reveal key={t as string} delay={i * 70}>
                  <div className="h-full rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-navy-900 text-white"><Ic className="h-6 w-6" /></span>
                    <h3 className="text-2xl font-bold uppercase text-navy-900">{t as string}</h3>
                    <p className="mt-2 text-slate-600">{d as string}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </section>

      <section className="py-14 sm:py-20">
        <Container className="max-w-3xl">
          <SectionHead eyebrow="FAQ" title="Admissions questions" />
          <FAQ items={faqs} />
        </Container>
      </section>
      <CTABand />
    </>
  );
}
