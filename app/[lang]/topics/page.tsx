"use client";

/**
 * The topic library.
 *
 * Everything the site knows about planets, moons, stars, galaxies and black holes,
 * in one browsable place. Split out of the home page so the landing can make an
 * argument instead of being a directory.
 */

import { motion } from "framer-motion";
import Nav from "@/app/components/Nav";
import Starfield from "@/app/components/Starfield";
import TopicContent from "@/app/components/TopicContent";
import { useDict } from "@/app/hooks/useDict";

export default function TopicsPage() {
  const dict = useDict();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#060b18" }}>
      <div className="fixed inset-0 pointer-events-none z-0">
        <Starfield density={1} />
      </div>

      <div className="relative z-10">
        <Nav />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-7xl mx-auto px-6 pt-16 pb-10 text-center"
        >
          <p className="text-indigo-400 text-[13px] tracking-[0.4em] uppercase mb-4 font-semibold">
            {dict.topics.eyebrow}
          </p>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">{dict.topics.title}</h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-[17px] leading-relaxed">
            {dict.topics.subtitle}
          </p>
        </motion.div>

        <TopicContent />
      </div>
    </div>
  );
}
