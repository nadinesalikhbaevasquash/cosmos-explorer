"use client";

/**
 * The account block in the header: name, then log out.
 *
 * Matches Crossfire's treatment, for the same reason its comment gives — the name
 * is the natural door to your own account, and a header control is reachable from
 * every screen in a way a tab on one page is not.
 *
 * Renders a fixed-width placeholder while the session resolves so the nav does not
 * jump, and shows only a first name because "Hi, Nadine" reads like a person
 * talking and the full legal name does not.
 */

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useDict } from "@/app/hooks/useDict";
import { useUser } from "@/app/components/UserProvider";

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

export default function AccountControls() {
  const { user, loading, logout } = useUser();
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const t = useDict().account;
  const [busy, setBusy] = useState(false);

  // Hold the space rather than flashing "Sign in" and then replacing it.
  if (loading) return <span className="h-8 w-24" aria-hidden />;

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href={`/${lang}/login`}
          className="text-[14px] font-semibold text-slate-300 transition-colors hover:text-white"
        >
          {t.login}
        </Link>
        <Link
          href={`/${lang}/signup`}
          className="rounded-full border border-indigo-400/30 bg-indigo-500/15 px-4 py-2 text-[14px] font-semibold text-indigo-200 transition-colors hover:bg-indigo-500/25"
        >
          {t.signup}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/${lang}/profile`}
        className="text-[14px] font-semibold text-white transition-colors hover:text-indigo-300"
      >
        {t.greeting.replace("{name}", firstName(user.name))}
      </Link>
      <button
        onClick={async () => {
          setBusy(true);
          await logout();
          setBusy(false);
        }}
        disabled={busy}
        className="rounded-full border border-white/12 px-4 py-2 text-[14px] font-semibold text-slate-300 transition-colors hover:border-white/30 hover:text-white disabled:opacity-50"
      >
        {busy ? "…" : t.logout}
      </button>
    </div>
  );
}
