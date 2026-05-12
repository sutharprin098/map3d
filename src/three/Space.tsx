import { useEffect, useState, useMemo, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useAreaStore } from "@/state/areaStore";
import { useCityStore } from "@/state/cityStore";
import { Html, Sky, Environment, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useActionStore } from "@/state/exportStore";
import { GLTFExporter } from "three/examples/jsm/Addons.js";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import Car from "./Car";

// Apply BVH
// @ts-ignore
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree as any;
// @ts-ignore
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree as any;
THREE.Mesh.prototype.raycast = acceleratedRaycast as any;

const scale = 51000;

function BuildingInfo({ tags, position, onClose }: { tags: any; position: THREE.Vector3; onClose: () => void; }) {
  return (
    <Html position={[position.x, position.y + 15, position.z]} center distanceFactor={15}>
      <div className="premium-card" style={{ width: "240px", padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontWeight: 700 }}>Building Details</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ fontSize: '12px', opacity: 0.8 }}>
            {tags.name && <div style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: '4px' }}>{tags.name}</div>}
            <div>Height: {tags.height || 10}m</div>
            {tags.amenity && <div>Type: {tags.amenity}</div>}
        </div>
      </div>
    </Html>
  );
}

function Trees({ area }: { area: any }) {
  const treeNodes = useAreaStore((state) => state.treeNodes);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const leafRef = useRef<THREE.InstancedMesh>(null);
  
  const refLat = (area && area.length >= 2) ? (area[1].lat + area[0].lat) / 2 : 0;
  const refLng = (area && area.length >= 2) ? (area[1].lng + area[0].lng) / 2 : 0;

  function project(lat: number, lng: number) {
    const x = (lng - refLng) * scale * Math.cos((refLat * Math.PI) / 180);
    const y = (lat - refLat) * scale;
    return new THREE.Vector2(x, y);
  }

  useEffect(() => {
    if (treeNodes.length === 0 || !meshRef.current || !leafRef.current) return;
    
    const dummy = new THREE.Object3D();
    treeNodes.forEach((node: any, i: number) => {
      const p = project(node.lat, node.lon);
      
      // Trunk
      dummy.position.set(p.x, 0.5, -p.y);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Leaves
      dummy.position.set(p.x, 1.2, -p.y);
      dummy.updateMatrix();
      leafRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    leafRef.current.instanceMatrix.needsUpdate = true;
  }, [treeNodes]);

  if (treeNodes.length === 0) return null;

  return (
    <group name="city-trees">
      <instancedMesh ref={meshRef} args={[null as any, null as any, treeNodes.length]} castShadow>
        <cylinderGeometry args={[0.1, 0.15, 1, 8]} />
        <meshStandardMaterial color="#451a03" />
      </instancedMesh>
      <instancedMesh ref={leafRef} args={[null as any, null as any, treeNodes.length]} castShadow>
        <sphereGeometry args={[0.6, 8, 8]} />
        <meshStandardMaterial color="#166534" />
      </instancedMesh>
    </group>
  );
}

function Water({ area }: { area: any }) {
  const waterAreas = useAreaStore((state) => state.waterAreas);
  const [waterGeom, setWaterGeom] = useState<THREE.BufferGeometry | null>(null);
  
  const refLat = (area && area.length >= 2) ? (area[1].lat + area[0].lat) / 2 : 0;
  const refLng = (area && area.length >= 2) ? (area[1].lng + area[0].lng) / 2 : 0;

  function project(lat: number, lng: number) {
    const x = (lng - refLng) * scale * Math.cos((refLat * Math.PI) / 180);
    const y = (lat - refLat) * scale;
    return new THREE.Vector2(x, y);
  }

  useEffect(() => {
    setWaterGeom(null);
    if (waterAreas.length === 0) return;
    const geometries: THREE.BufferGeometry[] = [];
    waterAreas.forEach((water: any) => {
      if (!water.geometry || water.geometry.length < 3) return;
      const pts = water.geometry.map((p: any) => project(p.lat, p.lon));
      const shape = new THREE.Shape(pts);
      const geom = new THREE.ShapeGeometry(shape);
      geom.rotateX(-Math.PI / 2);
      geometries.push(geom);
    });
    if (geometries.length > 0) setWaterGeom(BufferGeometryUtils.mergeGeometries(geometries));
  }, [waterAreas]);

  if (!waterGeom) return null;
  return (
    <mesh name="city-water" geometry={waterGeom} position={[0, 0.1, 0]} receiveShadow>
      <meshStandardMaterial color="#60a5fa" roughness={0.1} metalness={0.5} />
    </mesh>
  );
}

function Roads({ area, onRoadsLoaded }: { area: any; onRoadsLoaded?: (paths: any[]) => void }) {
  const roadData = useAreaStore((state) => state.roadData);
  const [roadGeom, setRoadGeom] = useState<THREE.BufferGeometry | null>(null);
  const [pathGeom, setPathGeom] = useState<THREE.BufferGeometry | null>(null);

  const refLat = (area && area.length >= 2) ? (area[1].lat + area[0].lat) / 2 : 0;
  const refLng = (area && area.length >= 2) ? (area[1].lng + area[0].lng) / 2 : 0;

  function project(lat: number, lng: number) {
    const x = (lng - refLng) * scale * Math.cos((refLat * Math.PI) / 180);
    const y = (lat - refLat) * scale;
    return new THREE.Vector2(x, y);
  }

  useEffect(() => {
    if (roadData.length === 0) return;
    
    const roadGeoms: THREE.BufferGeometry[] = [];
    const pathGeoms: THREE.BufferGeometry[] = [];
    const drivePaths: any[] = [];
    
    roadData.forEach((road: any) => {
      if (!road.geometry || road.geometry.length < 2) return;
      
      const type = road.tags?.highway;
      let width = 1.0;
      let isPath = false;
      let isDrivable = true;

      if (["motorway", "trunk", "primary"].includes(type)) width = 3.5;
      else if (["secondary", "tertiary"].includes(type)) width = 2.5;
      else if (["residential", "service"].includes(type)) width = 1.8;
      else { width = 0.5; isPath = true; isDrivable = false; }

      const pathPoints: THREE.Vector3[] = [];
      for (let i = 0; i < road.geometry.length - 1; i++) {
        const p1 = project(road.geometry[i].lat, road.geometry[i].lon);
        const p2 = project(road.geometry[i+1].lat, road.geometry[i+1].lon);
        
        if (isDrivable) {
            if (i === 0) pathPoints.push(new THREE.Vector3(p1.x, 0.3, -p1.y));
            pathPoints.push(new THREE.Vector3(p2.x, 0.3, -p2.y));
        }

        const dir = new THREE.Vector2().subVectors(p2, p1).normalize();
        const normal = new THREE.Vector2(-dir.y, dir.x).multiplyScalar(width);
        
        const h = isPath ? 0.25 : 0.3;
        const v1 = new THREE.Vector3(p1.x + normal.x, h, -(p1.y + normal.y));
        const v2 = new THREE.Vector3(p1.x - normal.x, h, -(p1.y - normal.y));
        const v3 = new THREE.Vector3(p2.x + normal.x, h, -(p2.y + normal.y));
        const v4 = new THREE.Vector3(p2.x - normal.x, h, -(p2.y - normal.y));
        
        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
          v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, v3.x, v3.y, v3.z,
          v2.x, v2.y, v2.z, v4.x, v4.y, v4.z, v3.x, v3.y, v3.z,
        ]), 3));
        
        if (isPath) pathGeoms.push(geom);
        else roadGeoms.push(geom);
      }
      if (isDrivable && pathPoints.length > 0) drivePaths.push(pathPoints);
    });
    
    if (roadGeoms.length > 0) setRoadGeom(BufferGeometryUtils.mergeGeometries(roadGeoms));
    if (pathGeoms.length > 0) setPathGeom(BufferGeometryUtils.mergeGeometries(pathGeoms));
    if (onRoadsLoaded) onRoadsLoaded(drivePaths);
  }, [roadData]);

  if (!area || area.length < 2) return null;

  return (
    <group>
        {roadGeom && (
            <mesh name="city-roads" geometry={roadGeom} receiveShadow>
                <meshStandardMaterial color="#334155" roughness={0.8} polygonOffset polygonOffsetFactor={-3} />
            </mesh>
        )}
        {pathGeom && (
            <mesh name="city-paths" geometry={pathGeom} receiveShadow>
                <meshStandardMaterial color="#cbd5e1" roughness={1} polygonOffset polygonOffsetFactor={-2} />
            </mesh>
        )}
    </group>
  );
}

