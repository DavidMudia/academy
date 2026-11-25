import { useEffect, useState, type ReactNode } from "react";
import { Menu, X, Phone, Mail, MapPin, MessageCircle, UserRound, LogOut } from "lucide-react";
import { Link, navigate, useRoute } from "../router";
import { cn } from "../utils/cn";
import { Button, Container } from "./ui";
import { contact, programmes } from "../data";
import { useStore } from "../store";

export function Logo({ light = true, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <svg viewBox="0 0 48 48" className="h-11 w-11 shrink-0" aria-hidden>
        <polygon points="24,2 43,13 43,35 24,46 5,35 5,13" fill="#d8232a" />
        <polygon points="24,7 39,15.5 39,32.5 24,41 9,32.5 9,15.5" fill="#0a1f44" />
        <circle cx="24" cy="24" r="8.5" fill="none" stroke="#fff" strokeWidth="3.5" />
        <path d="M17 33 L31 15" stroke="#d8232a" strokeWidth="3" strokeLinecap="round" />
      </svg>
      {!compact && (
        <span className="leading-none">
          <span className={cn("block font-display text-2xl font-extrabold uppercase tracking-wide", light ? "text-white" : "text-navy-900")}>
            Oldam <span className="text-brand-red">Technologies</span>
          </span>
          <span className={cn("mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.18em] sm:text-[11px]", light ? "text-navy-200" : "text-slate-500")}>
            International Training Academy
          </span>
        </span>
      )}
    </span>
  );
}

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/programmes", label: "Programmes" },
  { to: "/schedule", label: "Schedule" },
  { to: "/contact", label: "Contact" },
];

export function Navbar() {
  const { path } = useRoute();
  const { user } = useStore();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const solid = scrolled || open;
  const active = (to: string) => (to === "/" ? path === "/" : path.startsWith(to));

  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 transition-all duration-300", solid ? "bg-navy-900/95 shadow-xl backdrop-blur" : "bg-transparent")}>
      <div className="hidden bg-brand-red text-xs text-white lg:block">
        <Container className="flex h-8 items-center justify-between">
          <span>Next intake opens soon — limited seats per batch.</span>
          <span className="flex items-center gap-5">
            <a href={contact.phoneHref} className="flex items-center gap-1.5 hover:underline"><Phone className="h-3 w-3" />{contact.phone}</a>
            <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 hover:underline"><Mail className="h-3 w-3" />{contact.email}</a>
          </span>
        </Container>
      </div>
      <Container className="flex h-[68px] items-center justify-between gap-4">
        <Link to="/" aria-label="Oldam Technologies home"><Logo /></Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={cn("relative rounded-md px-3.5 py-2 text-[15px] font-semibold text-white/85 transition hover:text-white", active(l.to) && "text-white")}>
              {l.label}
              <span className={cn("absolute inset-x-3.5 -bottom-0.5 h-0.5 origin-left scale-x-0 bg-brand-red transition-transform", active(l.to) && "scale-x-100")} />
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button to={user ? user.role === "admin" ? "/admin" : "/portal" : "/login"} variant="outline" size="sm">
            <UserRound className="h-4 w-4" /> {user ? user.role === "admin" ? "Admin" : "My Portal" : "Student Login"}
          </Button>
          <Button to="/register" size="sm">Register Now</Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <Button to="/register" size="sm" className="px-3.5">Register</Button>
          <button onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={open} className="grid h-10 w-10 place-items-center rounded-lg text-white hover:bg-white/10">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </Container>

      {/* Mobile menu */}
      <div className={cn("overflow-hidden bg-navy-900 transition-[max-height] duration-500 lg:hidden", open ? "max-h-[calc(100vh-68px)]" : "max-h-0")}>
        <Container className="flex flex-col gap-1 pb-6 pt-2">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={cn("rounded-lg px-3 py-3.5 text-lg font-semibold text-white/85 hover:bg-white/5", active(l.to) && "bg-white/10 text-white")}>
              {l.label}
            </Link>
          ))}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Button to={user ? user.role === "admin" ? "/admin" : "/portal" : "/login"} variant="outline"><UserRound className="h-4 w-4" />{user ? user.role === "admin" ? "Admin" : "Portal" : "Login"}</Button>
            <Button to="/register">Register Now</Button>
          </div>
        </Container>
      </div>
    </header>
  );
}

export function Footer() {
  const { user, logOut } = useStore();
  return (
    <footer className="bg-navy-950 text-navy-200">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-5 text-sm leading-relaxed">
            A premier vocational academy producing safe, certified, job-ready operators for transport, construction, ports and industry.
          </p>
          <div className="mt-5 flex gap-2">
            {["Facebook", "Instagram", "LinkedIn", "YouTube"].map((n) => (
              <a key={n} href="#/contact" aria-label={n} title={n} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-xs font-bold text-white transition hover:bg-brand-red">
                {n.slice(0, 2)}
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="mb-4 text-xl font-bold uppercase text-white">Programmes</h4>
          <ul className="space-y-2.5 text-sm">
            {programmes.map((p) => (
              <li key={p.slug}><Link to={`/programmes/${p.slug}`} className="transition hover:text-white hover:underline">{p.title}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-xl font-bold uppercase text-white">Quick Links</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/about" className="hover:text-white hover:underline">About & Facilities</Link></li>
            <li><Link to="/schedule" className="hover:text-white hover:underline">Training Schedule</Link></li>
            <li><Link to="/register" className="hover:text-white hover:underline">Apply Online</Link></li>
            <li><Link to={user ? user.role === "admin" ? "/admin" : "/portal" : "/login"} className="hover:text-white hover:underline">{user?.role === "admin" ? "Admin Dashboard" : "Student Portal"}</Link></li>
            <li><Link to="/contact" className="hover:text-white hover:underline">Contact & Support</Link></li>
            {user && <li><button onClick={() => void logOut().then(() => navigate("/")).catch(() => undefined)} className="flex items-center gap-1.5 hover:text-white hover:underline"><LogOut className="h-3.5 w-3.5" />Log out</button></li>}
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-xl font-bold uppercase text-white">Contact</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" />{contact.address}</li>
            <li><a href={contact.phoneHref} className="flex gap-3 hover:text-white"><Phone className="h-4 w-4 shrink-0 text-brand-red" />{contact.phone}</a></li>
            <li><a href={`mailto:${contact.email}`} className="flex gap-3 break-all hover:text-white"><Mail className="h-4 w-4 shrink-0 text-brand-red" />{contact.email}</a></li>
            <li><a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noreferrer" className="flex gap-3 hover:text-white"><MessageCircle className="h-4 w-4 shrink-0 text-brand-red" />Chat on WhatsApp</a></li>
          </ul>
        </div>
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col items-center justify-between gap-2 py-5 text-xs sm:flex-row">
          <span>© {new Date().getFullYear()} Oldam Technologies International Training Academy. All rights reserved.</span>
          <span>Privacy Policy · Terms of Enrolment</span>
        </Container>
      </div>
    </footer>
  );
}

export function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent("Hello Oldam Academy, I'd like to enquire about your training programmes.")}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-[#25D366] p-3.5 text-white shadow-xl shadow-black/25 transition-all hover:scale-105 sm:bottom-6 sm:right-6 animate-float"
    >
      <MessageCircle className="h-6 w-6" />
      <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300 group-hover:max-w-40 group-hover:pr-1 sm:inline">Chat with us</span>
    </a>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
