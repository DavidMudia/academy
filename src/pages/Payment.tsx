import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, CreditCard, Loader2, Lock, Tag } from "lucide-react";
import { Button, Container, PageHero, inputCls } from "../components/ui";
import { IMG, PROMO_CODES, fmtDate, money } from "../data";
import { apiRequest } from "../api";
import { computeBreakdown, type Breakdown } from "../store";
import { cn } from "../utils/cn";

type PaymentLinkDetails = {
  applicationId: string;
  applicant: string;
  email: string;
  programme: { slug: string; title: string; image: string; tuition: number };
  batch: { id: string; start: string; mode: string; campus: string; earlyBird: boolean };
  breakdown: Breakdown;
};

export default function Payment({ id, token }: { id: string; token?: string }) {
  const [details, setDetails] = useState<PaymentLinkDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<string>();
  const [promoMessage, setPromoMessage] = useState("");
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    let active = true;
    if (!token) {
      setError("This page can only be opened from the payment link sent by admissions.");
      setLoading(false);
      return;
    }
    void apiRequest<PaymentLinkDetails>(`/payment-links/${encodeURIComponent(token)}`)
      .then((result) => {
        if (active && result.applicationId === id) setDetails(result);
        else if (active) setError("This payment link does not match the application.");
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Unable to load this payment link.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, token]);

  const breakdown = useMemo(
    () => details ? computeBreakdown(details.programme.tuition, details.batch.earlyBird, promo) : null,
    [details, promo],
  );

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (PROMO_CODES[code]) {
      setPromo(code);
      setPromoMessage(`${PROMO_CODES[code]}% discount applied.`);
    } else {
      setPromo(undefined);
      setPromoMessage("Invalid or expired code.");
    }
  };

  const beginPayment = async () => {
    if (!token) return;
    setError("");
    setRedirecting(true);
    try {
      const result = await apiRequest<{ authorizationUrl: string }>("/payments/initialize", {
        method: "POST",
        body: JSON.stringify({ token, promoCode: promo }),
      });
      window.location.assign(result.authorizationUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start checkout.");
      setRedirecting(false);
    }
  };

  if (loading) {
    return <Container className="py-40 text-center"><Loader2 className="mx-auto h-10 w-10 animate-spin text-brand-red" /><p className="mt-4 text-slate-600">Validating your secure payment link…</p></Container>;
  }

  if (!details || !breakdown) {
    return (
      <Container className="py-40 text-center">
        <h1 className="text-4xl font-extrabold uppercase text-navy-900">Payment link unavailable</h1>
        <p role="alert" className="mt-3 text-slate-600">{error || "Ask admissions to send you a new payment link."}</p>
        <Button to="/contact" className="mt-6">Contact admissions</Button>
      </Container>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="Admissions-approved checkout"
        title="Complete your payment"
        text={`Application ${details.applicationId} · ${details.programme.title}`}
        image={IMG.craneNight}
      />
      <section className="bg-navy-50 pb-20 pt-8 sm:pt-12">
        <Container className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:gap-8">
          <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-8">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-navy-900 text-white"><CreditCard className="h-6 w-6" /></span>
              <div>
                <h2 className="text-2xl font-extrabold uppercase text-navy-900">Secure Paystack checkout</h2>
                <p className="mt-1 text-sm text-slate-600">This one-time link was issued by admissions for {details.applicant} ({details.email}).</p>
              </div>
            </div>
            <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
              <CheckCircle2 className="mr-2 inline h-5 w-5 align-middle" />
              Your application has been approved. A student account is created only after Paystack verifies your payment.
            </div>
            <div className="mt-6 rounded-xl border border-slate-200 p-4">
              <div className="flex gap-2">
                <div className="relative flex-1"><Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={promoInput} onChange={(event) => setPromoInput(event.target.value)} placeholder="Promo code (optional)" className={inputCls + " pl-9 uppercase"} /></div>
                <Button variant="navy" onClick={applyPromo} disabled={!promoInput}>Apply</Button>
              </div>
              {promoMessage && <p className={cn("mt-2 text-xs font-semibold", promo ? "text-emerald-700" : "text-brand-red")}>{promoMessage}</p>}
            </div>
            {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-brand-red">{error}</p>}
            <Button onClick={beginPayment} disabled={redirecting} full size="lg" className="mt-6">
              {redirecting ? <><Loader2 className="h-5 w-5 animate-spin" />Opening Paystack…</> : <><Lock className="h-5 w-5" />Pay {money(breakdown.total)} securely <ArrowRight className="h-4 w-4" /></>}
            </Button>
            <p className="mt-3 text-center text-xs text-slate-500">Card and payment details are entered only on Paystack. This site never stores them.</p>
          </div>

          <aside className="h-fit overflow-hidden rounded-2xl bg-white shadow-xl">
            <img src={details.programme.image} alt="" className="h-36 w-full object-cover" />
            <div className="p-6">
              <div className="text-xs font-bold uppercase tracking-wider text-brand-red">Approved application</div>
              <h3 className="mt-1 text-2xl font-extrabold uppercase text-navy-900">{details.programme.title}</h3>
              <p className="text-sm text-slate-600">Batch {details.batch.id} · starts {fmtDate(details.batch.start)} · {details.batch.mode}</p>
              <dl className="mt-5 space-y-3 border-t border-slate-100 pt-5 text-sm">
                <div className="flex justify-between"><dt className="text-slate-600">Registration fee</dt><dd className="font-semibold">{money(breakdown.registration)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-600">Tuition fee</dt><dd className="font-semibold">{money(breakdown.tuition)}</dd></div>
                {breakdown.earlyBird > 0 && <div className="flex justify-between text-emerald-700"><dt>Early-bird discount</dt><dd className="font-semibold">−{money(breakdown.earlyBird)}</dd></div>}
                {breakdown.promo > 0 && <div className="flex justify-between text-emerald-700"><dt>Promo {breakdown.promoCode}</dt><dd className="font-semibold">−{money(breakdown.promo)}</dd></div>}
                <div className="flex items-end justify-between border-t-2 border-navy-900 pt-4"><dt className="font-bold text-navy-900">Total payable</dt><dd className="font-display text-3xl font-extrabold text-navy-900">{money(breakdown.total)}</dd></div>
              </dl>
            </div>
          </aside>
        </Container>
      </section>
    </>
  );
}
