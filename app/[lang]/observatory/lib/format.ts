/**
 * Fill `{token}` placeholders in a localised string.
 *
 * Kept separate from Prose because most labels carry a number but no markup, and
 * those should stay plain strings that can go into a title attribute or a canvas.
 */
export function fmt(text: string, values: Record<string, string | number> = {}): string {
  return text.replace(/\{(\w+)\}/g, (_, k) => {
    const v = values[k]
    return v === undefined ? `{${k}}` : String(v)
  })
}
