"use client";

import { Edges } from "@react-three/drei";
import { FurnitureType } from "./types";
import { getFurnitureGrainTexture, getFabricWeaveTexture } from "./textures";

const WOOD = "#8a6339";
const WOOD_DARK = "#6b4a29";
const FABRIC = "#e9dcc7";
const BLANKET = "#b5654a";
const PILLOW = "#f7f4ee";
const METAL = "#c9c2b4";

function WoodMat({ color = WOOD, roughness = 0.6 }: { color?: string; roughness?: number }) {
  return <meshStandardMaterial map={getFurnitureGrainTexture()} color={color} roughness={roughness} />;
}

function FabricMat({ color, roughness = 0.9 }: { color: string; roughness?: number }) {
  return <meshStandardMaterial map={getFabricWeaveTexture()} color={color} roughness={roughness} />;
}

function Bed() {
  // 1.6m x 2.0m mattress, headboard at -z end
  return (
    <group>
      {/* legs */}
      {[
        [-0.72, -0.9],
        [0.72, -0.9],
        [-0.72, 0.9],
        [0.72, 0.9],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.09, z]} castShadow receiveShadow>
          <boxGeometry args={[0.06, 0.18, 0.06]} />
          <WoodMat color={WOOD_DARK} roughness={0.7} />
        </mesh>
      ))}
      {/* base/frame */}
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.16, 2.0]} />
        <WoodMat roughness={0.7} />
        <Edges color="#4a331c" />
      </mesh>
      {/* mattress */}
      <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.18, 1.92]} />
        <FabricMat color={FABRIC} />
        <Edges color="#c9b998" />
      </mesh>
      {/* blanket over foot 2/3 */}
      <mesh position={[0, 0.47, 0.28]} castShadow receiveShadow>
        <boxGeometry args={[1.52, 0.06, 1.3]} />
        <FabricMat color={BLANKET} roughness={0.95} />
      </mesh>
      {/* pillows near headboard */}
      <mesh position={[-0.38, 0.48, -0.78]} castShadow receiveShadow>
        <boxGeometry args={[0.55, 0.14, 0.35]} />
        <FabricMat color={PILLOW} />
      </mesh>
      <mesh position={[0.38, 0.48, -0.78]} castShadow receiveShadow>
        <boxGeometry args={[0.55, 0.14, 0.35]} />
        <FabricMat color={PILLOW} />
      </mesh>
      {/* headboard */}
      <mesh position={[0, 0.65, -0.98]} castShadow receiveShadow>
        <boxGeometry args={[1.62, 0.9, 0.08]} />
        <WoodMat roughness={0.7} />
        <Edges color="#4a331c" />
      </mesh>
    </group>
  );
}

function Wardrobe() {
  return (
    <group>
      <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.0, 2.0, 0.6]} />
        <WoodMat />
        <Edges color="#4a331c" />
      </mesh>
      {/* door split line */}
      <mesh position={[0, 1.0, 0.301]}>
        <boxGeometry args={[0.02, 1.96, 0.01]} />
        <meshStandardMaterial color="#4a331c" />
      </mesh>
      {/* handles */}
      <mesh position={[-0.08, 1.0, 0.32]} castShadow>
        <boxGeometry args={[0.03, 0.14, 0.03]} />
        <meshStandardMaterial color={METAL} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0.08, 1.0, 0.32]} castShadow>
        <boxGeometry args={[0.03, 0.14, 0.03]} />
        <meshStandardMaterial color={METAL} metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Nightstand() {
  return (
    <group>
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.45, 0.5, 0.4]} />
        <WoodMat />
        <Edges color="#4a331c" />
      </mesh>
      {/* drawer line */}
      <mesh position={[0, 0.35, 0.201]}>
        <boxGeometry args={[0.4, 0.015, 0.01]} />
        <meshStandardMaterial color="#4a331c" />
      </mesh>
      {/* handle */}
      <mesh position={[0, 0.35, 0.21]} castShadow>
        <boxGeometry args={[0.1, 0.02, 0.02]} />
        <meshStandardMaterial color={METAL} metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

export const FURNITURE_FOOTPRINT: Record<FurnitureType, { w: number; d: number }> = {
  yatak: { w: 1.6, d: 2.0 },
  gardirop: { w: 1.0, d: 0.6 },
  komodin: { w: 0.45, d: 0.4 },
  koltuk: { w: 1.6, d: 0.85 },
  sehpa: { w: 1.0, d: 0.5 },
  "tv-unitesi": { w: 1.6, d: 0.4 },
  kitaplik: { w: 0.9, d: 0.35 },
};

const SOFA_FABRIC = "#6e8aa3";
const SOFA_FABRIC_DARK = "#54697e";
const WOOD_LEG = "#4a331c";

