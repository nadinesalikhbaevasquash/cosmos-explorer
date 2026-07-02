"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Html, useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

// ── Visual config (id = English name, matches texture files + data keys) ──────

export type PlanetConfig = {
  id: string;
  texture: string;
  radius: number;       // visual sphere radius
  orbitRadius: number;  // visual orbit radius
  period: number;       // seconds per full orbit (relative, from data)
  spin: number;         // axial rotation speed (rad/s)
  tilt: number;         // axial tilt (rad)
  color: string;        // accent for rings/labels
};

export const PLANETS_3D: PlanetConfig[] = [
  { id: "Mercury", texture: "/textures/2k_mercury.jpg",          radius: 0.5,  orbitRadius: 8,    period: 5,   spin: 0.02, tilt: 0.0,  color: "#9ca3af" },
  { id: "Venus",   texture: "/textures/2k_venus_atmosphere.jpg", radius: 0.9,  orbitRadius: 11,   period: 10,  spin: 0.01, tilt: 3.1,  color: "#fbbf24" },
  { id: "Earth",   texture: "/textures/2k_earth_daymap.jpg",     radius: 1.0,  orbitRadius: 14.5, period: 16,  spin: 0.25, tilt: 0.41, color: "#34d399" },
  { id: "Mars",    texture: "/textures/2k_mars.jpg",             radius: 0.7,  orbitRadius: 18,   period: 30,  spin: 0.24, tilt: 0.44, color: "#f87171" },
  { id: "Jupiter", texture: "/textures/2k_jupiter.jpg",          radius: 2.6,  orbitRadius: 24,   period: 65,  spin: 0.6,  tilt: 0.05, color: "#f97316" },
  { id: "Saturn",  texture: "/textures/2k_saturn.jpg",           radius: 2.2,  orbitRadius: 30.5, period: 120, spin: 0.55, tilt: 0.47, color: "#fde68a" },
  { id: "Uranus",  texture: "/textures/2k_uranus.jpg",           radius: 1.5,  orbitRadius: 36,   period: 200, spin: 0.35, tilt: 1.71, color: "#67e8f9" },
  { id: "Neptune", texture: "/textures/2k_neptune.jpg",          radius: 1.45, orbitRadius: 41,   period: 320, spin: 0.32, tilt: 0.49, color: "#6366f1" },
];

const DEFAULT_CAM = new THREE.Vector3(0, 24, 52);
const ORIGIN = new THREE.Vector3(0, 0, 0);

type Registry = Record<string, THREE.Group | null>;

// ── Saturn rings (RingGeometry with radial UVs so the texture maps correctly) ─

function SaturnRings({ inner, outer }: { inner: number; outer: number }) {
  const texture = useTexture("/textures/2k_saturn_ring_alpha.png");
  const geometry = useMemo(() => {
    const g = new THREE.RingGeometry(inner, outer, 128);
    const pos = g.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      g.attributes.uv.setXY(i, v.length() < (inner + outer) / 2 ? 0 : 1, 1);
    }
    return g;
  }, [inner, outer]);

  return (
    <mesh geometry={geometry} rotation-x={-Math.PI / 2} receiveShadow>
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} transparent opacity={0.9} />
    </mesh>
  );
}

// ── Single planet ──────────────────────────────────────────────────────────────

function Planet({ cfg, label, paused, selected, onSelect, registry }: {
  cfg: PlanetConfig; label: string; paused: boolean; selected: boolean;
  onSelect: (id: string) => void; registry: React.MutableRefObject<Registry>;
}) {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const angle = useRef(PLANETS_3D.findIndex((p) => p.id === cfg.id) * 2.4);
  const [hovered, setHovered] = useState(false);
  const texture = useTexture(cfg.texture);

  useEffect(() => {
    registry.current[cfg.id] = group.current;
    return () => { registry.current[cfg.id] = null; };
  }, [cfg.id, registry]);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "";
    return () => { document.body.style.cursor = ""; };
  }, [hovered]);

  useFrame((_, delta) => {
    if (!paused) angle.current += (Math.PI * 2 / cfg.period) * delta * 2;
    group.current?.position.set(
      Math.cos(angle.current) * cfg.orbitRadius, 0,
      Math.sin(angle.current) * cfg.orbitRadius,
    );
    if (mesh.current) mesh.current.rotation.y += cfg.spin * delta;
  });

  return (
    <group ref={group}>
      <group rotation-z={cfg.tilt}>
        <mesh
          ref={mesh}
          onClick={(e) => { e.stopPropagation(); onSelect(cfg.id); }}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
          onPointerOut={() => setHovered(false)}
        >
          <sphereGeometry args={[cfg.radius, 48, 48]} />
          <meshStandardMaterial map={texture} roughness={0.9} metalness={0} />
        </mesh>
        {cfg.id === "Saturn" && <SaturnRings inner={cfg.radius * 1.25} outer={cfg.radius * 2.2} />}
      </group>
      {/* Selection halo */}
      {selected && (
        <mesh>
          <sphereGeometry args={[cfg.radius * 1.18, 32, 32]} />
          <meshBasicMaterial color={cfg.color} transparent opacity={0.18} side={THREE.BackSide} />
        </mesh>
      )}
      {/* Label */}
      <Html center position={[0, cfg.radius + 0.9, 0]} style={{ pointerEvents: "none" }} zIndexRange={[10, 0]}>
        <span
          className="text-[10px] font-semibold whitespace-nowrap px-1.5 py-0.5 rounded-md select-none"
          style={{
            color: hovered || selected ? "#fff" : "rgba(226,232,240,0.75)",
            backgroundColor: hovered || selected ? "rgba(3,7,18,0.85)" : "rgba(3,7,18,0.45)",
            border: `1px solid ${hovered || selected ? cfg.color : "transparent"}`,
            transition: "all 0.2s",
          }}
        >
          {label}
        </span>
      </Html>
    </group>
  );
}

