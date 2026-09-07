import * as THREE from "three";
import { FloorMaterial } from "./types";

const textureCache: Partial<Record<FloorMaterial, THREE.Texture>> = {};

function makeWoodTexture(): THREE.Texture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // base plank color
  ctx.fillStyle = "#b9814f";
  ctx.fillRect(0, 0, size, size);

  // plank separator lines (vertical boards)
  const plankWidth = size / 6;
  for (let i = 0; i <= 6; i++) {
    ctx.strokeStyle = "rgba(60,35,15,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(i * plankWidth, 0);
    ctx.lineTo(i * plankWidth, size);
    ctx.stroke();
  }

  // grain streaks within each plank
  for (let p = 0; p < 6; p++) {
    const xBase = p * plankWidth;
    for (let i = 0; i < 14; i++) {
      const y = Math.random() * size;
      const amp = 4 + Math.random() * 8;
      ctx.strokeStyle = `rgba(90,55,25,${0.15 + Math.random() * 0.2})`;
      ctx.lineWidth = 1 + Math.random();
      ctx.beginPath();
      ctx.moveTo(xBase, y);
      for (let x = 0; x <= plankWidth; x += 16) {
        ctx.lineTo(xBase + x, y + Math.sin(x / 20 + i) * amp);
      }
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeMarbleTexture(): THREE.Texture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // base
  ctx.fillStyle = "#f2f0ec";
  ctx.fillRect(0, 0, size, size);

  // soft gray patches for depth
  for (let i = 0; i < 25; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 30 + Math.random() * 80;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, "rgba(200,200,198,0.25)");
    grad.addColorStop(1, "rgba(200,200,198,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // veins
  for (let i = 0; i < 10; i++) {
    ctx.strokeStyle = `rgba(120,120,118,${0.3 + Math.random() * 0.3})`;
    ctx.lineWidth = 1 + Math.random() * 1.5;
    ctx.beginPath();
    let x = Math.random() * size;
    let y = Math.random() * size;
    ctx.moveTo(x, y);
    for (let seg = 0; seg < 8; seg++) {
      const cx1 = x + (Math.random() - 0.5) * 120;
      const cy1 = y + (Math.random() - 0.5) * 120;
      const cx2 = x + (Math.random() - 0.5) * 120;
      const cy2 = y + (Math.random() - 0.5) * 120;
      x += (Math.random() - 0.5) * 160;
      y += (Math.random() - 0.5) * 160;
      ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x, y);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.5, 1.5);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function getFloorTexture(material: FloorMaterial): THREE.Texture {
  if (textureCache[material]) return textureCache[material]!;
  const tex = material === "mermer" ? makeMarbleTexture() : makeWoodTexture();
  textureCache[material] = tex;
  return tex;
}

export function getFloorRoughness(material: FloorMaterial): number {
  return material === "mermer" ? 0.25 : 0.8;
}

// --- Tintable neutral textures for furniture (multiplied by meshStandardMaterial.color) ---

let grainTextureCache: THREE.Texture | null = null;
function makeGrainTexture(): THREE.Texture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 40; i++) {
    const y = Math.random() * size;
    const amp = 3 + Math.random() * 6;
    ctx.strokeStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.08})`;
    ctx.lineWidth = 1 + Math.random() * 1.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= size; x += 12) {
      ctx.lineTo(x, y + Math.sin(x / 24 + i) * amp);
    }
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function getFurnitureGrainTexture(): THREE.Texture {
  if (!grainTextureCache) grainTextureCache = makeGrainTexture();
  return grainTextureCache;
}

let weaveTextureCache: THREE.Texture | null = null;
function makeWeaveTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(0,0,0,0.07)";
  ctx.lineWidth = 1;
  for (let i = 0; i < size; i += 4) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
  }
  const imgData = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 8;
    imgData.data[i] += n;
    imgData.data[i + 1] += n;
    imgData.data[i + 2] += n;
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function getFabricWeaveTexture(): THREE.Texture {
  if (!weaveTextureCache) weaveTextureCache = makeWeaveTexture();
  return weaveTextureCache;
}

let rugTextureCache: THREE.Texture | null = null;
function makeRugTexture(): THREE.Texture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  // outer border
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 14;
  ctx.strokeRect(20, 20, size - 40, size - 40);
  // inner border
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(0,0,0,0.2)";
  ctx.strokeRect(46, 46, size - 92, size - 92);
  // subtle diamond pattern in the middle
  ctx.strokeStyle = "rgba(0,0,0,0.12)";
  ctx.lineWidth = 2;
  for (let i = 80; i < size - 80; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 80);
    ctx.lineTo(i + 20, size / 2);
    ctx.lineTo(i, size - 80);
    ctx.stroke();
  }
  // fabric noise
  const imgData = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 10;
    imgData.data[i] += n;
    imgData.data[i + 1] += n;
    imgData.data[i + 2] += n;
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function getRugTexture(): THREE.Texture {
  if (!rugTextureCache) rugTextureCache = makeRugTexture();
  return rugTextureCache;
}
