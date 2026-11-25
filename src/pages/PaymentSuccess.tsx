import { CheckCircle2, KeyRound } from "lucide-react";
import { Button, Container, PageHero } from "../components/ui";
import { IMG } from "../data";

export default function PaymentSuccess() {
  return (
    <>
      <PageHero eyebrow="Payment verified" title="You’re registered" text="Paystack confirmed your payment." image={IMG.craneNight} />
      <section className="bg-navy-50 py-16 sm:py-24">
        <Container className="max-w-2xl">
          <div className="rounded-2xl bg-white p-8 text-center shadow-xl sm:p-12">
            <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" />
            <h2 className="mt-5 text-3xl font-extrabold uppercase text-navy-900">Payment confirmed</h2>
            <p className="mt-3 text-slate-600">Your student account has been created. Check your email and WhatsApp for your portal credentials and payment receipt.</p>
            <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-navy-50 p-4 text-left text-sm text-slate-700">
              <KeyRound className="h-5 w-5 shrink-0 text-brand-red" />
              If your credentials do not arrive, contact admissions so the administrator can securely resend them.
            </div>
            <Button to="/login" className="mt-7">Go to student login</Button>
          </div>
        </Container>
      </section>
    </>
  );
}
