export type Point = { x: number; y: number };

export type FloorMaterial = "ahsap" | "mermer";

export type RoomCategory =
  | "oturma-odasi"
  | "yatak-odasi"
  | "cocuk-odasi"
  | "misafir-odasi"
  | "eglence-odasi"
  | "kutuphane";

export const ROOM_CATEGORIES: { value: RoomCategory; label: string }[] = [
  { value: "oturma-odasi", label: "Oturma Odası" },
  { value: "yatak-odasi", label: "Yatak Odası (Ebeveyn)" },
  { value: "cocuk-odasi", label: "Çocuk Odası" },
  { value: "misafir-odasi", label: "Misafir Odası" },
  { value: "eglence-odasi", label: "Eğlence Odası" },
  { value: "kutuphane", label: "Kütüphane" },
];

export const DEFAULT_ROOM_CATEGORY: RoomCategory = "yatak-odasi";

export const ROOM_CATEGORY_ACCENT: Record<RoomCategory, string> = {
  "oturma-odasi": "#b5654a",
  "yatak-odasi": "#6e8aa3",
  "cocuk-odasi": "#e0b84a",
  "misafir-odasi": "#7a9a6e",
  "eglence-odasi": "#7a4f6e",
  kutuphane: "#4f6e4f",
};

export type Room = {
  id: string;
  name: string;
  points: Point[];
  heightCm: number; // ceiling height in centimeters
  floorMaterial: FloorMaterial;
  category: RoomCategory;
  ceilingColor: string; // hex color
};

export const GRID_PX = 20; // one grid cell in canvas pixels
export const DEFAULT_HEIGHT_CM = 250;
export const DEFAULT_FLOOR_MATERIAL: FloorMaterial = "ahsap";
export const DEFAULT_CEILING_COLOR = "#f5f2ea";

export type FurnitureType =
  | "yatak"
  | "gardirop"
  | "komodin"
  | "koltuk"
  | "sehpa"
  | "tv-unitesi"
  | "kitaplik";

export type FurnitureItem = {
  id: string;
  type: FurnitureType;
  x: number; // meters, world space
  z: number; // meters, world space
  rotationY: number; // radians
};

export const FURNITURE_CATALOG: { type: FurnitureType; label: string; categories: RoomCategory[] }[] = [
  { type: "yatak", label: "Yatak", categories: ["yatak-odasi", "misafir-odasi", "cocuk-odasi"] },
  { type: "gardirop", label: "Gardırop", categories: ["yatak-odasi", "misafir-odasi", "cocuk-odasi"] },
  { type: "komodin", label: "Komodin", categories: ["yatak-odasi", "misafir-odasi", "cocuk-odasi"] },
  { type: "koltuk", label: "Koltuk", categories: ["oturma-odasi", "eglence-odasi", "kutuphane"] },
  { type: "sehpa", label: "Sehpa", categories: ["oturma-odasi", "eglence-odasi", "kutuphane"] },
  { type: "tv-unitesi", label: "TV Ünitesi", categories: ["oturma-odasi", "eglence-odasi"] },
  { type: "kitaplik", label: "Kitaplık", categories: ["kutuphane", "oturma-odasi"] },
];
