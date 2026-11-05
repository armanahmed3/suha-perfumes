"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";

type BottleProps = {
  liquidColor?: string;
  size?: "small" | "large";
  capColor?: string;
  autoRotate?: boolean;
  rotateSpeed?: number;
};

/**
 * Procedurally generated luxury perfume bottle rendered with 3D meshes.
 * Large = frosted rounded-shoulder flacon with metal cap (matches real SUHA 100ml).
 * Small = clear cylinder travel spray with white pump (matches real SUHA 35ml).
 */
export function PerfumeBottle({
  liquidColor = "#D4AF37",
  size = "large",
  capColor = "#C0C0C8",
  autoRotate = true,
  rotateSpeed = 0.6,
}: BottleProps) {
  const group = useRef<THREE.Group>(null);

  const { glassGeo, liquidGeo, labelGeo, capGeo, pumpGeo, nozzleGeo } = useMemo(() => {
    const isLarge = size === "large";

    const makeProfile = (scale: number, fill: boolean) => {
      const pts: THREE.Vector2[] = [];
      if (isLarge) {
        // rounded shoulder flacon silhouette
        const R = 0.72 * scale;
        const bodyTop = 1.7 * scale;
        const neckR = 0.26 * scale;
        const neckTop = 2.16 * scale;
        pts.push(new THREE.Vector2(0.001, 0));
        pts.push(new THREE.Vector2(R * 0.62, 0));
        pts.push(new THREE.Vector2(R * 0.9, 0.06 * scale));
        pts.push(new THREE.Vector2(R, 0.32 * scale));
        pts.push(new THREE.Vector2(R, bodyTop));
        pts.push(new THREE.Vector2(R * 0.88, bodyTop + 0.14 * scale));
        pts.push(new THREE.Vector2(R * 0.55, bodyTop + 0.26 * scale));
        pts.push(new THREE.Vector2(neckR, bodyTop + 0.34 * scale));
        pts.push(new THREE.Vector2(neckR, neckTop));
        if (fill) pts.push(new THREE.Vector2(0.001, neckTop));
      } else {
        // slim cylinder
        const R = 0.42 * scale;
        const top = 1.62 * scale;
        pts.push(new THREE.Vector2(0.001, 0));
        pts.push(new THREE.Vector2(R * 0.8, 0));
        pts.push(new THREE.Vector2(R, 0.1 * scale));
        pts.push(new THREE.Vector2(R, top - 0.1 * scale));
        pts.push(new THREE.Vector2(R * 0.7, top));
        pts.push(new THREE.Vector2(0.2 * scale, top));
        if (fill) pts.push(new THREE.Vector2(0.001, top));
      }
      return pts;
    };

    const S = isLarge ? 1 : 1.12;
    const glassGeo = new THREE.LatheGeometry(makeProfile(S, true), 72);

    // liquid fills ~78% of body
    const liquidPts: THREE.Vector2[] = [];
    if (isLarge) {
      const R = 0.72 * S * 0.9;
      const topY = 1.34 * S;
      liquidPts.push(new THREE.Vector2(0.001, 0.02));
      liquidPts.push(new THREE.Vector2(R * 0.6, 0.03));
      liquidPts.push(new THREE.Vector2(R, 0.3 * S));
      liquidPts.push(new THREE.Vector2(R, topY));
      liquidPts.push(new THREE.Vector2(R * 0.8, topY + 0.06 * S));
      liquidPts.push(new THREE.Vector2(0.001, topY + 0.07 * S));
    } else {
      const R = 0.42 * S * 0.86;
      const topY = 1.28 * S;
      liquidPts.push(new THREE.Vector2(0.001, 0.02));
      liquidPts.push(new THREE.Vector2(R, 0.08 * S));
      liquidPts.push(new THREE.Vector2(R, topY));
      liquidPts.push(new THREE.Vector2(0.001, topY));
    }
    const liquidGeo = new THREE.LatheGeometry(liquidPts, 64);

    const isL = isLarge;
    const labelGeo = new THREE.CylinderGeometry(
      (isL ? 0.72 : 0.42) * S * 1.012,
      (isL ? 0.72 : 0.42) * S * 1.012,
      isL ? 0.52 : 0.6,
      64,
      1,
      true
    );
    const capGeo = new THREE.CylinderGeometry(0.3 * S, 0.3 * S, 0.52 * S, 48);
    const pumpGeo = new THREE.CylinderGeometry(0.17 * S, 0.19 * S, 0.34 * S, 32);
    const nozzleGeo = new THREE.BoxGeometry(0.13 * S, 0.1 * S, 0.3 * S);

    return { glassGeo, liquidGeo, labelGeo, capGeo, pumpGeo, nozzleGeo };
  }, [size]);

  useFrame((state, delta) => {
    if (group.current && autoRotate) {
      group.current.rotation.y += delta * rotateSpeed * 0.5;
    }
  });

  const isLarge = size === "large";

  return (
    <group ref={group} position={[0, isLarge ? -1.15 : -1.0, 0]}>
      {/* glass body */}
      <mesh geometry={glassGeo} castShadow>
        <meshPhysicalMaterial
          color={isLarge ? "#f5f2ea" : "#ffffff"}
          transmission={1}
          thickness={isLarge ? 1.6 : 0.8}
          roughness={isLarge ? 0.42 : 0.06}
          ior={1.45}
          transparent
          opacity={1}
          metalness={0}
          clearcoat={0.6}
          clearcoatRoughness={0.25}
          envMapIntensity={1.4}
        />
      </mesh>

      {/* liquid */}
      <mesh geometry={liquidGeo}>
        <meshPhysicalMaterial
          color={liquidColor}
          transmission={0.92}
          thickness={1.4}
          roughness={0.08}
          ior={1.35}
          transparent
          opacity={0.96}
          metalness={0.1}
          emissive={liquidColor}
          emissiveIntensity={0.08}
        />
      </mesh>

      {/* gold label band */}
      <mesh geometry={labelGeo} position={[0, isLarge ? 0.95 : 0.78, 0]}>
        <meshStandardMaterial
          color="#caa435"
          metalness={0.9}
          roughness={0.28}
          side={THREE.DoubleSide}
          emissive="#3a2c05"
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* emblem medallion */}
      <mesh position={[0, isLarge ? 1.15 : 0.95, isLarge ? 0.735 : 0.43]} scale={[0.11, 0.15, 0.02]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial color="#e9c767" metalness={1} roughness={0.18} emissive="#8a6d1d" emissiveIntensity={0.4} />
      </mesh>

      {/* cap / pump */}
      {isLarge ? (
        <mesh geometry={capGeo} position={[0, 2.42, 0]} castShadow>
          <meshStandardMaterial color={capColor} metalness={1} roughness={0.16} envMapIntensity={1.6} />
        </mesh>
      ) : (
        <group position={[0, 1.85, 0]}>
          <mesh geometry={pumpGeo} castShadow>
            <meshStandardMaterial color="#f5f5f2" roughness={0.35} metalness={0.05} />
          </mesh>
          <mesh geometry={nozzleGeo} position={[0, 0.22, 0.07]}>
            <meshStandardMaterial color="#f5f5f2" roughness={0.35} metalness={0.05} />
          </mesh>
        </group>
      )}

      {/* ambient gold sparkles */}
      <Sparkles count={26} scale={[2.6, 3.4, 2.6]} position={[0, 1.2, 0]} size={2.2} speed={0.35} color="#E9C767" opacity={0.55} />
    </group>
  );
}

/** Gentle floating wrapper */
export function FloatingBottle(props: BottleProps & { floatIntensity?: number }) {
  const { floatIntensity = 1, ...rest } = props;
  return (
    <Float speed={1.6} rotationIntensity={0.12} floatIntensity={floatIntensity}>
      <PerfumeBottle {...rest} />
    </Float>
  );
}
