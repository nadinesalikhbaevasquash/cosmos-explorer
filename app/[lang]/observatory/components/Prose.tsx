'use client'

/**
 * Renders a localised paragraph that contains markup and measured values.
 *
 * The observatory's explainers are the most information-dense writing on the site
 * and they were the last thing still hardcoded in English, which meant a Russian or
 * Uzbek visitor reached the flagship feature and it switched language on them.
 *
 * Translating them needed a way to keep three things out of the locale files:
 * formulas, emphasis, and numbers the player just measured. So a paragraph is a
 * plain string carrying two kinds of marker:
 *
 *   {token}     a value supplied at render time, e.g. {star} or {period}
 *   <f>…</f>    a formula, rendered in the mono chip
 *   <b>…</b>    bold      <i>…</i>   italic
 *
 * Translators move the markers around freely, which matters: Russian and Uzbek put
 * the subject in different places than English, and a scheme that only concatenated
 * fragments would force word order that reads like a machine wrote it.
 */

import { Formula } from './HowDoWeKnow'

type Values = Record<string, string | number>

const TAG = /(<[fbi]>.*?<\/[fbi]>)/g
const TOKEN = /\{(\w+)\}/g

function fill(text: string, values: Values): string {
  return text.replace(TOKEN, (_, k) => {
    const v = values[k]
    return v === undefined ? `{${k}}` : String(v)
  })
}

export default function Prose({
  text,
  values = {},
  dim = false,
}: {
  text: string
  values?: Values
  dim?: boolean
}) {
  const filled = fill(text, values)

  return (
    <p className={dim ? 'text-slate-500' : undefined}>
      {filled.split(TAG).map((part, i) => {
        const m = /^<([fbi])>([\s\S]*?)<\/\1>$/.exec(part)
        if (!m) return <span key={i}>{part}</span>
        const [, tag, inner] = m
        if (tag === 'f') return <Formula key={i}>{inner}</Formula>
        if (tag === 'b') return <strong key={i} className="text-white">{inner}</strong>
        return <em key={i}>{inner}</em>
      })}
    </p>
  )
}
