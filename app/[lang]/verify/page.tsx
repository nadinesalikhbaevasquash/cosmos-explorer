"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useDict } from "@/app/hooks/useDict";
import { SunStar, BlackHole } from "@/app/components/SpaceCast";
import AuthShell from "@/app/components/AuthShell";

function VerifyResult() {
  const t = useDict().email;
  const params = useParams();
  const search = useSearchParams();
  const lang = (params?.lang as string) || "en";
  const ok = search.get("state") === "ok";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
      {ok ? <SunStar className="mx-auto h-24 w-24" /> : <BlackHole className="mx-auto h-24 w-24" />}
      <h1 className="mt-4 text-2xl font-bold text-white">
        {ok ? t.verifyOkTitle : t.verifyBadTitle}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-slate-400">
        {ok ? t.verifyOkBody : t.verifyBadBody}
      </p>
      <Link
        href={`/${lang}`}
        className="mt-6 inline-block rounded-full px-6 py-3 text-[15px] font-semibold text-white"
        style={{ background: "linear-gradient(135deg, #6c6ed0, #b884ed)" }}
      >
        {t.goHome}
      </Link>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <VerifyResult />
      </Suspense>
    </AuthShell>
  );
}
