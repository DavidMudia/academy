import { CircleAlert } from "lucide-react";
import { Button, Container, PageHero } from "../components/ui";
import { IMG } from "../data";

export default function PaymentFailed() {
  return (
    <>
      <PageHero eyebrow="Payment not confirmed" title="Checkout was not completed" text="No student account has been created for this application." image={IMG.craneNight} />
      <section className="bg-navy-50 py-16 sm:py-24">
        <Container className="max-w-2xl">
          <div className="rounded-2xl bg-white p-8 text-center shadow-xl sm:p-12">
            <CircleAlert className="mx-auto h-16 w-16 text-amber-500" />
            <h2 className="mt-5 text-3xl font-extrabold uppercase text-navy-900">Payment remains unconfirmed</h2>
            <p className="mt-3 text-slate-600">Paystack did not confirm a completed payment. Contact admissions to request a fresh secure payment link; your account will be created only after payment is verified.</p>
            <Button to="/contact" className="mt-7">Contact admissions</Button>
          </div>
        </Container>
      </section>
    </>
  );
}
