import { CheckCircle2, Clock3, Mail, MessageCircle } from "lucide-react";
import { Button, Container, PageHero } from "../components/ui";
import { IMG } from "../data";
import { useRoute } from "../router";

export default function ApplicationSubmitted() {
  const { params } = useRoute();
  const id = params.get("id");

  return (
    <>
      <PageHero
        eyebrow="Application received"
        title="Thank you for applying"
        text={id ? `Application ${id} is now with our admissions team.` : "Your application is now with our admissions team."}
        image={IMG.crew}
      />
      <section className="bg-navy-50 py-16 sm:py-24">
        <Container className="max-w-2xl">
          <div className="rounded-2xl bg-white p-8 text-center shadow-xl sm:p-12">
            <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" />
            <h2 className="mt-5 text-3xl font-extrabold uppercase text-navy-900">Next: admissions review</h2>
            <p className="mt-3 text-slate-600">
              You do not need to pay yet. An administrator will review your application. If it is approved, we’ll send a secure payment link to the email address and phone number you provided.
            </p>
            <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
              <div className="rounded-xl bg-navy-50 p-4">
                <Clock3 className="h-5 w-5 text-brand-red" />
                <p className="mt-2 font-bold text-navy-900">Wait for approval</p>
                <p className="text-sm text-slate-600">Your application must be approved before payment is enabled.</p>
              </div>
              <div className="rounded-xl bg-navy-50 p-4">
                <Mail className="h-5 w-5 text-brand-red" />
                <MessageCircle className="mt-2 h-5 w-5 text-brand-red" />
                <p className="mt-2 font-bold text-navy-900">Check your messages</p>
                <p className="text-sm text-slate-600">After verified payment, your student portal credentials will be sent to you.</p>
              </div>
            </div>
            <Button to="/" className="mt-7">Back to home</Button>
          </div>
        </Container>
      </section>
    </>
  );
}