export function Export() {
  const { scene } = useThree();
  const action = useActionStore((state) => state.action);
  const setAction = useActionStore((state) => state.setAction);

  useEffect(() => {
    if (action) {
      setAction(false);
      
      const exportScene = new THREE.Scene();
      exportScene.background = new THREE.Color("#f1f5f9");
      
      scene.traverse((child) => {
        if (child.name && child.name.startsWith("city-")) {
          const clone = child.clone(true);
          exportScene.add(clone);
        }
      });

      const exporter = new GLTFExporter();
      exporter.parse(
        exportScene,
        (result) => {
          const blob = new Blob([result as ArrayBuffer], { type: "model/gltf-binary" });
          const link = document.createElement("a");
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
          link.href = URL.createObjectURL(blob);
          link.download = `city_model_${timestamp}.glb`;
          link.click();
        },
        (error) => console.error("Export error:", error),
        { binary: true }
      );
    }
  }, [action]);
  return null;
}

function Parks({ area }: { area: any }) {
  const parkAreas = useAreaStore((state) => state.parkAreas);
  const [parkGeom, setParkGeom] = useState<THREE.BufferGeometry | null>(null);
  const refLat = (area && area.length >= 2) ? (area[1].lat + area[0].lat) / 2 : 0;
  const refLng = (area && area.length >= 2) ? (area[1].lng + area[0].lng) / 2 : 0;
  function project(lat: number, lng: number) {
    const x = (lng - refLng) * scale * Math.cos((refLat * Math.PI) / 180);
    const y = (lat - refLat) * scale;
    return new THREE.Vector2(x, y);
  }
  useEffect(() => {
    setParkGeom(null);
    if (parkAreas.length === 0) return;
    const geometries: THREE.BufferGeometry[] = [];
    parkAreas.forEach((park: any) => {
      if (!park.geometry || park.geometry.length < 3) return;
      const pts = park.geometry.map((p: any) => project(p.lat, p.lon));
      const shape = new THREE.Shape(pts);
      const geom = new THREE.ShapeGeometry(shape);
      geom.rotateX(-Math.PI / 2);
      geometries.push(geom);
    });
    if (geometries.length > 0) setParkGeom(BufferGeometryUtils.mergeGeometries(geometries));
  }, [parkAreas]);
  if (!parkGeom) return null;
  return (
    <mesh name="city-parks" geometry={parkGeom} position={[0, 0.2, 0]} receiveShadow>
      <meshStandardMaterial color="#bbf7d0" roughness={0.9} />
    </mesh>
  );
}

