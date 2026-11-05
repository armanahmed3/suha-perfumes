"use client";

import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { FloatingBottle } from "./PerfumeBottle";

function GoldDust() {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const N = 420;
    const arr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 2.2 + Math.random() * 2.8;
      const theta = Math.random() * Math.PI * 2;
      arr[i * 3] = Math.cos(theta) * r;
      arr[i * 3 + 1] = -0.6 + Math.random() * 4.2;
      arr[i * 3 + 2] = Math.sin(theta) * r;
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.05;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#E9C767" transparent opacity={0.75} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

export default function HeroScene({ liquidColor = "#D4AF37", ambient = false }: { liquidColor?: string; ambient?: boolean }) {
  return (
    <ResponsiveScene liquidColor={liquidColor} ambient={ambient} />
  );
}

function ResponsiveScene({ liquidColor, ambient }: { liquidColor: string; ambient?: boolean }) {
  // pull the camera back on narrow/portrait screens so the flacon never crowds the copy
  const fov = 34;
  const baseZ = 6.6;
  return (
    <Canvas
      dpr={[1, 1.8]}
      camera={{ position: [0, 1.05, baseZ], fov }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ResponsiveRig baseZ={baseZ} />
      <Suspense fallback={null}>
        <ambientLight intensity={0.35} />
        <spotLight position={[6, 8, 6]} angle={0.5} penumbra={1} intensity={140} color="#ffe9b0" castShadow />
        <pointLight position={[-6, 2, -4]} intensity={40} color="#d4af37" />
        <pointLight position={[4, -2, 4]} intensity={26} color="#fff2cf" />

        {!ambient && (
          <FloatingBottle liquidColor={liquidColor} size="large" capColor="#C8C8D0" rotateSpeed={0.5} floatIntensity={1.4} />
        )}
        <GoldDust />

        <ContactShadows position={[0, -1.16, 0]} opacity={ambient ? 0 : 0.42} scale={9} blur={2.6} far={3} color="#000000" />

        {/* local (offline) studio environment for gold reflections */}
        <Environment resolution={256}>
          <group rotation={[-Math.PI / 3, 0, 0]}>
            <Lightformer form="circle" intensity={5} position={[0, 5, -9]} scale={2.2} color="#fff3d6" />
            <Lightformer form="rect" intensity={2.4} position={[-5, 1, -1]} scale={[3.4, 0.8]} color="#e9c767" />
            <Lightformer form="rect" intensity={2} position={[5, -1, 0]} scale={[3.4, 0.8]} color="#d4af37" />
            <Lightformer form="ring" intensity={1.6} position={[0, -3, 2]} scale={2.6} color="#b8912f" />
          </group>
        </Environment>
      </Suspense>
    </Canvas>
  );
}

function ResponsiveRig({ baseZ }: { baseZ: number }) {
  const { camera, size } = useThree();
  const target = useRef(new THREE.Vector2(0, 0));
  const aspect = size.width / Math.max(size.height, 1);
  // portrait → far back; landscape → close
  const desiredZ = aspect < 0.7 ? baseZ + 4.4 : aspect < 1 ? baseZ + 2.6 : baseZ;

  useFrame((state, delta) => {
    target.current.lerp(new THREE.Vector2(state.pointer.x, state.pointer.y), 0.045);
    const baseY = 1.05;
    const portrait = aspect < 0.7;
    const camX = portrait ? -0.6 : 0;
    const nx = camX + target.current.x * 1.15;
    const ny = baseY + target.current.y * 0.55;
    const nz = desiredZ;
    camera.position.set(
      camera.position.x + (nx - camera.position.x) * Math.min(delta * 3, 1),
      camera.position.y + (ny - camera.position.y) * Math.min(delta * 3, 1),
      camera.position.z + (nz - camera.position.z) * Math.min(delta * 2, 1)
    );
    camera.lookAt(portrait ? -1.35 : 0, portrait ? 0.95 : 0.75, 0);
  });
  return null;
}