function Koltuk() {
  return (
    <group>
      {/* legs */}
      {[
        [-0.7, -0.35],
        [0.7, -0.35],
        [-0.7, 0.35],
        [0.7, 0.35],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.07, z]} castShadow receiveShadow>
          <boxGeometry args={[0.05, 0.14, 0.05]} />
          <WoodMat color={WOOD_LEG} roughness={0.7} />
        </mesh>
      ))}
      {/* seat base */}
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.22, 0.8]} />
        <FabricMat color={SOFA_FABRIC} />
        <Edges color={SOFA_FABRIC_DARK} />
      </mesh>
      {/* backrest */}
      <mesh position={[0, 0.48, -0.34]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.5, 0.14]} />
        <FabricMat color={SOFA_FABRIC} />
        <Edges color={SOFA_FABRIC_DARK} />
      </mesh>
      {/* armrests */}
      <mesh position={[-0.72, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.16, 0.3, 0.85]} />
        <FabricMat color={SOFA_FABRIC_DARK} />
      </mesh>
      <mesh position={[0.72, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.16, 0.3, 0.85]} />
        <FabricMat color={SOFA_FABRIC_DARK} />
      </mesh>
      {/* seat cushions divider */}
      <mesh position={[0, 0.34, 0.05]}>
        <boxGeometry args={[0.02, 0.1, 0.7]} />
        <meshStandardMaterial color={SOFA_FABRIC_DARK} />
      </mesh>
      {/* throw pillows for extra detail */}
      <mesh position={[-0.55, 0.4, -0.15]} rotation={[0, 0.3, 0.1]} castShadow>
        <boxGeometry args={[0.28, 0.24, 0.1]} />
        <FabricMat color="#c9a227" />
      </mesh>
      <mesh position={[0.55, 0.4, -0.15]} rotation={[0, -0.3, -0.1]} castShadow>
        <boxGeometry args={[0.28, 0.24, 0.1]} />
        <FabricMat color="#b5654a" />
      </mesh>
    </group>
  );
}

function Sehpa() {
  return (
    <group>
      <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.0, 0.04, 0.5]} />
        <WoodMat roughness={0.4} />
        <Edges color="#4a331c" />
      </mesh>
      {[
        [-0.44, -0.2],
        [0.44, -0.2],
        [-0.44, 0.2],
        [0.44, 0.2],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.19, z]} castShadow receiveShadow>
          <boxGeometry args={[0.04, 0.38, 0.04]} />
          <WoodMat color={WOOD_DARK} />
        </mesh>
      ))}
      {/* decorative object on top */}
      <mesh position={[0.25, 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.12, 12]} />
        <meshStandardMaterial color="#4f9c8a" roughness={0.4} />
      </mesh>
    </group>
  );
}

function TvUnitesi() {
  return (
    <group>
      {/* cabinet */}
      <mesh position={[0, 0.225, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.45, 0.4]} />
        <WoodMat />
        <Edges color="#4a331c" />
      </mesh>
      {/* cabinet door lines */}
      <mesh position={[-0.27, 0.225, 0.201]}>
        <boxGeometry args={[0.01, 0.4, 0.005]} />
        <meshStandardMaterial color="#4a331c" />
      </mesh>
      <mesh position={[0.27, 0.225, 0.201]}>
        <boxGeometry args={[0.01, 0.4, 0.005]} />
        <meshStandardMaterial color="#4a331c" />
      </mesh>
      {/* TV screen */}
      <mesh position={[0, 0.85, -0.15]} castShadow>
        <boxGeometry args={[1.4, 0.8, 0.05]} />
        <meshStandardMaterial color="#111318" roughness={0.15} metalness={0.4} envMapIntensity={1.2} />
        <Edges color="#000000" />
      </mesh>
      {/* subtle screen glow */}
      <mesh position={[0, 0.85, -0.124]}>
        <planeGeometry args={[1.3, 0.7]} />
        <meshBasicMaterial color="#4a6a8a" transparent opacity={0.25} />
      </mesh>
      {/* TV stand neck */}
      <mesh position={[0, 0.47, -0.15]} castShadow>
        <boxGeometry args={[0.1, 0.08, 0.08]} />
        <meshStandardMaterial color="#2a2d33" />
      </mesh>
    </group>
  );
}

const BOOK_COLORS = ["#b5654a", "#4f9c8a", "#c9a227", "#6e8aa3", "#8a4f6e", "#7a9a4a"];

function Kitaplik() {
  const shelves = [0.4, 0.9, 1.4, 1.9];
  return (
    <group>
      {/* frame */}
      <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 2.0, 0.35]} />
        <WoodMat />
        <Edges color="#4a331c" />
      </mesh>
      {/* shelf lines */}
      {shelves.map((y, i) => (
        <mesh key={i} position={[0, y, 0.02]} castShadow receiveShadow>
          <boxGeometry args={[0.84, 0.02, 0.32]} />
          <meshStandardMaterial color="#4a331c" />
        </mesh>
      ))}
      {/* books as small colored blocks on each shelf */}
      {shelves.slice(0, 3).map((y, shelfIdx) =>
        Array.from({ length: 6 }).map((_, i) => (
          <mesh
            key={`${shelfIdx}-${i}`}
            position={[-0.36 + i * 0.13, y + 0.14, 0.05]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[0.1, 0.26, 0.22]} />
            <meshStandardMaterial color={BOOK_COLORS[(shelfIdx * 6 + i) % BOOK_COLORS.length]} roughness={0.8} />
          </mesh>
        ))
      )}
    </group>
  );
}

export default function FurnitureMesh({ type }: { type: FurnitureType }) {
  switch (type) {
    case "yatak":
      return <Bed />;
    case "gardirop":
      return <Wardrobe />;
    case "komodin":
      return <Nightstand />;
    case "koltuk":
      return <Koltuk />;
    case "sehpa":
      return <Sehpa />;
    case "tv-unitesi":
      return <TvUnitesi />;
    case "kitaplik":
      return <Kitaplik />;
    default:
      return null;
  }
}
