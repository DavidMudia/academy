import { useEffect } from "react";
import { ShieldCheck, FileText, CalendarCheck, Award } from "lucide-react";
import { AccountForm } from "../components/AccountForm";
import { Container } from "../components/ui";
import { Logo } from "../components/Layout";
import { IMG } from "../data";
import { Link, navigate } from "../router";
import { useStore } from "../store";

export default function Auth() {
  const { user } = useStore();
  useEffect(() => {
    if (user) navigate(user.role === "admin" ? "/admin" : "/portal");
  }, [user]);
  return (
    <section className="relative isolate min-h-screen overflow-hidden bg-navy-950 pt-28 pb-16 sm:pt-36">
      <img src={IMG.crane} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-30" />
      <div className="absolute inset-0 -z-10 bg-linear-to-br from-navy-950 via-navy-900/90 to-navy-800/70" />
      <Container className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="hidden text-white lg:block">
          <h1 className="text-6xl font-extrabold uppercase">Your training,<br /><span className="text-brand-red">all in one place.</span></h1>
          <p className="mt-4 max-w-md text-lg text-navy-100">Log in to the Oldam Student Portal to follow your application and manage your training.</p>
          <ul className="mt-8 space-y-4">
            {[[FileText, "Applications & payments"], [CalendarCheck, "Schedules, materials & attendance"], [Award, "Results & downloadable certificates"], [ShieldCheck, "Secure, private student records"]].map(([I, t]) => {
              const Ic = I as typeof Award;
              return <li key={t as string} className="flex items-center gap-3 font-semibold"><span className="grid h-10 w-10 place-items-center rounded-lg bg-white/10"><Ic className="h-5 w-5 text-red-400" /></span>{t as string}</li>;
            })}
          </ul>
        </div>
        <div className="animate-fade-up mx-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
          <div className="mb-6 rounded-xl bg-navy-900 p-4"><Logo /></div>
          <h2 className="mb-1 text-3xl font-extrabold uppercase text-navy-900">Student access</h2>
          <p className="mb-5 text-sm text-slate-600">Log in to your student portal or administrator dashboard.</p>
          <AccountForm onDone={(role) => navigate(role === "admin" ? "/admin" : "/portal")} />
          <p className="mt-4 text-center text-sm text-slate-600">Academy staff? <Link to="/admin" className="font-bold text-brand-red hover:underline">Administrator sign-in</Link></p>
        </div>
      </Container>
    </section>
  );
}
