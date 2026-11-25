import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button, Field, inputCls } from "./ui";
import { useStore } from "../store";

export function AccountForm({ onDone }: { onDone: (role: "admin" | "student") => void }) {
  const { logIn } = useStore();
  const [f, setF] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [show, setShow] = useState(false);
  const set = (key: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [key]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const result = await logIn(f.email, f.password);
      if (!result.ok) setError(result.error);
      else onDone(result.role);
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Email address">
        <input required type="email" className={inputCls} value={f.email} onChange={set("email")} placeholder="you@example.com" autoComplete="email" />
      </Field>
      <Field label="Password">
        <div className="relative">
          <input required type={show ? "text" : "password"} className={inputCls + " pr-12"} value={f.password} onChange={set("password")} placeholder="Your password" autoComplete="current-password" />
          <button type="button" onClick={() => setShow(!show)} aria-label="Toggle password" className="absolute inset-y-0 right-3 text-slate-500">{show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
        </div>
      </Field>
      {error && <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-brand-red">{error}</div>}
      <Button type="submit" disabled={pending} full size="lg">{pending ? "Signing in…" : "Log in"}</Button>
      <p className="text-center text-sm text-slate-600">Student accounts are created after an application is approved and payment is verified.</p>
    </form>
  );
}
