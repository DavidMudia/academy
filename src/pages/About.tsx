import { Check, Target, Eye, ShieldCheck } from "lucide-react";
import { Container, PageHero, Reveal, SectionHead } from "../components/ui";
import { CTABand } from "../components/shared";
import { IMG, facilities, instructors, safetyHighlights, stats } from "../data";

export default function About() {
  return (
    <>
      <PageHero eyebrow="About the Academy" title="Built by operators, for operators" text="For over 15 years Oldam Technologies has trained the people who keep roads, ports, warehouses and construction sites moving — safely." image={IMG.crew} />

      <section className="py-16 sm:py-24">
        <Container className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="mb-3 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-brand-red"><span className="h-0.5 w-6 bg-brand-red" />Our Story</div>
            <h2 className="text-4xl font-extrabold uppercase text-navy-900 sm:text-5xl">From one training yard to a full international academy</h2>
            <div className="mt-5 space-y-4 text-lg leading-relaxed text-slate-600">
              <p>Oldam Technologies began as a small operator-training yard serving local contractors. Demand for certified, safety-conscious operators grew quickly — and so did we.</p>
              <p>Today the academy runs four accredited programmes on a purpose-built campus, with modern machines, simulators and instructors who have spent decades on real sites.</p>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4">
              {stats.map((s) => <div key={s.label} className="rounded-xl bg-navy-50 p-4"><div className="font-display text-4xl font-extrabold text-navy-900">{s.value}</div><div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{s.label}</div></div>)}
            </div>
          </Reveal>
          <Reveal delay={120} className="relative">
            <img src={IMG.engineers} alt="Instructors planning a lift" loading="lazy" className="w-full rounded-2xl object-cover shadow-2xl" />
            <img src={IMG.excavator} alt="Excavator on training ground" loading="lazy" className="absolute -bottom-6 -left-3 hidden w-1/2 rounded-2xl border-4 border-white object-cover shadow-xl sm:block" />
          </Reveal>
        </Container>
      </section>

      <section className="bg-navy-900 py-14 text-white sm:py-20">
        <Container className="grid gap-6 md:grid-cols-3">
          {[
            [Target, "Mission", "To produce safe, competent and employable operators through practical, standards-driven training."],
            [Eye, "Vision", "To be the region's most trusted centre of excellence for vocational equipment training."],
            [ShieldCheck, "Values", "Safety first. Practical excellence. Integrity. Respect for every trainee and every site."],
          ].map(([I, t, d], i) => {
            const Ic = I as typeof Target;
            return (
              <Reveal key={t as string} delay={i * 90}>
                <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-7">
                  <Ic className="mb-4 h-9 w-9 text-red-400" />
                  <h3 className="text-3xl font-bold uppercase">{t as string}</h3>
                  <p className="mt-2 text-navy-100">{d as string}</p>
                </div>
              </Reveal>
            );
          })}
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container>
          <SectionHead eyebrow="Facilities & Equipment" title="A campus built for hands-on learning" />
          <div className="grid gap-6 sm:grid-cols-2">
            {facilities.map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <figure className="group relative overflow-hidden rounded-2xl">
                  <img src={f.image} alt={f.title} loading="lazy" className="aspect-[16/10] w-full object-cover transition duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-linear-to-t from-navy-950/90 via-navy-950/20 to-transparent" />
                  <figcaption className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
                    <h3 className="text-3xl font-bold uppercase">{f.title}</h3>
                    <p className="mt-1 text-navy-100">{f.text}</p>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-navy-50 py-16 sm:py-24">
        <Container>
          <SectionHead eyebrow="Our Instructors" title="Learn from people who've done the job" text="Every instructor holds professional certification and years of live-site experience." />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {instructors.map((i, k) => (
              <Reveal key={i.name} delay={k * 80}>
                <div className="group h-full overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                  <div className="relative aspect-[4/4.4] overflow-hidden"><img src={i.image} alt={i.name} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /><span className="absolute bottom-3 left-3 rounded-full bg-brand-red px-3 py-1 text-xs font-bold text-white">{i.exp} experience</span></div>
                  <div className="p-5"><h3 className="text-2xl font-bold uppercase text-navy-900">{i.name}</h3><div className="text-sm font-semibold text-brand-red">{i.role}</div><p className="mt-2 text-sm text-slate-600">{i.bio}</p></div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal><img src={IMG.safety} alt="Trainees wearing full PPE" loading="lazy" className="w-full rounded-2xl object-cover shadow-xl" /></Reveal>
          <Reveal delay={100}>
            <div className="mb-3 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-brand-red"><span className="h-0.5 w-6 bg-brand-red" />Safety Standards</div>
            <h2 className="text-4xl font-extrabold uppercase text-navy-900 sm:text-5xl">Safety is not a module. It's how we train.</h2>
            <ul className="mt-6 space-y-3">{safetyHighlights.map((h) => <li key={h} className="flex gap-3 text-lg"><span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-red text-white"><Check className="h-3 w-3" /></span>{h}</li>)}</ul>
          </Reveal>
        </Container>
      </section>
      <CTABand />
    </>
  );
}
