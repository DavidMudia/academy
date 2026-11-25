import { contact, fmtDate, getBatch, getProgramme, money, type Batch } from "./data";
import type { Application } from "./store";

export function downloadReceipt(app: Application, currentBatch?: Batch) {
  const p = app.payment;
  if (!p) return;
  const prog = getProgramme(app.programme);
  const batch = currentBatch ?? getBatch(app.batch);
  const bd = p.breakdown;
  const row = (l: string, v: string, cls = "") => `<tr class="${cls}"><td>${l}</td><td style="text-align:right">${v}</td></tr>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Receipt ${p.reference}</title>
<style>
body{font-family:Arial,Helvetica,sans-serif;color:#1b2540;margin:0;background:#eef2fa;padding:24px}
.sheet{max-width:720px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(10,31,68,.15)}
.head{background:#0a1f44;color:#fff;padding:28px 32px;display:flex;justify-content:space-between;align-items:center;border-bottom:6px solid #d8232a}
.head h1{margin:0;font-size:22px;letter-spacing:.04em;text-transform:uppercase}.head small{color:#b3c4e6;display:block;margin-top:4px}
.paid{background:#16a34a;color:#fff;padding:6px 14px;border-radius:99px;font-weight:700;font-size:13px}
.body{padding:28px 32px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px}
.l{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#64748b}.v{font-weight:700;margin-top:2px}
table{width:100%;border-collapse:collapse}td{padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:14px}
.total td{font-size:18px;font-weight:800;border-top:2px solid #0a1f44;border-bottom:0;color:#0a1f44}
.disc td{color:#16a34a}.foot{background:#f8fafc;padding:18px 32px;font-size:12px;color:#64748b;text-align:center}
@media print{body{background:#fff;padding:0}.sheet{box-shadow:none}}
</style></head><body><div class="sheet">
<div class="head"><div><h1>Oldam Technologies</h1><small>International Training Academy · Official Payment Receipt</small></div><span class="paid">PAID</span></div>
<div class="body">
<div class="grid">
<div><div class="l">Receipt no.</div><div class="v">${p.reference}</div></div>
<div><div class="l">Date paid</div><div class="v">${new Date(p.paidAt).toLocaleString("en-GB")}</div></div>
<div><div class="l">Student</div><div class="v">${app.personal.firstName} ${app.personal.lastName}</div></div>
<div><div class="l">Application ID</div><div class="v">${app.id}</div></div>
<div><div class="l">Programme</div><div class="v">${prog?.title ?? ""}</div></div>
<div><div class="l">Batch / Start date</div><div class="v">${app.batch}${batch ? " · " + fmtDate(batch.start) : ""}</div></div>
<div><div class="l">Payment method</div><div class="v">${p.method}</div></div>
<div><div class="l">Status</div><div class="v">Verified</div></div>
</div>
<table>
${row("Registration fee", money(bd.registration))}
${row("Tuition fee", money(bd.tuition))}
${bd.earlyBird ? row("Early-bird discount", "−" + money(bd.earlyBird), "disc") : ""}
${bd.promo ? row("Promo code (" + bd.promoCode + ")", "−" + money(bd.promo), "disc") : ""}
${row("Total paid", money(p.amount), "total")}
</table></div>
<div class="foot">${contact.address}<br>${contact.phone} · ${contact.email}<br><br>This is a computer-generated receipt. Print this page to save as PDF.</div>
</div></body></html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Oldam-Receipt-${p.reference}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
