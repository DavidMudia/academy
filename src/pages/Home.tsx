import { Award, Wrench, Users, Briefcase, ShieldCheck, Check, Star, Quote, ChevronDown } from "lucide-react";
import { Button, Container, Reveal, SectionHead } from "../components/ui";
import { BatchCard, CTABand, FAQ, ProgrammeCard } from "../components/shared";
import { Link } from "../router";
import { IMG, batches, daysUntil, faqs, programmes, safetyHighlights, sellingPoints, stats, testimonials } from "../data";

const icons = { award: Award, wrench: Wrench, users: Users, briefcase: Briefcase, shield: ShieldCheck } as const;

export default function Home() {
  const upcoming = [...batches].filter((b) => daysUntil(b.deadline) >= 0).sort((a, b) => a.start.localeCompare(b.start)).slice(0, 3);

  return (
    <>
      {/* HERO */}
      <section className="relative isolate flex min-h-[92vh] items-center overflow-hidden bg-navy-950 text-white">
        <img src={IMG.hero} alt="Excavator working on an active construction site" className="hero-zoom absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-linear-to-r from-navy-950 via-navy-900/85 to-navy-900/30 sm:via-navy-900/70" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-linear-to-t from-navy-950/80 to-transparent" />
        <Container className="pb-28 pt-32 sm:pt-40">
          <div className="max-w-3xl">
            <div className="animate-fade-up mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] backdrop-blur sm:text-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand-red" /> Now enrolling · New intakes open
            </div>
            <h1 className="animate-fade-up text-[3.1rem] font-extrabold uppercase leading-[0.95] sm:text-7xl lg:text-8xl" style={{ animationDelay: "80ms" }}>
              Professional Operator Training for a <span className="text-brand-red">Stronger,</span> Safer Tomorrow.
            </h1>
            <p className="animate-fade-up mt-6 max-w-xl text-lg leading-relaxed text-navy-100 sm:text-xl" style={{ animationDelay: "180ms" }}>
              Oldam Technologies International Training Academy trains certified truck drivers, crane, heavy equipment and forklift operators — with real machines, expert instructors and a safety-first culture.
            </p>
            <div className="animate-fade-up mt-8 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "280ms" }}>
              <Button to="/programmes" size="lg" arrow>Explore Programmes</Button>
              <Button to="/contact" size="lg" variant="outline">Contact Us</Button>
            </div>
          </div>
        </Container>
        <a href="#/programmes" aria-label="Scroll" className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 animate-float text-white/70 sm:block"><ChevronDown className="h-8 w-8" /></a>
      </section>

      {/* STATS */}
      <section className="relative z-10 -mt-14 sm:-mt-16">
        <Container>
          <Reveal>
            <div className="grid grid-cols-2 overflow-hidden rounded-2xl bg-white shadow-2xl shadow-navy-900/20 lg:grid-cols-4">
              {stats.map((s, i) => (
                <div key={s.label} className={`px-4 py-6 text-center sm:py-8 ${i % 2 === 0 ? "border-r" : ""} ${i < 2 ? "border-b lg:border-b-0" : ""} ${i === 1 ? "lg:border-r" : ""} border-slate-100`}>
                  <div className="font-display text-4xl font-extrabold text-navy-900 sm:text-5xl">{s.value}</div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:text-sm">{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </Container>
      </section>

      {/* PROGRAMMES */}
      <section className="py-16 sm:py-24">
        <Container>
          <SectionHead eyebrow="Our Programmes" title="Train for the machine you want to master" text="Four industry-recognised operator programmes, each combining expert theory with extensive hands-on time." />
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {programmes.map((p, i) => <ProgrammeCard key={p.slug} p={p} delay={i * 90} />)}
          </div>
        </Container>
      </section>

      {/* WHY US */}
      <section className="stripe-bg relative bg-navy-900 py-16 text-white sm:py-24">
        <Container>
          <SectionHead light eyebrow="Why Oldam" title="Built on skill, safety and results" text="We don't just teach you to operate — we prepare you for a career and a lifetime of safe work." />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sellingPoints.map((s, i) => {
              const I = icons[s.icon as keyof typeof icons];
              return (
                <Reveal key={s.title} delay={i * 70}>
                  <div className="group h-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-brand-red/60 hover:bg-white/10">
                    <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-brand-red text-white transition group-hover:rotate-6 group-hover:scale-110"><I className="h-6 w-6" /></span>
                    <h3 className="text-2xl font-bold uppercase">{s.title}</h3>
                    <p className="mt-2 text-navy-100">{s.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </section>

      {/* PRACTICAL & SAFETY */}
      <section className="py-16 sm:py-24">
        <Container className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal className="relative">
            <div className="grid grid-cols-5 grid-rows-2 gap-3">
              <img src={IMG.crew} alt="Trainees in hard hats during a site briefing" loading="lazy" className="col-span-3 row-span-2 h-full min-h-72 w-full rounded-2xl object-cover shadow-xl" />
              <img src={IMG.forkliftCab} alt="Forklift controls" loading="lazy" className="col-span-2 h-full w-full rounded-2xl object-cover shadow-xl" />
              <img src={IMG.craneNight} alt="Tower cranes at dusk" loading="lazy" className="col-span-2 h-full w-full rounded-2xl object-cover shadow-xl" />
            </div>
            <div className="absolute -bottom-5 left-4 rounded-xl bg-brand-red px-5 py-3 text-white shadow-xl sm:left-8">
              <div className="font-display text-4xl font-extrabold leading-none">70%</div>
              <div className="text-xs font-bold uppercase tracking-wider">Hands-on time</div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="mb-3 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-brand-red"><span className="h-0.5 w-6 bg-brand-red" />Practical & Safety</div>
            <h2 className="text-4xl font-extrabold uppercase text-navy-900 sm:text-5xl">Real machines. Real skills. Zero shortcuts.</h2>
            <p className="mt-4 text-lg text-slate-600">Our training ground replicates the demands of live sites, ports and warehouses. Every trainee gets extensive seat time under close, qualified supervision.</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {safetyHighlights.map((h) => (
                <li key={h} className="flex gap-3 text-[15px] font-medium text-navy-900">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-red text-white"><Check className="h-3 w-3" /></span>{h}
                </li>
              ))}
            </ul>
            <div className="mt-8"><Button to="/about" variant="navy" arrow>See our facilities</Button></div>
          </Reveal>
        </Container>
      </section>

      {/* INTAKES */}
      <section className="bg-navy-50 py-16 sm:py-24">
        <Container>
          <SectionHead eyebrow="Upcoming Intakes" title="Secure your seat in the next batch" text="Seats are limited per intake. Early-bird discounts apply to selected batches." />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((b, i) => <Reveal key={b.id} delay={i * 90}><BatchCard b={b} /></Reveal>)}
          </div>
          <div className="mt-10 text-center"><Button to="/schedule" variant="outlineDark" arrow>View full training schedule</Button></div>
        </Container>
      </section>

      {/* REGISTRATION STEPS */}
      <section className="py-16 sm:py-24">
        <Container>
          <SectionHead eyebrow="How to enrol" title="From first click to first class in six steps" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Discover", "Browse programmes and compare fees, duration and requirements."],
              ["Choose a batch", "Pick the intake date and mode that fits your life."],
              ["Apply online", "Send your contact details, application and supporting documents."],
              ["Wait for review", "An administrator reviews your application and sends an approval decision."],
              ["Pay by secure link", "After approval, use the personal Paystack link sent to your email or WhatsApp."],
              ["Join the portal", "After payment is verified, receive your student credentials by email and WhatsApp."],
            ].map(([t, d], i) => (
              <Reveal key={t} delay={i * 60}>
                <div className="relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-brand-red/40 hover:shadow-lg">
                  <span className="absolute -right-2 -top-4 font-display text-8xl font-extrabold text-navy-50">{i + 1}</span>
                  <h3 className="relative text-2xl font-bold uppercase text-navy-900">{t}</h3>
                  <p className="relative mt-2 text-slate-600">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button to="/register" size="lg" arrow>Start my application</Button>
            <Button to="/login" size="lg" variant="outlineDark">I already have an account</Button>
          </div>
        </Container>
      </section>

      {/* PPE SALES */}
      <section className="overflow-hidden bg-navy-900 text-white">
        <div className="grid lg:grid-cols-2">
          <div className="relative min-h-72 lg:min-h-[28rem]">
            <img src={IMG.safety} alt="Personal protective equipment for workplace safety" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-navy-900/60 to-transparent lg:bg-linear-to-r lg:from-transparent lg:to-navy-900" />
          </div>
          <Reveal className="px-4 py-14 sm:px-10 lg:py-20 lg:pr-16">
            <div className="mb-3 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-red-400"><span className="h-0.5 w-6 bg-brand-red" />PPE available for purchase</div>
            <h2 className="text-4xl font-extrabold uppercase sm:text-5xl">Work-ready protection at affordable prices.</h2>
            <p className="mt-4 max-w-xl text-lg text-navy-100">High-quality personal protective equipment (PPE) is available to purchase from Oldam Technologies at affordable prices. Contact us for product availability and details.</p>
            <div className="mt-6 grid max-w-xl grid-cols-2 gap-4">
              {["High-quality protective equipment", "Affordable prices", "Available for purchase", "Ask us about current stock"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl bg-white/5 p-3"><Check className="h-5 w-5 shrink-0 text-red-400" /><span className="text-sm font-semibold">{item}</span></div>
              ))}
            </div>
            <div className="mt-6"><Button to="/contact" arrow>Enquire about PPE</Button></div>
          </Reveal>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 sm:py-24">
        <Container>
          <SectionHead eyebrow="Success Stories" title="Trusted by operators across the industry" />
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 100}>
                <figure className="relative flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-xl">
                  <Quote className="absolute right-5 top-5 h-10 w-10 text-navy-100" />
                  <div className="mb-3 flex gap-0.5 text-amber-400">{Array.from({ length: 5 }).map((_, k) => <Star key={k} className="h-4 w-4 fill-current" />)}</div>
                  <blockquote className="flex-1 leading-relaxed text-slate-700">“{t.text}”</blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                    <img src={t.image} alt={t.name} loading="lazy" className="h-12 w-12 rounded-full object-cover ring-2 ring-brand-red" />
                    <div><div className="font-bold text-navy-900">{t.name}</div><div className="text-sm text-slate-500">{t.role}</div></div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="bg-navy-50 py-16 sm:py-24">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div>
            <SectionHead center={false} eyebrow="FAQ" title="Questions? We have answers." text="Can't find what you're looking for? Our admissions team replies quickly on WhatsApp." />
            <Button to="/contact" variant="navy" arrow>Contact admissions</Button>
            <p className="mt-6 text-sm text-slate-500">Prefer to browse? <Link to="/programmes" className="font-semibold text-brand-red hover:underline">See all programmes</Link></p>
          </div>
          <Reveal><FAQ items={faqs} /></Reveal>
        </Container>
      </section>

      <CTABand />
    </>
  );
}
