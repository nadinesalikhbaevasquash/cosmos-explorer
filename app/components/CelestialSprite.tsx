"use client";

import { CSSProperties } from "react";

// Renders a celestial body as a small animated sprite using the same texture
// assets as the 3D solar system page. Planets/stars scroll their equirectangular
// texture behind a circular mask (reads as a spinning sphere); galaxies slowly
// rotate their image. Pure CSS — cheap enough for a whole grid of them.

export type CelestialArt =
  | { kind: "planet"; src: string; filter?: string }
  | { kind: "star"; src: string; filter?: string }
  | { kind: "galaxy"; src: string; filter?: string; reverse?: boolean };

export default function CelestialSprite({ art, size, glow, className, speed = 1 }: {
  art: CelestialArt;
  size: number;
  /** glow color, e.g. the destination accent — omit for no glow */
  glow?: string;
  className?: string;
  /** rotation-speed multiplier; 1 ≈ one revolution every ~14s */
  speed?: number;
}) {
  const glowShadow = glow ? `0 0 ${Math.max(size * 0.5, 10)}px ${glow}66` : "";

  if (art.kind === "galaxy") {
    return (
      <span className={`relative block rounded-full overflow-hidden ${className ?? ""}`}
        style={{ width: size, height: size, boxShadow: glowShadow || undefined }}>
        <span className="celestial-spin absolute rounded-full"
          style={{
            inset: `-${size * 0.25}px`,
            backgroundImage: `url(${art.src})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: art.filter,
            animation: `celestial-spin ${120 / speed}s linear infinite ${art.reverse ? "reverse" : ""}`,
          }} />
        {/* vignette so the photo edge fades into space */}
        <span className="absolute inset-0 rounded-full"
          style={{ background: "radial-gradient(circle, transparent 55%, rgba(3,7,18,0.85) 100%)" }} />
      </span>
    );
  }

  // Planet / star: 2:1 texture, height-fitted, scrolled one full wrap per cycle.
  const shading: string =
    art.kind === "planet"
      ? `inset ${-size * 0.22}px ${-size * 0.12}px ${size * 0.35}px rgba(0,0,0,0.85), inset ${size * 0.06}px ${size * 0.06}px ${size * 0.18}px rgba(255,255,255,0.12)`
      : `inset 0 0 ${size * 0.25}px rgba(255,255,255,0.25)`;

  const style: CSSProperties & { "--roll": string } = {
    width: size,
    height: size,
    backgroundImage: `url(${art.src})`,
    backgroundSize: "auto 100%",
    backgroundRepeat: "repeat-x",
    boxShadow: [shading, glowShadow].filter(Boolean).join(", "),
    filter: art.filter,
    animation: `planet-roll ${14 / speed}s linear infinite`,
    "--roll": `${-size * 2}px`,
  };

  return <span className={`planet-roll block rounded-full ${className ?? ""}`} style={style} />;
}
