"use client";

import { useState } from "react";
import { useDict } from "@/app/hooks/useDict";
import { shareResult } from "@/app/lib/share";
import { track } from "@/app/lib/analytics";

/**
 * One share button for every result on the site, so they all behave the same way:
 * share sheet on a phone, clipboard on a laptop, and a label that confirms which.
 *
 * `text` is a function rather than a string so the result is built at the moment of
 * the tap, from whatever state is current, instead of at render time.
 */
export default function ShareButton({
  text,
  className = "",
  label,
}: {
  text: () => string;
  className?: string;
  label?: string;
}) {
  const t = useDict().share;
  const [state, setState] = useState<"idle" | "copied" | "shared" | "failed">("idle");

  async function onClick() {
    const outcome = await shareResult(text());
    if (outcome === "cancelled") return;
    if (outcome !== "failed") track("result_shared");
    setState(outcome);
    setTimeout(() => setState("idle"), 2200);
  }

  const shown =
    state === "copied" ? t.copied : state === "shared" ? t.shared : state === "failed" ? t.failed : label ?? t.button;

  return (
    <button onClick={onClick} className={className} aria-live="polite">
      {shown}
    </button>
  );
}
