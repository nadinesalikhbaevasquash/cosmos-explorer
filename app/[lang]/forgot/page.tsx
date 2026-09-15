"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useDict } from "@/app/hooks/useDict";
import { Telescope } from "@/app/components/SpaceCast";
import AuthShell, { field, primary, primaryStyle } from "@/app/components/AuthShell";

export default function ForgotPage() {
  const dict = useDict();
  const t = dict.email;
  const a = dict.account;
  const params = useParams();
  const lang = (params?.lang as string) || "en";

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, lang }),
      });
    } catch {
      /* The endpoint always answers 200 anyway; a network failure gets the same
         reassuring message, because telling them apart tells an attacker which
         addresses exist. */
    } finally {
      setSent(true);
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <div className="mb-6 text-center">
        <Telescope className="mx-auto h-24 w-24" />
        <h1 className="mt-3 text-3xl font-bold text-white">{t.forgotTitle}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-400">{t.forgotSub}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        {sent ? (
          <>
            <p className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-[14px] leading-relaxed text-emerald-100">
              {t.forgotSent}
            </p>
            <Link
              href={`/${lang}/login`}
              className="mt-4 block text-center text-[14px] font-semibold text-indigo-300 hover:text-indigo-200"
            >
              {t.backToLogin}
            </Link>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-slate-400">{a.email}</span>
              <input
                className={field}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>
            <button type="submit" disabled={busy} className={primary} style={primaryStyle}>
              {busy ? a.working : t.forgotCta}
            </button>
            <Link
              href={`/${lang}/login`}
              className="block pt-1 text-center text-[14px] text-slate-500 hover:text-slate-300"
            >
              {t.backToLogin}
            </Link>
          </form>
        )}
      </div>
    </AuthShell>
  );
}
