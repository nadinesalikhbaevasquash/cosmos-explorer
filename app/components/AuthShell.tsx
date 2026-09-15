"use client";

/** Shared chrome for every account page, so they cannot drift apart. */

import { motion } from "framer-motion";
import Nav from "@/app/components/Nav";
import Starfield from "@/app/components/Starfield";

export default function AuthShell({ children }: { children: React.ReactNode }) {
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
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export const field =
  "w-full rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3 text-[15px] text-white placeholder:text-slate-600 transition-colors focus:border-indigo-400/50";

export const primary =
  "w-full rounded-full px-6 py-3.5 text-[15px] font-semibold text-white transition-transform hover:scale-[1.01] disabled:opacity-50";

export const primaryStyle = {
  background: "linear-gradient(135deg, #6c6ed0, #b884ed)",
  boxShadow: "0 0 24px rgba(108,110,208,0.35)",
};