// ── Orbit ring ────────────────────────────────────────────────────────────────

function OrbitRing({ radius, highlighted, color }: { radius: number; highlighted: boolean; color: string }) {
  return (
    <mesh rotation-x={-Math.PI / 2}>
      <ringGeometry args={[radius - 0.03, radius + 0.03, 160]} />
      <meshBasicMaterial
        color={highlighted ? color : "#94a3b8"}
        transparent opacity={highlighted ? 0.5 : 0.12}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ── Sun ───────────────────────────────────────────────────────────────────────

function Sun({ onClick }: { onClick: () => void }) {
  const texture = useTexture("/textures/2k_sun.jpg");
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => { if (mesh.current) mesh.current.rotation.y += 0.03 * delta; });

  return (
    <group>
      <mesh ref={mesh} onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <sphereGeometry args={[3.2, 64, 64]} />
        <meshBasicMaterial map={texture} />
      </mesh>
      {/* Glow shells */}
      <mesh>
        <sphereGeometry args={[3.7, 32, 32]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.14} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[4.6, 32, 32]} />
        <meshBasicMaterial color="#f97316" transparent opacity={0.06} side={THREE.BackSide} />
      </mesh>
      <pointLight intensity={400} distance={200} decay={1.6} color="#fff7e0" />
    </group>
  );
}

// ── Camera rig: flies to the selected planet, then follows it ─────────────────

function CameraRig({ selected, registry, controls }: {
  selected: string | null;
  registry: React.MutableRefObject<Registry>;
  controls: React.MutableRefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  const flying = useRef(false);
  const prevSelected = useRef<string | null>(null);
  const desired = useRef(new THREE.Vector3());

  useEffect(() => {
    if (selected !== prevSelected.current) {
      flying.current = true;
      prevSelected.current = selected;
    }
  }, [selected]);

  // Stop auto-flying as soon as the user grabs the controls
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const stop = () => { flying.current = false; };
    c.addEventListener("start", stop);
    return () => c.removeEventListener("start", stop);
  });

  useFrame(() => {
    const c = controls.current;
    if (!c) return;
    const cfg = selected ? PLANETS_3D.find((p) => p.id === selected) : null;
    const target = cfg ? registry.current[selected!]?.position ?? ORIGIN : ORIGIN;

    // The target always tracks the selected planet (or the Sun)
    c.target.lerp(target, 0.08);

    if (flying.current) {
      if (cfg && selected) {
        const dist = Math.max(cfg.radius * 6, 4.5);
        desired.current.set(target.x, target.y + dist * 0.45, target.z + dist);
      } else {
        desired.current.copy(DEFAULT_CAM);
      }
      camera.position.lerp(desired.current, 0.06);
      if (camera.position.distanceTo(desired.current) < 0.15) flying.current = false;
    }
    c.update();
  });

  return null;
}

// ── Scene ─────────────────────────────────────────────────────────────────────

export default function SolarSystem3D({ paused, selected, onSelect, labels }: {
  paused: boolean;
  selected: string | null;
  onSelect: (id: string | null) => void;
  labels: Record<string, string>; // English id → localized name
}) {
  const registry = useRef<Registry>({});
  const controls = useRef<OrbitControlsImpl | null>(null);

  return (
    <Canvas
      camera={{ position: DEFAULT_CAM.toArray(), fov: 50, near: 0.1, far: 800 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
      onPointerMissed={() => onSelect(null)}
      style={{ touchAction: "none" }}
      fallback={
        <div className="w-full h-full flex items-center justify-center text-center px-6">
          <p className="text-slate-500 text-sm">
            3D requires WebGL, which your browser doesn&apos;t support. 🔭
          </p>
        </div>
      }
    >
      <color attach="background" args={["#030712"]} />
      <ambientLight intensity={0.12} />
      <Stars radius={300} depth={60} count={5000} factor={5} saturation={0} fade speed={0.4} />

      <Sun onClick={() => onSelect(null)} />

      {PLANETS_3D.map((cfg) => (
        <group key={cfg.id}>
          <OrbitRing radius={cfg.orbitRadius} highlighted={selected === cfg.id} color={cfg.color} />
          <Planet
            cfg={cfg}
            label={labels[cfg.id] ?? cfg.id}
            paused={paused}
            selected={selected === cfg.id}
            onSelect={(id) => onSelect(id)}
            registry={registry}
          />
        </group>
      ))}

      <OrbitControls
        ref={controls}
        enablePan={false}
        minDistance={5}
        maxDistance={120}
        enableDamping
        dampingFactor={0.08}
      />
      <CameraRig selected={selected} registry={registry} controls={controls} />
    </Canvas>
  );
}
