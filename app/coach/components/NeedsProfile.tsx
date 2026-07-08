import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";

// Shown on results/roadmap when no profile exists yet in localStorage.
export default function NeedsProfile({ title, body }: { title: string; body: string }) {
  return (
    <main className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-tint text-sage-deep">
        <Compass className="h-7 w-7" />
      </span>
      <h1 className="font-display mt-6 text-3xl font-bold tracking-tight text-espresso">{title}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-cocoa">{body}</p>
      <Link
        href="/coach/onboarding"
        className="group mt-7 inline-flex items-center gap-2 rounded-xl bg-espresso px-6 py-3 text-sm font-semibold text-cream shadow-soft transition-all hover:bg-sage-ink hover:shadow-lift"
      >
        Start the 2-minute setup
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </main>
  );
}