export function Space() {
  const areas = useAreaStore((state) => state.areas);
  const center = useAreaStore((state) => state.center);
  const roadData = useAreaStore((state) => state.roadData);
  const isReady = useCityStore((state) => state.isReady);
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
  const [roadPaths, setRoadPaths] = useState<any[]>([]);

  const { refLat, refLng } = useMemo(() => {
    if (!center || center.length < 2) return { refLat: 0, refLng: 0 };
    return {
      refLat: (center[1].lat + center[0].lat) / 2,
      refLng: (center[1].lng + center[0].lng) / 2
    };
  }, [center]);

  const project = (lat: number, lng: number) => {
    const x = (lng - refLng) * scale * Math.cos((refLat * Math.PI) / 180);
    const y = (lat - refLat) * scale;
    return new THREE.Vector2(x, y);
  };

  const mergedGeom = useMemo(() => {
    if (!isReady || areas.length === 0 || !center || center.length < 2) return null;
    const geoms: THREE.BufferGeometry[] = [];
    
    areas.forEach((bld: any) => {
      if (!bld.geometry || bld.geometry.length < 3) return;
      const pts = bld.geometry.map((p: any) => project(p.lat, p.lng));
      const shape = new THREE.Shape(pts);
      const height = parseFloat(bld.tags.height || "10") || 10;
      const geom = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
      geom.rotateX(-Math.PI / 2);
      geoms.push(geom);
    });

    if (geoms.length === 0) return null;
    const final = BufferGeometryUtils.mergeGeometries(geoms);
    if (final) final.computeBoundsTree();
    return final;
  }, [areas, refLat, refLng, isReady]);

  return (
    <Canvas camera={{ position: [500, 500, 500], fov: 60 }} shadows gl={{ antialias: true, powerPreference: "high-performance" }}>
      <color attach="background" args={["#f1f5f9"]} />
      <fog attach="fog" args={["#f1f5f9", 2000, 20000]} />
      
      <ambientLight intensity={1.5} />
      <directionalLight position={[500, 1000, 500]} intensity={2.5} castShadow />
      
      {isReady && (
        <>
            <Parks area={center} />
            <Water area={center} />
            <Trees area={center} />
            
            {mergedGeom && (
                <mesh 
                    name="city-buildings"
                    geometry={mergedGeom} 
                    onClick={(e) => setSelectedBuilding({ tags: { name: "Interactive Building" }, position: e.point })}
                    castShadow
                    receiveShadow
                >
                <meshStandardMaterial color="#ffffff" metalness={0.1} roughness={0.8} />
                </mesh>
            )}

            {selectedBuilding && <BuildingInfo tags={selectedBuilding.tags} position={selectedBuilding.position} onClose={() => setSelectedBuilding(null)} />}

            <Roads area={center} onRoadsLoaded={setRoadPaths} />
            <Car roadPaths={roadPaths} />
            <Export />
            <Sky sunPosition={[1, 1, 1]} turbidity={0.1} rayleigh={2} />
            <Environment preset="city" />
        </>
      )}
      
      <OrbitControls makeDefault maxDistance={15000} />
    </Canvas>
  );
}
