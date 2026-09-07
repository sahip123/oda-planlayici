"use client";

import { Canvas, ThreeEvent, useThree } from "@react-three/fiber";
import { OrbitControls, Edges, ContactShadows, Environment } from "@react-three/drei";
import { EffectComposer, N8AO, Bloom, ToneMapping } from "@react-three/postprocessing";
import * as THREE from "three";
import { useMemo, useState, useEffect, useRef } from "react";
import { Room, GRID_PX, FurnitureItem } from "./types";
import { ROOM_CATEGORY_ACCENT } from "./types";
import FurnitureMesh, { FURNITURE_FOOTPRINT } from "./furniture";
import { getFloorTexture, getFloorRoughness, getRugTexture } from "./textures";

const WALL_THICKNESS_M = 0.1;

function toMeters(px: number, metersPerCell: number): number {
  return (px / GRID_PX) * metersPerCell;
}

function makeWallTexture(): THREE.Texture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#8fd0bd";
  ctx.fillRect(0, 0, size, size);
  const imgData = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 10;
    imgData.data[i] += n;
    imgData.data[i + 1] += n;
    imgData.data[i + 2] += n;
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

let wallTextureCache: THREE.Texture | null = null;
function getWallTexture(): THREE.Texture {
  if (!wallTextureCache) wallTextureCache = makeWallTexture();
  return wallTextureCache;
}

function RoomMesh({
  room,
  metersPerCell,
  showCeiling,
}: {
  room: Room;
  metersPerCell: number;
  showCeiling: boolean;
}) {
  const heightM = room.heightCm / 100;

  const pts3 = room.points.map((p) => ({
    x: toMeters(p.x, metersPerCell),
    z: toMeters(p.y, metersPerCell),
  }));

  const floorShape = useMemo(() => {
    const shape = new THREE.Shape();
    pts3.forEach((p, i) => {
      if (i === 0) shape.moveTo(p.x, p.z);
      else shape.lineTo(p.x, p.z);
    });
    shape.closePath();
    return shape;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(pts3)]);

  const walls = pts3.map((a, i) => {
    const b = pts3[(i + 1) % pts3.length];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dz, dx);
    const midX = (a.x + b.x) / 2;
    const midZ = (a.z + b.z) / 2;
    return { midX, midZ, length, angle, key: `${room.id}-wall-${i}` };
  });

  const [floorTex, setFloorTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    setFloorTex(getFloorTexture(room.floorMaterial));
  }, [room.floorMaterial]);
  const wallTex = useMemo(() => getWallTexture(), []);
  const rugTex = useMemo(() => getRugTexture(), []);

  const bounds = useMemo(() => {
    const xs = pts3.map((p) => p.x);
    const zs = pts3.map((p) => p.z);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minZ: Math.min(...zs),
      maxZ: Math.max(...zs),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(pts3)]);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;
  const rugW = (bounds.maxX - bounds.minX) * 0.55;
  const rugD = (bounds.maxZ - bounds.minZ) * 0.55;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <shapeGeometry args={[floorShape]} />
        {floorTex ? (
          <meshStandardMaterial
            map={floorTex}
            side={THREE.DoubleSide}
            roughness={getFloorRoughness(room.floorMaterial)}
          />
        ) : (
          <meshStandardMaterial color="#d8a05c" side={THREE.DoubleSide} roughness={0.75} />
        )}
      </mesh>

      {/* area rug, tinted per room category */}
      {rugW > 0.4 && rugD > 0.4 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0.008, centerZ]} receiveShadow>
          <planeGeometry args={[rugW, rugD]} />
          <meshStandardMaterial map={rugTex} color={ROOM_CATEGORY_ACCENT[room.category]} roughness={0.95} />
        </mesh>
      )}

      {/* warm ceiling lamp */}
      <pointLight
        position={[centerX, heightM - 0.15, centerZ]}
        intensity={0.5}
        color="#ffdba8"
        distance={7}
        decay={2}
      />
      <mesh position={[centerX, heightM - 0.08, centerZ]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#fff3d6" emissive="#ffdba8" emissiveIntensity={1.2} />
      </mesh>

      {showCeiling && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, heightM, 0]} receiveShadow>
          <shapeGeometry args={[floorShape]} />
          <meshStandardMaterial color={room.ceilingColor} side={THREE.DoubleSide} roughness={0.9} />
        </mesh>
      )}

      {walls.map((w) => (
        <group key={w.key}>
          <mesh position={[w.midX, heightM / 2, w.midZ]} rotation={[0, -w.angle, 0]} castShadow receiveShadow>
            <boxGeometry args={[w.length, heightM, WALL_THICKNESS_M]} />
            <meshStandardMaterial map={wallTex} roughness={0.85} />
            <Edges color="#0f766e" lineWidth={1.5} />
          </mesh>
          {/* baseboard / skirting trim */}
          <mesh position={[w.midX, 0.06, w.midZ]} rotation={[0, -w.angle, 0]} castShadow receiveShadow>
            <boxGeometry args={[w.length, 0.1, WALL_THICKNESS_M + 0.02]} />
            <meshStandardMaterial color="#f5f2ea" roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function DraggableFurniture({
  item,
  selected,
  onSelect,
  onDragStart,
}: {
  item: FurnitureItem;
  selected: boolean;
  onSelect: (id: string) => void;
  onDragStart: (id: string) => void;
}) {
  const footprint = FURNITURE_FOOTPRINT[item.type];
  return (
    <group
      position={[item.x, 0, item.z]}
      rotation={[0, item.rotationY, 0]}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onSelect(item.id);
        onDragStart(item.id);
      }}
    >
      <FurnitureMesh type={item.type} />
      {selected && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[footprint.w + 0.1, footprint.d + 0.1]} />
          <meshBasicMaterial color="#2563eb" transparent opacity={0.15} />
        </mesh>
      )}
    </group>
  );
}

