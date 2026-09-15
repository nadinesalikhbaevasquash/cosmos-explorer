/**
 * Sharing a result.
 *
 * The quiz proved the shape: a short block of text with a grid of squares, pasted
 * into a group chat, is how a result travels without anyone being asked to promote
 * the site. This is that, for every result on the site.
 *
 * On a phone the system share sheet is the right door, because that is where
 * Telegram and WhatsApp live and nobody wants to copy, switch apps and paste. On a
 * laptop the share sheet is a detour, so the text goes to the clipboard as the quiz
 * already does. "Phone" means a coarse pointer, not a narrow window: a resized
 * desktop browser still has a mouse and still wants the clipboard.
 */

export type ShareOutcome = "shared" | "copied" | "cancelled" | "failed";

export async function shareResult(text: string): Promise<ShareOutcome> {
  if (typeof window === "undefined") return "failed";

  const touch = window.matchMedia?.("(pointer: coarse)").matches;
  if (touch && typeof navigator.share === "function") {
    try {
      await navigator.share({ text });
      return "shared";
    } catch (err) {
      // Closing the sheet is a choice, not a failure, and must not fall through to
      // a silent clipboard write the person never asked for.
      if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return copyWithTextarea(text) ? "copied" : "failed";
  }
}

/** The pre-Clipboard-API path, still needed in in-app browsers (Telegram, Instagram). */
function copyWithTextarea(text: string): boolean {
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

/** Turn a list of booleans into the site's square grid. */
export function squares(results: (boolean | null)[]): string {
  return results.map((r) => (r === null ? "⬛" : r ? "🟩" : "🟥")).join("");
}
