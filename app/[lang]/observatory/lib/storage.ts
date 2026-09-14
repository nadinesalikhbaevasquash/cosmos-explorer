/**
 * Campaign persistence: one namespaced key, every access wrapped, failures swallowed.
 *
 * A campaign is a long session. Losing it to a refresh would cost the player the
 * nights they spent, and nights are the one thing the game refuses to give back,
 * so this saves after every single action.
 */

import { newCampaign, type Campaign } from './campaign'

const KEY = 'astranova-observatory'

export function loadCampaign(): Campaign | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Campaign
    // Guard against a half-written or older-shaped save rather than crashing the page.
    if (typeof parsed?.nightsUsed !== 'number' || typeof parsed?.observations !== 'object') {
      return null
    }
    return { ...newCampaign(), ...parsed }
  } catch {
    return null
  }
}

export function saveCampaign(c: Campaign) {
  try {
    localStorage.setItem(KEY, JSON.stringify(c))
  } catch {
    // Private browsing or a full quota. The campaign still works for this session.
  }
}

export function clearCampaign() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Nothing to do; the caller resets in-memory state regardless.
  }
}
