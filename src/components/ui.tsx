import { useEffect, useRef, type ReactNode } from "react";
import { ArrowRight, Truck, Construction, Forklift, Cog } from "lucide-react";
import { cn } from "../utils/cn";
import { Link } from "../router";
import type { Programme } from "../data";

export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("is-visible");
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={cn("reveal", className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

type BtnProps = {
  to?: string;
  onClick?: () => void;
  variant?: "red" | "navy" | "outline" | "outlineDark" | "ghost";
  size?: "md" | "lg" | "sm";
  children: ReactNode;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  arrow?: boolean;
  full?: boolean;
};

export function Button({ to, onClick, variant = "red", size = "md", children, className, type = "button", disabled, arrow, full }: BtnProps) {
  const cls = cn(
    "group inline-flex items-center justify-center gap-2 rounded-lg font-semibold tracking-wide transition-all duration-300 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red",
    size === "sm" && "px-4 py-2 text-sm",
    size === "md" && "px-5 py-3 text-[15px]",
    size === "lg" && "px-7 py-4 text-base",
    variant === "red" && "bg-brand-red text-white shadow-lg shadow-brand-red/25 hover:bg-brand-red-dark hover:-translate-y-0.5",
    variant === "navy" && "bg-navy-900 text-white hover:bg-navy-700 hover:-translate-y-0.5",
    variant === "outline" && "border-2 border-white/80 text-white hover:bg-white hover:text-navy-900",
    variant === "outlineDark" && "border-2 border-navy-900 text-navy-900 hover:bg-navy-900 hover:text-white",
    variant === "ghost" && "text-navy-900 hover:bg-navy-50",
    full && "w-full",
    className,
  );
  const inner = (
    <>
      {children}
      {arrow && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {inner}
    </button>
  );
}

export function SectionHead({ eyebrow, title, text, light, center = true }: { eyebrow?: string; title: string; text?: string; light?: boolean; center?: boolean }) {
  return (
    <Reveal className={cn("mb-10 max-w-2xl sm:mb-14", center && "mx-auto text-center")}>
      {eyebrow && (
        <div className={cn("mb-3 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-brand-red", center ? "justify-center" : "")}>
          <span className="h-0.5 w-6 bg-brand-red" />
          {eyebrow}
        </div>
      )}
      <h2 className={cn("text-4xl font-extrabold uppercase sm:text-5xl", light ? "text-white" : "text-navy-900")}>{title}</h2>
      {text && <p className={cn("mt-4 text-base leading-relaxed sm:text-lg", light ? "text-navy-100" : "text-slate-600")}>{text}</p>}
    </Reveal>
  );
}

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function ProgrammeIcon({ icon, className }: { icon: Programme["icon"]; className?: string }) {
  const I = { truck: Truck, crane: Construction, excavator: Cog, forklift: Forklift }[icon];
  return <I className={className} />;
}

export function PageHero({ eyebrow, title, text, image }: { eyebrow: string; title: string; text?: string; image: string }) {
  return (
    <section className="relative isolate overflow-hidden bg-navy-900 pt-28 pb-14 text-white sm:pt-36 sm:pb-20">
      <img src={image} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-40" />
      <div className="absolute inset-0 -z-10 bg-linear-to-r from-navy-950 via-navy-900/85 to-navy-900/40" />
      <Container>
        <div className="animate-fade-up max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-red-400">
            <span className="h-0.5 w-6 bg-brand-red" /> {eyebrow}
          </div>
          <h1 className="text-5xl font-extrabold uppercase sm:text-6xl">{title}</h1>
          {text && <p className="mt-4 max-w-2xl text-lg text-navy-100">{text}</p>}
        </div>
      </Container>
    </section>
  );
}

export function Field({ label, error, children, hint }: { label: string; error?: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-navy-900">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-brand-red">{error}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-[15px] text-navy-900 outline-none transition placeholder:text-slate-400 focus:border-navy-500 focus:ring-4 focus:ring-navy-100";
