"use client";

/**
 * Login and signup, which are the same form with one extra field.
 *
 * Errors come back from the API rather than being guessed at on the client, so the
 * message a person reads is the actual reason they were refused. The submit button
 * is disabled while in flight; double-submitting a signup is how you end up with a
 * confusing "email already exists" on your own first attempt.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import Nav from "@/app/components/Nav";
import Starfield from "@/app/components/Starfield";
import { Astronaut, Telescope } from "@/app/components/SpaceCast";
import { useDict } from "@/app/hooks/useDict";
import { useUser } from "@/app/components/UserProvider";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const dict = useDict();
  const t = dict.account;
  const router = useRouter();
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const { setUser } = useUser();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isSignup = mode === "signup";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const r = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isSignup ? { name, email, password, lang } : { email, password }),
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

  const field =
    "w-full rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3 text-[15px] text-white placeholder:text-slate-600 transition-colors focus:border-indigo-400/50";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#060b18" }}>
      <div className="fixed inset-0 pointer-events-none z-0">
        <Starfield density={0.7} />
      </div>
      <div className="relative z-10">
        <Nav />
        <div className="flex justify-center px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="mb-6 text-center">
              {isSignup ? (
                <Astronaut className="mx-auto h-24 w-24" />
              ) : (
                <Telescope className="mx-auto h-24 w-24" />
              )}
              <h1 className="mt-3 text-3xl font-bold text-white">
                {isSignup ? t.signupTitle : t.loginTitle}
              </h1>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-400">
                {isSignup ? t.signupSub : t.loginSub}
              </p>
            </div>

            <form
              onSubmit={submit}
              className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-6"
            >
              {isSignup && (
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-medium text-slate-400">{t.name}</span>
                  <input
                    className={field}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-slate-400">{t.email}</span>
                <input
                  className={field}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-slate-400">{t.password}</span>
                <input
                  className={field}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  minLength={isSignup ? 8 : undefined}
                  required
                />
                {isSignup && (
                  <span className="mt-1.5 block text-[12px] text-slate-600">{t.passwordHint}</span>
                )}
              </label>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-[14px] text-rose-200"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full px-6 py-3.5 text-[15px] font-semibold text-white transition-transform hover:scale-[1.01] disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #6c6ed0, #b884ed)",
                  boxShadow: "0 0 24px rgba(108,110,208,0.35)",
                }}
              >
                {busy ? t.working : isSignup ? t.signup : t.login}
              </button>

              {!isSignup && (
                <Link
                  href={`/${lang}/forgot`}
                  className="block pt-1 text-center text-[14px] text-slate-500 transition-colors hover:text-slate-300"
                >
                  {dict.email.forgotLink}
                </Link>
              )}

              <p className="pt-1 text-center text-[14px] text-slate-500">
                {isSignup ? t.haveAccount : t.noAccount}{" "}
                <Link
                  href={`/${lang}/${isSignup ? "login" : "signup"}`}
                  className="font-semibold text-indigo-300 hover:text-indigo-200"
                >
                  {isSignup ? t.login : t.signup}
                </Link>
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
