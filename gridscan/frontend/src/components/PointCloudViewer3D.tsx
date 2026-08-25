import { useMemo, useRef, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

export type ViewMode = "top" | "side" | "3d";

// LAS convention: Z is elevation (up). Three.js convention: Y is up.
// We remap once here so every camera/control in the scene behaves the way
// people expect from a normal 3D viewer (Y up, orbit around a sensible axis)
// instead of fighting a Z-up dataset everywhere else in the component.
//   three.x = las.x - centroidX   (lateral)
//   three.y = las.z - centroidZ   (elevation, "up" on screen)
//   three.z = las.y - centroidY   (corridor axis, "depth")
function remapPoints(points: number[][]) {
  const n = points.length;
  const positions = new Float32Array(n * 3);
  let cx = 0, cy = 0, cz = 0;
  for (const [x, y, z] of points) { cx += x; cy += y; cz += z; }
  cx /= n || 1; cy /= n || 1; cz /= n || 1;

  let maxDist = 0.001;
  for (let i = 0; i < n; i++) {
    const x = points[i][0] - cx;
    const y = points[i][2] - cz;
    const z = points[i][1] - cy;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    const d = Math.sqrt(x * x + y * y + z * z);
    if (d > maxDist) maxDist = d;
  }
  return { positions, centroid: { x: cx, y: cy, z: cz }, boundingRadius: maxDist };
}

interface PointCloudViewer3DProps {
  points: number[][]; // [x, y, z, classification][]
  visibleClasses: Set<number>;
  classColors: Record<number, string>;
  viewMode: ViewMode;
  pointSizeMultiplier: number; // 1 - 10, user-controlled
  resetToken: number; // bump to force camera reset
}

export function PointCloudViewer3D({
  points, visibleClasses, classColors, viewMode, pointSizeMultiplier, resetToken,
}: PointCloudViewer3DProps) {
  const { positions, colors, boundingRadius } = useMemo(() => {
    const filtered = points.filter((p) => visibleClasses.has(p[3]));
    const { positions, boundingRadius } = remapPoints(filtered);
    const colors = new Float32Array(filtered.length * 3);
    const tmp = new THREE.Color();
    for (let i = 0; i < filtered.length; i++) {
      const cls = filtered[i][3];
      tmp.set(classColors[cls] ?? "#8899aa");
      colors[i * 3] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }
    return { positions, colors, boundingRadius };
  }, [points, visibleClasses, classColors]);

  const pointSize = Math.max(boundingRadius / 260, 0.01) * pointSizeMultiplier;

  return (
    <Canvas
      gl={{ antialias: true, powerPreference: "high-performance" }}
      dpr={[1, 2]}
      style={{ background: "transparent" }}
    >
      <color attach="background" args={["#0a0f1a"]} />
      <ambientLight intensity={1} />
      <CameraRig viewMode={viewMode} boundingRadius={boundingRadius} resetToken={resetToken} />
      <GridFloor radius={boundingRadius} />
      <PointCloudGeometry positions={positions} colors={colors} pointSize={pointSize} />
    </Canvas>
  );
}

function PointCloudGeometry({
  positions, colors, pointSize,
}: { positions: Float32Array; colors: Float32Array; pointSize: number }) {
  const geomRef = useRef<THREE.BufferGeometry>(null);

  useEffect(() => {
    geomRef.current?.computeBoundingSphere();
  }, [positions]);

  return (
    <points>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={pointSize} vertexColors sizeAttenuation transparent opacity={0.9} />
    </points>
  );
}

function GridFloor({ radius }: { radius: number }) {
  const size = Math.max(radius * 2.4, 10);
  return (
    <gridHelper
      args={[size, 24, "#2a3550", "#1a2338"]}
      position={[0, -radius * 0.02 - 0.01, 0]}
    />
  );
}

// Positions the camera for Top / Side / 3D views and (re)creates OrbitControls
// with the right constraints for each mode. Remounts on resetToken/viewMode
// change so "Reset View" genuinely snaps back to the framed default.
function CameraRig({
  viewMode, boundingRadius, resetToken,
}: { viewMode: ViewMode; boundingRadius: number; resetToken: number }) {
  const { camera } = useThree();
  const r = Math.max(boundingRadius, 1);

  const setup = useMemo(() => {
    if (viewMode === "top") {
      return { position: [0, r * 2.2, 0.0001] as [number, number, number], up: [0, 0, -1] as [number, number, number], ortho: true, enableRotate: false };
    }
    if (viewMode === "side") {
      return { position: [r * 2.2, 0, 0] as [number, number, number], up: [0, 1, 0] as [number, number, number], ortho: true, enableRotate: false };
    }
    return { position: [r * 1.4, r * 1.1, r * 1.4] as [number, number, number], up: [0, 1, 0] as [number, number, number], ortho: false, enableRotate: true };
  }, [viewMode, r]);

  const orthoSize = r * 1.15;

  return (
    <group key={`${viewMode}-${resetToken}`}>
      {setup.ortho ? (
        <OrthographicCamera
          makeDefault
          position={setup.position}
          up={setup.up}
          zoom={1}
          left={-orthoSize} right={orthoSize} top={orthoSize} bottom={-orthoSize}
          near={0.01} far={r * 20}
          onUpdate={(cam) => { camera.up.set(...setup.up); cam.lookAt(0, 0, 0); }}
        />
      ) : (
        <PerspectiveCamera
          makeDefault
          position={setup.position}
          up={setup.up}
          fov={50}
          near={0.01}
          far={r * 30}
          onUpdate={(cam) => { camera.up.set(...setup.up); cam.lookAt(0, 0, 0); }}
        />
      )}
      <OrbitControls
        makeDefault
        target={[0, 0, 0]}
        enableRotate={setup.enableRotate}
        enablePan
        enableZoom
        panSpeed={1}
        zoomSpeed={0.9}
        minDistance={r * 0.05}
        maxDistance={r * 12}
      />
    </group>
  );
}