type CameraMode = "kus-bakisi" | "icerden";

function CameraRig({
  mode,
  center,
  draggingActive,
}: {
  mode: CameraMode;
  center: { x: number; z: number };
  draggingActive: boolean;
}) {
  const { camera } = useThree();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (mode === "kus-bakisi") {
      camera.position.set(center.x + 6, 6, center.z + 6);
      controlsRef.current?.target.set(center.x, 1, center.z);
    } else {
      camera.position.set(center.x - 1.5, 1.6, center.z - 1.5);
      controlsRef.current?.target.set(center.x + 1.5, 1.4, center.z + 1.5);
    }
    controlsRef.current?.update();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, center.x, center.z]);

  return <OrbitControls ref={controlsRef} enabled={!draggingActive} />;
}

export default function Room3DView({
  rooms,
  metersPerCell,
  furniture,
  onMoveFurniture,
  selectedFurnitureId,
  onSelectFurniture,
}: {
  rooms: Room[];
  metersPerCell: number;
  furniture: FurnitureItem[];
  onMoveFurniture: (id: string, x: number, z: number) => void;
  selectedFurnitureId: string | null;
  onSelectFurniture: (id: string | null) => void;
}) {
  const [showCeiling, setShowCeiling] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>("kus-bakisi");
  const glRef = useRef<THREE.WebGLRenderer | null>(null);

  const center = useMemo(() => {
    const allPts = rooms.flatMap((r) =>
      r.points.map((p) => ({
        x: toMeters(p.x, metersPerCell),
        z: toMeters(p.y, metersPerCell),
      }))
    );
    if (allPts.length === 0) return { x: 0, z: 0 };
    const x = allPts.reduce((s, p) => s + p.x, 0) / allPts.length;
    const z = allPts.reduce((s, p) => s + p.z, 0) / allPts.length;
    return { x, z };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(rooms), metersPerCell]);

  const downloadScreenshot = () => {
    const gl = glRef.current;
    if (!gl) return;
    const url = gl.domElement.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "oda-planlayici-goruntu.png";
    a.click();
  };

  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 10", border: "1px solid #9ca3af" }}>
      <div style={{ position: "absolute", top: 8, left: 8, zIndex: 10, background: "#ffffff", padding: "8px 10px", borderRadius: 6, boxShadow: "0 1px 4px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 13, color: "#111827", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <input type="checkbox" checked={showCeiling} onChange={(e) => setShowCeiling(e.target.checked)} />
          Tavanı göster
        </label>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => setCameraMode("kus-bakisi")}
            style={{ fontSize: 12, fontWeight: cameraMode === "kus-bakisi" ? 700 : 400 }}
          >
            Kuş Bakışı
          </button>
          <button
            onClick={() => setCameraMode("icerden")}
            style={{ fontSize: 12, fontWeight: cameraMode === "icerden" ? 700 : 400 }}
          >
            İçeriden
          </button>
        </div>
      </div>

      <button
        onClick={downloadScreenshot}
        style={{ position: "absolute", top: 8, right: 8, zIndex: 10, fontSize: 12, background: "#ffffff", padding: "6px 10px", borderRadius: 6, boxShadow: "0 1px 4px rgba(0,0,0,0.3)", border: "1px solid #d1d5db", cursor: "pointer" }}
      >
        📷 Ekran Görüntüsü Al
      </button>

      <Canvas
        shadows="soft"
        gl={{ preserveDrawingBuffer: true }}
        onCreated={(state) => {
          glRef.current = state.gl;
          state.gl.toneMapping = THREE.ACESFilmicToneMapping;
          state.gl.toneMappingExposure = 1.15;
        }}
        camera={{ position: [center.x + 6, 6, center.z + 6], fov: 50 }}
      >
        <color attach="background" args={["#bfe3f5"]} />
        <Environment preset="apartment" environmentIntensity={0.6} />
        <hemisphereLight args={["#bfe3f5", "#8a6d4a", 0.5]} />
        <ambientLight intensity={0.25} />
        <directionalLight
          position={[center.x + 6, 10, center.z + 4]}
          intensity={1.3}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
          shadow-bias={-0.0005}
        />

        {/* ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[center.x, -0.02, center.z]} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#9cc98a" />
        </mesh>

        {/* invisible drag plane at floor level - handles move + click-to-deselect */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[center.x, 0.001, center.z]}
          onPointerMove={(e: ThreeEvent<PointerEvent>) => {
            if (!draggingId) return;
            onMoveFurniture(draggingId, e.point.x, e.point.z);
          }}
          onPointerUp={() => setDraggingId(null)}
          onPointerLeave={() => setDraggingId(null)}
          onPointerDown={(e: ThreeEvent<PointerEvent>) => {
            if (draggingId) return;
            e.stopPropagation();
            onSelectFurniture(null);
          }}
        >
          <planeGeometry args={[200, 200]} />
          <meshBasicMaterial visible={false} />
        </mesh>

        {rooms.map((room) => (
          <RoomMesh key={room.id} room={room} metersPerCell={metersPerCell} showCeiling={showCeiling} />
        ))}

        {furniture.map((item) => (
          <DraggableFurniture
            key={item.id}
            item={item}
            selected={item.id === selectedFurnitureId}
            onSelect={onSelectFurniture}
            onDragStart={setDraggingId}
          />
        ))}

        <ContactShadows position={[center.x, 0.005, center.z]} opacity={0.45} scale={20} blur={2} far={3} />

        <CameraRig mode={cameraMode} center={center} draggingActive={!!draggingId} />

        <EffectComposer enableNormalPass multisampling={0}>
          <N8AO aoRadius={1.2} intensity={2} distanceFalloff={1} />
          <Bloom intensity={0.15} luminanceThreshold={0.9} mipmapBlur />
          <ToneMapping />
        </EffectComposer>
      </Canvas>
      <p style={{ position: "absolute", bottom: 4, left: 8, fontSize: 12, color: "#4b5563", background: "rgba(255,255,255,0.8)", padding: "2px 6px", borderRadius: 4 }}>
        Sol tık + sürükle: döndür · Sağ tık + sürükle: kaydır · Scroll: yakınlaştır · Mobilyaya tıkla+sürükle: taşı
      </p>
    </div>
  );
}
