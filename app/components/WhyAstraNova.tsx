"use client";

/**
 * The landing page's own argument.
 *
 * This is the section that only exists here. Everything else on the home page
 * points somewhere; this one makes the case for why any of it is worth your time,
 * which is the job a landing page has and a directory of categories does not.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { useDict } from "@/app/hooks/useDict";
import { Telescope, Galaxy, EarthGlobe, Astronaut } from "@/app/components/SpaceCast";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function WhyAstraNova() {
  const dict = useDict();
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const t = dict.why;

  const ICONS = [Telescope, EarthGlobe, Galaxy];
  const COLOURS = ["#7e88ec", "#34d399", "#b884ed"];

  return (
    <section className="relative overflow-hidden py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-[8%] top-10 h-80 w-80 rounded-full opacity-[0.13]"
          style={{ background: "radial-gradient(circle, #6b6ee9, transparent 70%)", filter: "blur(70px)" }}
        />
        <div
          className="absolute right-[6%] bottom-0 h-80 w-80 rounded-full opacity-[0.10]"
          style={{ background: "radial-gradient(circle, #34d399, transparent 70%)", filter: "blur(70px)" }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="max-w-3xl"
        >
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.35em] text-indigo-400">
            {t.eyebrow}
          </p>
          <h2 className="mb-4 text-4xl font-bold text-white sm:text-5xl">{t.title}</h2>
          <p className="text-[17px] leading-relaxed text-slate-400">{t.subtitle}</p>
        </motion.div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {t.points.map((pt, i) => {
            const Icon = ICONS[i];
            return (
              <motion.div
                key={pt.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: EASE }}
                className="an-sweep-host rounded-2xl border p-6"
                style={{
                  borderColor: `${COLOURS[i]}30`,
                  background: `linear-gradient(135deg, ${COLOURS[i]}0e, rgba(255,255,255,0.015))`,
                }}
              >
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl"
                  style={{ background: `${COLOURS[i]}16` }}
                >
                  <Icon className="h-12 w-12" />
                </div>
                <h3 className="mt-5 text-[20px] font-bold text-white">{pt.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-400">{pt.body}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Three languages, demonstrated rather than claimed.
            A flag row or a "now in 3 languages!" badge would be a claim. Showing the
            same sentence three times is evidence, and it puts Uzbek on the same line
            as English rather than three letters deep in a switcher. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mt-14 rounded-3xl border border-white/8 px-8 py-10"
          style={{ background: "rgba(255,255,255,0.015)" }}
        >
          <p className="mb-6 text-[13px] font-semibold uppercase tracking-[0.35em] text-slate-500">
            {t.langEyebrow}
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            {t.langLines.map((line, i) => (
              <div key={line.code}>
                <p className="mb-2 font-mono text-[12px] uppercase tracking-widest" style={{ color: ["#7e88ec", "#34d399", "#e2b43d"][i] }}>
                  {line.code}
                </p>
                <p className="text-[16px] leading-relaxed text-slate-300">{line.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-7 border-t border-white/8 pt-5 text-[15px] leading-relaxed text-slate-400">
            {t.langNote}
          </p>
        </motion.div>

        {/* Closing call to action */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mt-14 flex flex-col items-center gap-5 rounded-3xl border border-white/10 px-8 py-12 text-center sm:flex-row sm:text-left"
          style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(192,132,252,0.05))" }}
        >
          <Astronaut className="h-24 w-24 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-white sm:text-3xl">{t.ctaTitle}</h3>
            <p className="mt-2 text-[16px] leading-relaxed text-slate-400">{t.ctaBody}</p>
          </div>
          <Link
            href={`/${lang}/topics`}
            className="an-sweep-host flex-shrink-0 rounded-full px-8 py-4 text-[15px] font-semibold text-white transition-transform hover:scale-105"
            style={{ background: "linear-gradient(135deg, #6b6ee9, #b884ed)", boxShadow: "0 0 28px rgba(99,102,241,0.4)" }}
          >
            {t.ctaButton}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
