import { Check, Clock, BadgeCheck, GraduationCap, Wallet, ClipboardList, Hammer, Briefcase, Gauge } from "lucide-react";
import { Button, Container, PageHero, ProgrammeIcon, Reveal, SectionHead } from "../components/ui";
import { BatchCard, CTABand, ProgrammeCard } from "../components/shared";
import { Link } from "../router";
import { batches, EARLY_BIRD_PERCENT, getProgramme, money, programmes, REGISTRATION_FEE } from "../data";

export function Programmes() {
  return (
    <>
      <PageHero eyebrow="Training Programmes" title="Choose your path" text="Four career-ready operator programmes. Compare duration, fees and certification, then pick the one that fits your goals." image={programmes[2].image} />
      <section className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-6 sm:grid-cols-2">
            {programmes.map((p, i) => <ProgrammeCard key={p.slug} p={p} delay={i * 80} />)}
          </div>
        </Container>
      </section>

      <section className="bg-navy-50 py-16 sm:py-20">
        <Container>
          <SectionHead eyebrow="Compare" title="Programmes at a glance" />
          <Reveal>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-navy-900 text-white">
                  <tr>{["Programme", "Duration", "Level", "Tuition", ""].map((h) => <th key={h} className="px-5 py-4 font-display text-lg font-bold uppercase tracking-wide">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {programmes.map((p) => (
                    <tr key={p.slug} className="transition hover:bg-navy-50/60">
                      <td className="px-5 py-4 font-semibold text-navy-900"><span className="flex items-center gap-3"><ProgrammeIcon icon={p.icon} className="h-5 w-5 text-brand-red" />{p.title}</span></td>
                      <td className="px-5 py-4">{p.duration}</td>
                      <td className="px-5 py-4">{p.level}</td>
                      <td className="px-5 py-4 font-bold text-navy-900">{money(p.tuition)}</td>
                      <td className="px-5 py-4 text-right"><Link to={`/programmes/${p.slug}`} className="font-semibold text-brand-red hover:underline">Details →</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </Container>
      </section>
      <CTABand />
    </>
  );
}

export function ProgrammeDetail({ slug }: { slug: string }) {
  const p = getProgramme(slug);
  if (!p) {
    return (
      <Container className="py-40 text-center">
        <h1 className="text-5xl font-extrabold uppercase text-navy-900">Programme not found</h1>
        <div className="mt-6"><Button to="/programmes">Back to programmes</Button></div>
      </Container>
    );
  }
  const myBatches = batches.filter((b) => b.programme === p.slug);
  const facts = [
    { icon: Clock, label: "Duration", value: p.duration },
    { icon: Gauge, label: "Level", value: p.level },
    { icon: Wallet, label: "Tuition", value: money(p.tuition) },
    { icon: BadgeCheck, label: "Certificate", value: "Accredited" },
  ];

  return (
    <>
      <PageHero eyebrow={p.level} title={p.title} text={p.tagline} image={p.image} />

      <Container className="relative z-10 -mt-8">
        <Reveal>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-slate-200 shadow-xl lg:grid-cols-4">
            {facts.map((f) => (
              <div key={f.label} className="flex items-center gap-3 bg-white p-4 sm:p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-navy-50 text-brand-red"><f.icon className="h-5 w-5" /></span>
                <div><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{f.label}</div><div className="font-bold text-navy-900">{f.value}</div></div>
              </div>
            ))}
          </div>
        </Reveal>
      </Container>

      <section className="py-14 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-14">
          <div className="space-y-14">
            <Reveal>
              <p className="text-lg leading-relaxed text-slate-600">{p.short}</p>
              <div className="mt-6 grid grid-cols-3 gap-3">
                {p.gallery.map((g, i) => <img key={i} src={g} alt={`${p.title} training ${i + 1}`} loading="lazy" className={`aspect-square w-full rounded-xl object-cover sm:aspect-[4/3] ${i === 0 ? "col-span-3 aspect-[16/9]! sm:col-span-1 sm:aspect-[4/3]!" : ""}`} />)}
              </div>
            </Reveal>

            <Reveal>
              <h2 className="mb-6 flex items-center gap-3 text-3xl font-extrabold uppercase text-navy-900 sm:text-4xl"><ClipboardList className="h-7 w-7 text-brand-red" />Course Outline</h2>
              <ol className="space-y-3">
                {p.outline.map((m, i) => (
                  <li key={m.module} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-navy-300 hover:shadow-md">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-navy-900 font-display text-xl font-bold text-white">{i + 1}</span>
                    <div><h3 className="text-xl font-bold uppercase text-navy-900">{m.module}</h3><p className="mt-1 text-slate-600">{m.detail}</p></div>
                  </li>
                ))}
              </ol>
            </Reveal>

            <div className="grid gap-8 md:grid-cols-2">
              <Reveal>
                <h2 className="mb-5 flex items-center gap-3 text-3xl font-extrabold uppercase text-navy-900"><Hammer className="h-6 w-6 text-brand-red" />Practical Training</h2>
                <ul className="space-y-3">{p.practical.map((x) => <li key={x} className="flex gap-3"><Check className="mt-1 h-5 w-5 shrink-0 text-brand-red" />{x}</li>)}</ul>
              </Reveal>
              <Reveal delay={100}>
                <h2 className="mb-5 flex items-center gap-3 text-3xl font-extrabold uppercase text-navy-900"><GraduationCap className="h-6 w-6 text-brand-red" />Requirements</h2>
                <ul className="space-y-3">{p.requirements.map((x) => <li key={x} className="flex gap-3"><Check className="mt-1 h-5 w-5 shrink-0 text-navy-500" />{x}</li>)}</ul>
              </Reveal>
            </div>

            <Reveal>
              <h2 className="mb-5 flex items-center gap-3 text-3xl font-extrabold uppercase text-navy-900"><Briefcase className="h-6 w-6 text-brand-red" />Career Outcomes</h2>
              <div className="flex flex-wrap gap-2">{p.career.map((c) => <span key={c} className="rounded-full bg-navy-50 px-4 py-2 text-sm font-semibold text-navy-900">{c}</span>)}</div>
              <p className="mt-4 text-sm text-slate-500">Certification awarded: <strong className="text-navy-900">{p.certification}</strong></p>
            </Reveal>
          </div>

          {/* Sticky fee card */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                <div className="bg-navy-900 p-6 text-white">
                  <div className="text-sm font-semibold uppercase tracking-wider text-navy-200">Fees</div>
                  <div className="font-display text-5xl font-extrabold">{money(p.tuition + REGISTRATION_FEE)}</div>
                  <div className="text-sm text-navy-200">Tuition + registration (before discounts)</div>
                </div>
                <div className="space-y-3 p-6 text-sm">
                  <div className="flex justify-between"><span className="text-slate-600">Registration fee</span><b>{money(REGISTRATION_FEE)}</b></div>
                  <div className="flex justify-between"><span className="text-slate-600">Tuition</span><b>{money(p.tuition)}</b></div>
                  <div className="flex justify-between text-emerald-700"><span>Early-bird discount</span><b>−{EARLY_BIRD_PERCENT}% tuition</b></div>
                  <div className="pt-3"><Button to={`/register?programme=${p.slug}`} full size="lg" arrow>Register for this course</Button></div>
                  <Button to="/contact" variant="outlineDark" full>Ask a question</Button>
                </div>
              </div>
            </Reveal>
          </aside>
        </Container>
      </section>

      <section className="bg-navy-50 py-14 sm:py-20">
        <Container>
          <SectionHead eyebrow="Training Dates" title={`Upcoming ${p.title} intakes`} />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {myBatches.map((b, i) => <Reveal key={b.id} delay={i * 80}><BatchCard b={b} showProgramme={false} /></Reveal>)}
          </div>
        </Container>
      </section>

      <section className="py-14">
        <Container>
          <h3 className="mb-6 text-center text-3xl font-extrabold uppercase text-navy-900">Explore other programmes</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {programmes.filter((x) => x.slug !== p.slug).map((o) => (
              <Link key={o.slug} to={`/programmes/${o.slug}`} className="group flex items-center gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-brand-red hover:shadow-lg">
                <img src={o.image} alt="" className="h-16 w-16 rounded-lg object-cover" loading="lazy" />
                <div><div className="font-display text-xl font-bold uppercase text-navy-900">{o.title}</div><div className="text-sm text-slate-500 group-hover:text-brand-red">{o.duration} →</div></div>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
