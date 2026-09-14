'use client'

/**
 * The "how do we know" panel.
 *
 * Collapsed by default and never blocking, because the moment this becomes homework
 * the player stops opening it. It sits next to a number the player has just measured
 * themselves, and answers the question they are most likely to be quietly asking:
 * fine, but how could anyone actually know that?
 *
 * Every other space site on the internet tells you a number. Almost none of them tell
 * you where the number came from. That gap is the reason this component exists.
 */

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Magnifier } from "@/app/components/SpaceCast";

type Props = {
  question: string
  children: React.ReactNode
}

export default function HowDoWeKnow({ question, children }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-amber-400/15 bg-amber-500/10 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-amber-500/10"
        aria-expanded={open}
      >
        <Magnifier className="h-5 w-5 flex-shrink-0" />
        <span className="flex-1 text-[13px] font-medium text-amber-300">{question}</span>
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.18 }}
          className="text-amber-300/60 text-xs"
          aria-hidden
        >
          ▶
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <div className="px-4 pb-4 pt-1 text-[13px] leading-relaxed text-slate-300 space-y-2.5 border-t border-amber-400/10">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Inline formula styling, so equations read as objects rather than prose. */
export function Formula({ children }: { children: React.ReactNode }) {
  return (
    <code className="inline-block rounded bg-white/[0.02] border border-white/5 px-1.5 py-0.5 font-mono text-[12px] text-indigo-300">
      {children}
    </code>
  )
}
