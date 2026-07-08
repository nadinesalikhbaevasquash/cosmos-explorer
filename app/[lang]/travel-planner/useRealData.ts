"use client";

import { useEffect, useState } from "react";

export type DestinationLive = {
  description: string | null;
  image: string | null;
  url: string | null;
  weather: { tempC: number; text: string; emoji: string; country: string | null; timezone: string | null } | null;
};

export type WikiPlace = { title: string; description: string; image: string | null; url: string };
export type PlaceMap = Record<string, WikiPlace | null>;

// Real description + image + current weather for the selected destination.
// State is tagged with its city so a stale fetch never paints the wrong place;
// no synchronous setState in the effect (keeps the lint rule happy).
export function useDestinationInfo(city: string | undefined) {
  const [state, setState] = useState<{ city: string; info: DestinationLive } | null>(null);

  useEffect(() => {
    if (!city) return;
    let active = true;
    fetch(`/api/travel/destination?city=${encodeURIComponent(city)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((info) => { if (active && info) setState({ city, info }); })
      .catch(() => {});
    return () => { active = false; };
  }, [city]);

  const info = city && state?.city === city ? state.info : null;
  return { info, loading: !!city && !info };
}

// Real Wikipedia descriptions + images for the itinerary's attractions, fetched
// in one batch and keyed by the original label. Refetches when planKey changes.
export function usePlaceInfo(planKey: string, names: string[]): PlaceMap {
  const [state, setState] = useState<{ key: string; map: PlaceMap } | null>(null);

  useEffect(() => {
    if (!planKey || names.length === 0) return;
    let active = true;
    fetch(`/api/travel/place?titles=${encodeURIComponent(names.join("|"))}`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((map) => { if (active) setState({ key: planKey, map }); })
      .catch(() => {});
    return () => { active = false; };
    // names are derived from planKey; keying on planKey alone avoids refetch churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planKey]);

  return state?.key === planKey ? state.map : {};
}
