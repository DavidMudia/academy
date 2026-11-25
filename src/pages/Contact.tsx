import { useState, type FormEvent } from "react";
import { Phone, MessageCircle, Mail, MapPin, Clock, CheckCircle2 } from "lucide-react";
import { Button, Container, Field, PageHero, Reveal, inputCls } from "../components/ui";
import { IMG, contact, programmes } from "../data";

export default function Contact() {
  const [sent, setSent] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
  };
  const cards = [
    { icon: Phone, title: "Call us", value: contact.phone, href: contact.phoneHref },
    { icon: MessageCircle, title: "WhatsApp", value: "Chat with admissions", href: `https://wa.me/${contact.whatsapp}` },
    { icon: Mail, title: "Email", value: contact.email, href: `mailto:${contact.email}` },
    { icon: MapPin, title: "Visit", value: contact.address, href: "https://maps.google.com/?q=Ikeja+Industrial+Estate+Lagos" },
  ];
  return (
    <>
      <PageHero eyebrow="Contact & Support" title="Let's talk training" text="Questions about programmes, fees, PPE purchases or registration? We're here to help." image={IMG.engineers} />

      <Container className="relative z-10 -mt-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c, i) => (
            <Reveal key={c.title} delay={i * 70}>
              <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="group flex h-full items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg transition hover:-translate-y-1 hover:border-brand-red">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-navy-900 text-white transition group-hover:bg-brand-red"><c.icon className="h-5 w-5" /></span>
                <div className="min-w-0"><div className="font-display text-xl font-bold uppercase text-navy-900">{c.title}</div><div className="break-words text-sm text-slate-600">{c.value}</div></div>
              </a>
            </Reveal>
          ))}
        </div>
      </Container>

      <section className="py-14 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-14">
          <Reveal>
            <h2 className="text-4xl font-extrabold uppercase text-navy-900">Send an enquiry</h2>
            <p className="mt-2 text-slate-600">We usually respond within one business day.</p>
            {sent ? (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
                <h3 className="mt-3 text-3xl font-bold uppercase text-navy-900">Enquiry received</h3>
                <p className="mt-1 text-slate-600">Thank you — our admissions team will get back to you shortly.</p>
                <div className="mt-5"><Button variant="navy" onClick={() => setSent(false)}>Send another</Button></div>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Full name"><input required className={inputCls} placeholder="Your name" /></Field>
                <Field label="Phone / WhatsApp"><input required type="tel" className={inputCls} placeholder="080..." /></Field>
                <div className="sm:col-span-2"><Field label="Email"><input required type="email" className={inputCls} placeholder="you@example.com" /></Field></div>
                <div className="sm:col-span-2">
                  <Field label="I'm interested in">
                    <select className={inputCls} defaultValue="">
                      <option value="">General enquiry</option>
                      {programmes.map((p) => <option key={p.slug}>{p.title}</option>)}
                      <option>PPE purchase</option>
                      <option>Corporate / group training</option>
                    </select>
                  </Field>
                </div>
                <div className="sm:col-span-2"><Field label="Message"><textarea required rows={5} className={inputCls} placeholder="How can we help?" /></Field></div>
                <div className="sm:col-span-2"><Button type="submit" size="lg" full className="sm:w-auto">Send enquiry</Button></div>
              </form>
            )}
          </Reveal>

          <Reveal delay={100} className="space-y-6">
            <div className="rounded-2xl bg-navy-900 p-6 text-white">
              <h3 className="mb-4 flex items-center gap-2 text-2xl font-bold uppercase"><Clock className="h-5 w-5 text-red-400" />Business Hours</h3>
              <ul className="divide-y divide-white/10">
                {contact.hours.map((h) => <li key={h.day} className="flex justify-between gap-4 py-3 text-sm"><span className="text-navy-100">{h.day}</span><b>{h.time}</b></li>)}
              </ul>
              <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noreferrer" className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-3 font-bold text-white transition hover:brightness-110"><MessageCircle className="h-5 w-5" />Message us on WhatsApp</a>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
              <iframe title="Academy location map" loading="lazy" className="h-72 w-full" src="https://www.openstreetmap.org/export/embed.html?bbox=3.3300%2C6.5800%2C3.4000%2C6.6400&layer=mapnik&marker=6.6018%2C3.3515" />
              <div className="flex items-start gap-3 bg-white p-4 text-sm text-slate-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" />{contact.address}</div>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
