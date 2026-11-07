"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls, Stage } from "@react-three/drei";
import { PerfumeBottle } from "./PerfumeBottle";

type Props = {
  liquidColor: string;
  size: "small" | "large";
  /** Product bottle cutout shown on the 3D model */
  photo?: string;
};

/**
 * Interactive high-fidelity bottle viewer with orbit controls.
 * Lets shoppers spin the flacon and inspect it from every angle.
 */
export default function BottleViewer({ liquidColor, size, photo }: Props) {
  const isLarge = size === "large";
  return (
    <Canvas
      dpr={[1, 1.8]}
      camera={{ position: [0, 1.15, isLarge ? 5.6 : 4.9], fov: 33 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.4} />
        <spotLight position={[5, 7, 5]} angle={0.5} penumbra={1} intensity={130} color="#ffeec2" />
        <pointLight position={[-5, 1, -3]} intensity={30} color="#d4af37" />
        <pointLight position={[3, -1.5, 3]} intensity={18} color="#ffffff" />

        <group position={[0, -0.35, 0]}>
          <PerfumeBottle liquidColor={liquidColor} size={size} photo={photo} autoRotate={false} capColor={isLarge ? "#C8C8D0" : "#F2F2EE"} />
        </group>

        <ContactShadows position={[0, -1.52, 0]} opacity={0.4} scale={8} blur={2.4} far={2.6} color="#000000" />

        <Environment resolution={256}>
          <group rotation={[-Math.PI / 3, 0, 0]}>
            <Lightformer form="circle" intensity={5} position={[0, 5, -9]} scale={2.2} color="#fff3d6" />
            <Lightformer form="rect" intensity={2.6} position={[-5, 1, -1]} scale={[3.4, 0.8]} color="#e9c767" />
            <Lightformer form="rect" intensity={2.2} position={[5, -1, 0]} scale={[3.4, 0.8]} color="#d4af37" />
            <Lightformer form="ring" intensity={1.8} position={[0, -3, 2]} scale={2.6} color="#b8912f" />
          </group>
        </Environment>

        <OrbitControls
          makeDefault
          enablePan={false}
          autoRotate
          autoRotateSpeed={1.6}
          minDistance={3.4}
          maxDistance={8}
          minPolarAngle={Math.PI / 4.4}
          maxPolarAngle={Math.PI / 1.9}
          target={[0, 0.55, 0]}
        />
      </Suspense>
    </Canvas>
  );
}
