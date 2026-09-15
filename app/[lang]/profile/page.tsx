"use client";

/**
 * Your account.
 *
 * Shows the two things an account is actually for here: how far along the learning
 * path you are, and your quiz streak. Anyone not signed in is sent to the login
 * page rather than shown an empty shell.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import Nav from "@/app/components/Nav";
import Starfield from "@/app/components/Starfield";
import { Astronaut, Target, EarthGlobe } from "@/app/components/SpaceCast";
import { useDict } from "@/app/hooks/useDict";
import { useUser } from "@/app/components/UserProvider";

export default function ProfilePage() {
  const { user, loading, logout } = useUser();
  const dict = useDict();
  const t = dict.account;
  const router = useRouter();
  const params = useParams();
  const lang = (params?.lang as string) || "en";

  const [resent, setResent] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace(`/${lang}/login`);
  }, [loading, user, router, lang]);

  async function resendVerification() {
    if (sending) return;
    setSending(true);
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang }),
      });
      setResent(true);
    } catch {
      /* Best-effort. The button stays available to try again. */
    } finally {
      setSending(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#060b18" }}>
        <Nav />
      </div>
    );
  }

  const joined = new Date(user.createdAt ?? Date.now()).toLocaleDateString(
    lang === "ru" ? "ru-RU" : lang === "uz" ? "uz-UZ" : "en-GB",
    { year: "numeric", month: "long" },
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#060b18" }}>
      <div className="fixed inset-0 pointer-events-none z-0">
        <Starfield density={0.7} />
      </div>
      <div className="relative z-10">
        <Nav />
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl px-6 py-16"
        >
          <div className="flex items-center gap-5">
            <Astronaut className="h-24 w-24 flex-shrink-0" />
            <div>
              <h1 className="text-3xl font-bold text-white">{user.name}</h1>
              <p className="mt-1 text-[15px] text-slate-400">{user.email}</p>
              <p className="mt-0.5 text-[13px] text-slate-600">
                {t.memberSince} {joined}
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <EarthGlobe className="h-12 w-12" />
              <p className="mt-4 text-4xl font-bold tabular-nums text-white">
                {user.pathDone?.length ?? 0}
                <span className="text-2xl text-slate-600"> / 7</span>
              </p>
              <p className="mt-1 text-[14px] text-slate-400">{t.stopsDone}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <Target className="h-12 w-12" />
              <p className="mt-4 text-4xl font-bold tabular-nums text-white">
                {user.quiz?.streak ?? 0}
              </p>
              <p className="mt-1 text-[14px] text-slate-400">{t.streak}</p>
            </div>
          </div>

          {/* Unconfirmed addresses get one gentle prompt. Nothing is gated on it —
              it only matters the day they forget their password. */}
          {!user.emailVerifiedAt && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/25 bg-amber-500/[0.08] px-5 py-4">
              <p className="text-[14.5px] text-amber-100">
                {resent ? dict.email.verifySent : dict.email.verifyPending}
              </p>
              {!resent && (
                <button
                  onClick={resendVerification}
                  disabled={sending}
                  className="rounded-full border border-amber-400/40 px-4 py-2 text-[14px] font-semibold text-amber-200 transition-colors hover:bg-amber-500/15 disabled:opacity-50"
                >
                  {sending ? dict.account.working : dict.email.verifyResend}
                </button>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/${lang}`}
              className="rounded-full px-6 py-3 text-[15px] font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #6c6ed0, #b884ed)" }}
            >
              {dict.path.continue}
            </Link>
            <button
              onClick={() => logout().then(() => router.push(`/${lang}`))}
              className="rounded-full border border-white/12 px-6 py-3 text-[15px] font-medium text-slate-300 transition-colors hover:border-white/30 hover:text-white"
            >
              {t.logout}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
