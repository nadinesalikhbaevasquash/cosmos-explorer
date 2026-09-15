"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useDict } from "@/app/hooks/useDict";
import { Astronaut } from "@/app/components/SpaceCast";
import AuthShell, { field, primary, primaryStyle } from "@/app/components/AuthShell";
import { useUser } from "@/app/components/UserProvider";

function ResetForm() {
  const dict = useDict();
  const t = dict.email;
  const a = dict.account;
  const router = useRouter();
  const params = useParams();
  const search = useSearchParams();
  const lang = (params?.lang as string) || "en";
  const { setUser } = useUser();

  const token = search.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error ?? "Something went wrong.");
        return;
      }
      setUser(d.user);
      router.push(`/${lang}`);
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mb-6 text-center">
        <Astronaut className="mx-auto h-24 w-24" />
        <h1 className="mt-3 text-3xl font-bold text-white">{t.resetTitle}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-400">{t.resetSub}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        {!token ? (
          <>
            <p className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-[14px] leading-relaxed text-amber-100">
              {t.resetNoToken}
            </p>
            <Link
              href={`/${lang}/forgot`}
              className="mt-4 block text-center text-[14px] font-semibold text-indigo-300 hover:text-indigo-200"
            >
              {t.forgotLink}
            </Link>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-slate-400">
                {t.newPassword}
              </span>
              <input
                className={field}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
              <span className="mt-1.5 block text-[12px] text-slate-600">{a.passwordHint}</span>
            </label>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-[14px] text-rose-200"
              >
                {error}
              </p>
            )}

            <button type="submit" disabled={busy} className={primary} style={primaryStyle}>
              {busy ? a.working : t.resetCta}
            </button>
          </form>
        )}
      </div>
    </>
  );
}

export default function ResetPage() {
  // useSearchParams needs a Suspense boundary; without one the whole route is
  // forced dynamic and the build warns.
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
