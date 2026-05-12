import React, { useRef, useEffect, useCallback, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { useCarStore } from "@/state/carStore";

const CarModel = () => {
  return (
    <group>
      {/* Body */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.8, 0.4, 1.6]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, 0.45, -0.1]} castShadow>
        <boxGeometry args={[0.7, 0.3, 0.8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.1} transparent opacity={0.8} />
      </mesh>
      {/* Wheels */}
      {[[-0.45, 0, 0.5], [0.45, 0, 0.5], [-0.45, 0, -0.5], [0.45, 0, -0.5]].map((pos, i) => (
        <mesh key={i} position={pos as any} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.15, 16]} />
          <meshStandardMaterial color="#000" />
        </mesh>
      ))}
      {/* Headlights */}
      <mesh position={[-0.3, 0.2, -0.8]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.1, 16]} />
        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0.3, 0.2, -0.8]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.1, 16]} />
        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
      </mesh>
    </group>
  );
};

const Car = ({ roadPaths }: { roadPaths: any[] }) => {
  const carRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const thirdMode = useCarStore((state) => state.thirdMode);
  const autoDrive = useCarStore((state) => state.autoDrive);
  const setCarPos = useCarStore((state) => state.setCarPos);
  const setThirdMode = useCarStore((state) => state.setThirdMode);
  
  const state = useRef({
    speed: 0,
    rotation: 0,
    pathIndex: 0,
    pointIndex: 0
  });

  const keys = useRef({ w: false, s: false, a: false, d: false });

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (key in keys.current) (keys.current as any)[key] = true;
    if (key === "escape") setThirdMode(false);
  }, [setThirdMode]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (key in keys.current) (keys.current as any)[key] = false;
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  useFrame((_, delta) => {
    if (!carRef.current) return;

    if (autoDrive && roadPaths.length > 0) {
      // Auto Drive Logic
      const path = roadPaths[state.current.pathIndex % roadPaths.length];
      if (!path) return;
      
      const target = path[state.current.pointIndex].clone();
      target.y = 0.35; // Align with road height + small offset
      
      if (!target) {
        state.current.pointIndex = 0;
        state.current.pathIndex++;
        return;
      }

      const dist = carRef.current.position.distanceTo(target);
      if (dist < 1) {
        state.current.pointIndex = (state.current.pointIndex + 1) % path.length;
        if (state.current.pointIndex === 0) state.current.pathIndex++;
      } else {
        const direction = new THREE.Vector3().subVectors(target, carRef.current.position).normalize();
        carRef.current.position.addScaledVector(direction, 10 * delta);
        carRef.current.position.y = 0.35; // Stick to road
        
        const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction);
        carRef.current.quaternion.slerp(targetQuaternion, 0.1);
      }
    } else {
      // Manual Drive Physics
      const config = { maxSpeed: 40, acceleration: 30, turnSpeed: 1.5, friction: 10 };

      if (keys.current.w) {
        state.current.speed = Math.min(state.current.speed + config.acceleration * delta, config.maxSpeed);
      } else if (keys.current.s) {
        state.current.speed = Math.max(state.current.speed - config.acceleration * delta, -config.maxSpeed / 2);
      } else {
        state.current.speed = state.current.speed > 0 ? Math.max(state.current.speed - config.friction * delta, 0) : Math.min(state.current.speed + config.friction * delta, 0);
      }

      if (Math.abs(state.current.speed) > 0.1) {
        const direction = state.current.speed > 0 ? 1 : -1;
        if (keys.current.a) carRef.current.rotation.y += config.turnSpeed * delta * direction;
        if (keys.current.d) carRef.current.rotation.y -= config.turnSpeed * delta * direction;
      }

      const velocity = new THREE.Vector3(0, 0, -1).applyQuaternion(carRef.current.quaternion);
      carRef.current.position.addScaledVector(velocity, state.current.speed * delta);
      carRef.current.position.y = 0.35; // Stick to road height
    }

    // Camera follow
    if (thirdMode) {
      const idealOffset = new THREE.Vector3(0, 4, 8).applyQuaternion(carRef.current.quaternion);
      const idealLookat = new THREE.Vector3(0, 0, -5).applyQuaternion(carRef.current.quaternion);
      camera.position.lerp(carRef.current.position.clone().add(idealOffset), 0.1);
      camera.lookAt(carRef.current.position.clone().add(idealLookat));
    }
    setCarPos(carRef.current.position.x, carRef.current.position.z);
  });

  return (
    <group>
      <group ref={carRef} position={[0, 0.1, 0]}>
        <CarModel />
      </group>
      {!thirdMode && <OrbitControls maxDistance={1000} />}
    </group>
  );
};

export default Car;
