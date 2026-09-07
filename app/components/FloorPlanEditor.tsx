"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Point, Room, GRID_PX, DEFAULT_HEIGHT_CM, DEFAULT_FLOOR_MATERIAL, DEFAULT_ROOM_CATEGORY, DEFAULT_CEILING_COLOR, FurnitureItem, FURNITURE_CATALOG, FloorMaterial, RoomCategory, ROOM_CATEGORIES } from "./types";
import Room3DView from "./Room3DView";
import { supabase } from "../lib/supabaseClient";

const CLOSE_SNAP_PX = 14; // click-near-start distance to close a room

export default function FloorPlanEditor({ userId }: { userId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cmPerCell, setCmPerCell] = useState(50); // real-world size of one grid cell
  const [rooms, setRooms] = useState<Room[]>([]);
  const [current, setCurrent] = useState<Point[]>([]);
  const [mousePos, setMousePos] = useState<Point | null>(null);
  const [roomCounter, setRoomCounter] = useState(1);
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const [furniture, setFurniture] = useState<FurnitureItem[]>([]);
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);

  // Save/load state
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("Adsız Proje");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loadingProject, setLoadingProject] = useState(false);

  // My projects list
  const [myProjects, setMyProjects] = useState<{ id: string; name: string; updated_at: string }[]>([]);
  const [showProjectsList, setShowProjectsList] = useState(false);

  const fetchMyProjects = async () => {
    const { data, error } = await supabase
      .from("floorplan_projects")
      .select("id, name, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (!error && data) setMyProjects(data);
  };

  const loadProjectById = async (id: string) => {
    setLoadingProject(true);
    const { data, error } = await supabase.from("floorplan_projects").select("*").eq("id", id).single();
    setLoadingProject(false);
    if (error || !data) return;
    setProjectId(data.id);
    setProjectName(data.name);
    const payload = data.data as { rooms: Room[]; furniture: FurnitureItem[]; cmPerCell: number };
    if (payload.rooms) setRooms(payload.rooms);
    if (payload.furniture) setFurniture(payload.furniture);
    if (payload.cmPerCell) setCmPerCell(payload.cmPerCell);
    const url = new URL(window.location.href);
    url.searchParams.set("p", data.id);
    window.history.replaceState({}, "", url.toString());
    setShareUrl(url.toString());
    setShowProjectsList(false);
  };

  const deleteProjectById = async (id: string) => {
    await supabase.from("floorplan_projects").delete().eq("id", id);
    fetchMyProjects();
    if (id === projectId) {
      setProjectId(null);
      setShareUrl(null);
    }
  };

  // On mount: if URL has ?p=<id>, load that project
  useEffect(() => {
    fetchMyProjects();
    const params = new URLSearchParams(window.location.search);
    const pid = params.get("p");
    if (!pid) return;
    setLoadingProject(true);
    supabase
      .from("floorplan_projects")
      .select("*")
      .eq("id", pid)
      .single()
      .then(({ data, error }) => {
        setLoadingProject(false);
        if (error || !data) return;
        setProjectId(data.id);
        setProjectName(data.name);
        const payload = data.data as {
          rooms: Room[];
          furniture: FurnitureItem[];
          cmPerCell: number;
        };
        if (payload.rooms) setRooms(payload.rooms);
        if (payload.furniture) setFurniture(payload.furniture);
        if (payload.cmPerCell) setCmPerCell(payload.cmPerCell);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProject = async () => {
    setSaveStatus("saving");
    const payload = { rooms, furniture, cmPerCell };
    if (projectId) {
      const { error } = await supabase
        .from("floorplan_projects")
        .update({ name: projectName, data: payload, updated_at: new Date().toISOString() })
        .eq("id", projectId);
      if (error) {
        setSaveStatus("error");
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("floorplan_projects")
        .insert({ name: projectName, data: payload, user_id: userId })
        .select()
        .single();
      if (error || !data) {
        setSaveStatus("error");
        return;
      }
      setProjectId(data.id);
      const url = new URL(window.location.href);
      url.searchParams.set("p", data.id);
      window.history.replaceState({}, "", url.toString());
      setShareUrl(url.toString());
    }
    if (projectId) {
      const url = new URL(window.location.href);
      url.searchParams.set("p", projectId);
      setShareUrl(url.toString());
    }
    setSaveStatus("saved");
    fetchMyProjects();
  };

  const metersPerCell = cmPerCell / 100;

  const snap = useCallback((p: Point): Point => {
    return {
      x: Math.round(p.x / GRID_PX) * GRID_PX,
      y: Math.round(p.y / GRID_PX) * GRID_PX,
    };
  }, []);

  const polygonAreaM2 = (points: Point[]): number => {
    if (points.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      area += a.x * b.y - b.x * a.y;
    }
    const areaPx2 = Math.abs(area) / 2;
    const areaCells = areaPx2 / (GRID_PX * GRID_PX);
    return areaCells * metersPerCell * metersPerCell;
  };

  const distM = (a: Point, b: Point): number => {
    const dxCells = (a.x - b.x) / GRID_PX;
    const dyCells = (a.y - b.y) / GRID_PX;
    const cells = Math.sqrt(dxCells * dxCells + dyCells * dyCells);
    return cells * metersPerCell;
  };

  const getCanvasPoint = (e: { clientX: number; clientY: number }): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const raw = getCanvasPoint(e);
    const p = snap(raw);

    // Close the room if clicking near the first point (need at least 3 points)
    if (current.length >= 3) {
      const start = current[0];
      const dx = raw.x - start.x;
      const dy = raw.y - start.y;
      if (Math.sqrt(dx * dx + dy * dy) <= CLOSE_SNAP_PX) {
        finishRoom();
        return;
      }
    }

    setCurrent((prev) => [...prev, p]);
  };

  const finishRoom = () => {
    if (current.length < 3) return;
    const newRoom: Room = {
      id: `room-${crypto.randomUUID()}`,
      name: `Oda ${roomCounter}`,
      points: current,
      heightCm: DEFAULT_HEIGHT_CM,
      floorMaterial: DEFAULT_FLOOR_MATERIAL,
      category: DEFAULT_ROOM_CATEGORY,
      ceilingColor: DEFAULT_CEILING_COLOR,
    };
    setRooms((rs) => [...rs, newRoom]);
    setRoomCounter((c) => c + 1);
    setCurrent([]);
  };

  const undoPoint = () => {
    setCurrent((prev) => prev.slice(0, -1));
  };

  const clearCurrent = () => setCurrent([]);

  const deleteRoom = (id: string) => {
    setRooms((rs) => rs.filter((r) => r.id !== id));
  };

  const clearAll = () => {
    setRooms([]);
    setCurrent([]);
    setRoomCounter(1);
  };

  const renameRoom = (id: string, name: string) => {
    setRooms((rs) => rs.map((r) => (r.id === id ? { ...r, name } : r)));
  };

  const setRoomHeight = (id: string, heightCm: number) => {
    setRooms((rs) => rs.map((r) => (r.id === id ? { ...r, heightCm } : r)));
  };

  const setRoomFloorMaterial = (id: string, floorMaterial: FloorMaterial) => {
    setRooms((rs) => rs.map((r) => (r.id === id ? { ...r, floorMaterial } : r)));
  };

  const setRoomCategory = (id: string, category: RoomCategory) => {
    setRooms((rs) => rs.map((r) => (r.id === id ? { ...r, category } : r)));
  };

  const setRoomCeilingColor = (id: string, ceilingColor: string) => {
    setRooms((rs) => rs.map((r) => (r.id === id ? { ...r, ceilingColor } : r)));
  };

  const [activeCategoryRoomId, setActiveCategoryRoomId] = useState<string | null>(null);
  const activeCategoryRoom = rooms.find((r) => r.id === activeCategoryRoomId) ?? rooms[0] ?? null;
  const activeCategory: RoomCategory = activeCategoryRoom?.category ?? DEFAULT_ROOM_CATEGORY;
  const catalogForActiveCategory = FURNITURE_CATALOG.filter((f) => f.categories.includes(activeCategory));

  const addFurniture = (type: FurnitureItem["type"]) => {
    // place at the center of the active category room (or first room), or origin if none
    let x = 0;
    let z = 0;
    const targetRoom = activeCategoryRoom ?? rooms[0];
    if (targetRoom) {
      const cx = targetRoom.points.reduce((s, p) => s + p.x, 0) / targetRoom.points.length;
      const cy = targetRoom.points.reduce((s, p) => s + p.y, 0) / targetRoom.points.length;
      x = (cx / GRID_PX) * metersPerCell;
      z = (cy / GRID_PX) * metersPerCell;
    }
    const newItem: FurnitureItem = {
      id: `furn-${crypto.randomUUID()}`,
      type,
      x,
      z,
      rotationY: 0,
    };
    setFurniture((f) => [...f, newItem]);
    setSelectedFurnitureId(newItem.id);
  };

  const moveFurniture = (id: string, x: number, z: number) => {
    setFurniture((f) => f.map((item) => (item.id === id ? { ...item, x, z } : item)));
  };

  const rotateFurniture = (id: string) => {
    setFurniture((f) =>
      f.map((item) =>
        item.id === id ? { ...item, rotationY: item.rotationY + Math.PI / 2 } : item
      )
    );
  };

  const deleteFurniture = (id: string) => {
    setFurniture((f) => f.filter((item) => item.id !== id));
    setSelectedFurnitureId((sel) => (sel === id ? null : sel));
  };

  // Draw the 2D canvas
  useEffect(() => {
    if (viewMode !== "2d") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // grid
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += GRID_PX) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += GRID_PX) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const drawPolygon = (
      points: Point[],
      opts: { fill?: string; stroke?: string; closed?: boolean }
    ) => {
      if (points.length === 0) return;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      if (opts.closed) ctx.closePath();
      if (opts.fill) {
        ctx.fillStyle = opts.fill;
        ctx.fill();
      }
      ctx.strokeStyle = opts.stroke ?? "#1f2937";
      ctx.lineWidth = 4;
      ctx.stroke();

      // corner dots
      ctx.fillStyle = opts.stroke ?? "#1f2937";
      points.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    // finished rooms
    rooms.forEach((room) => {
      drawPolygon(room.points, { fill: "rgba(59,130,246,0.15)", stroke: "#2563eb", closed: true });

      // wall length labels
      for (let i = 0; i < room.points.length; i++) {
        const a = room.points[i];
        const b = room.points[(i + 1) % room.points.length];
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const len = distM(a, b);
        ctx.fillStyle = "#1e3a8a";
        ctx.font = "12px sans-serif";
        ctx.fillText(`${len.toFixed(2)} m`, mid.x + 4, mid.y - 4);
      }

      // room label + area
      const cx = room.points.reduce((s, p) => s + p.x, 0) / room.points.length;
      const cy = room.points.reduce((s, p) => s + p.y, 0) / room.points.length;
      const area = polygonAreaM2(room.points);
      ctx.fillStyle = "#111827";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(room.name, cx, cy - 6);
      ctx.font = "12px sans-serif";
      ctx.fillText(`${area.toFixed(2)} m² · ${(room.heightCm / 100).toFixed(2)} m yükseklik`, cx, cy + 12);
      ctx.textAlign = "left";
    });

    // room currently being drawn
    if (current.length > 0) {
      drawPolygon(current, { stroke: "#dc2626", closed: false });
      // line to mouse cursor (rubber band)
      if (mousePos) {
        const last = current[current.length - 1];
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.strokeStyle = "#fca5a5";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      // highlight closing point once >=3 points
      if (current.length >= 3) {
        ctx.beginPath();
        ctx.arc(current[0].x, current[0].y, CLOSE_SNAP_PX, 0, Math.PI * 2);
        ctx.strokeStyle = "#16a34a";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }, [rooms, current, mousePos, metersPerCell, viewMode]);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
        <input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          style={{ fontWeight: 600, padding: "4px 8px", minWidth: 0, flex: "1 1 160px" }}
        />
        <button onClick={saveProject} disabled={saveStatus === "saving"}>
          {saveStatus === "saving" ? "Kaydediliyor..." : projectId ? "Güncelle" : "Kaydet"}
        </button>
        <button
          onClick={() => {
            setProjectId(null);
            setProjectName("Adsız Proje");
            setRooms([]);
            setFurniture([]);
            setCurrent([]);
            setShareUrl(null);
            setSaveStatus("idle");
            const url = new URL(window.location.href);
            url.searchParams.delete("p");
            window.history.replaceState({}, "", url.toString());
          }}
        >
          Yeni Proje
        </button>
        <button onClick={() => setShowProjectsList((s) => !s)}>
          Projelerim {myProjects.length > 0 ? `(${myProjects.length})` : ""}
        </button>
      </div>

      {showProjectsList && (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 10, marginBottom: 12, maxWidth: 500 }}>
          {myProjects.length === 0 ? (
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Henüz kaydedilmiş projen yok.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
              {myProjects.map((p) => (
                <li key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, fontSize: 13, flexWrap: "wrap" }}>
                  <span>
                    <strong>{p.name}</strong>{" "}
                    <span style={{ color: "#6b7280" }}>
                      · {new Date(p.updated_at).toLocaleString("tr-TR")}
                    </span>
                  </span>
                  <span style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => loadProjectById(p.id)} style={{ fontSize: 12 }}>
                      Aç
                    </button>
                    <button onClick={() => deleteProjectById(p.id)} style={{ fontSize: 12 }}>
                      Sil
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        {loadingProject && <span style={{ fontSize: 13, color: "#6b7280" }}>Proje yükleniyor...</span>}
        {saveStatus === "saved" && shareUrl && (
          <span style={{ fontSize: 13, wordBreak: "break-all" }}>
            Paylaşım linki:{" "}
            <a href={shareUrl} style={{ color: "#2563eb" }}>
              {shareUrl}
            </a>{" "}
            <button
              onClick={() => navigator.clipboard.writeText(shareUrl)}
              style={{ fontSize: 12 }}
            >
              Kopyala
            </button>
          </span>
        )}
        {saveStatus === "error" && (
          <span style={{ fontSize: 13, color: "#dc2626" }}>Kaydetme hatası, tekrar dene.</span>
        )}
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
      <div style={{ flex: "1 1 480px", minWidth: 0 }}>
        <div style={{ marginBottom: 8, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => setViewMode(viewMode === "2d" ? "3d" : "2d")}
            disabled={rooms.length === 0 && viewMode === "2d"}
            style={{ fontWeight: 700 }}
          >
            {viewMode === "2d" ? "3D Görünüme Geç" : "2D Görünüme Dön"}
          </button>
          {viewMode === "2d" && (
            <>
              <label style={{ fontSize: 14 }}>
                Izgara hücresi (cm):{" "}
                <input
                  type="number"
                  value={cmPerCell}
                  min={5}
                  max={200}
                  onChange={(e) => setCmPerCell(Number(e.target.value) || 50)}
                  style={{ width: 70 }}
                />
              </label>
              <button onClick={finishRoom} disabled={current.length < 3}>
                Odayı Bitir
              </button>
              <button onClick={undoPoint} disabled={current.length === 0}>
                Son Noktayı Sil
              </button>
              <button onClick={clearCurrent} disabled={current.length === 0}>
                Çizimi İptal Et
              </button>
              <button onClick={clearAll} disabled={rooms.length === 0 && current.length === 0}>
                Hepsini Temizle
              </button>
            </>
          )}
        </div>

        {viewMode === "2d" ? (
          <>
            <canvas
              ref={canvasRef}
              width={1100}
              height={750}
              style={{ border: "1px solid #9ca3af", cursor: "crosshair", background: "#fff", width: "100%", maxWidth: "100%", height: "auto", touchAction: "none", display: "block" }}
              onClick={handleCanvasClick}
              onMouseMove={(e) => {
                if (!canvasRef.current) return;
                setMousePos(snap(getCanvasPoint(e)));
              }}
            />
            <p style={{ fontSize: 13, color: "#6b7280", maxWidth: "100%" }}>
              Duvar köşelerini sırayla tıkla. En az 3 nokta koyduktan sonra
              başlangıç noktasına (yeşil daire) tıklayarak veya &quot;Odayı
              Bitir&quot; butonuyla odayı kapat.
            </p>
          </>
        ) : (
          <Room3DView
            rooms={rooms}
            metersPerCell={metersPerCell}
            furniture={furniture}
            onMoveFurniture={moveFurniture}
            selectedFurnitureId={selectedFurnitureId}
            onSelectFurniture={setSelectedFurnitureId}
          />
        )}
      </div>

      {viewMode === "3d" && (
        <div style={{ flex: "1 1 260px", minWidth: 240 }}>
          {rooms.length > 1 && (
            <label style={{ fontSize: 13, display: "block", marginBottom: 8 }}>
              Aktif oda (kategori için):{" "}
              <select
                value={activeCategoryRoom?.id ?? ""}
                onChange={(e) => setActiveCategoryRoomId(e.target.value)}
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <h3 style={{ marginTop: 0, marginBottom: 4 }}>Mobilya Kataloğu</h3>
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
            Kategori: {ROOM_CATEGORIES.find((c) => c.value === activeCategory)?.label}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
            {catalogForActiveCategory.map((f) => (
              <button key={f.type} onClick={() => addFurniture(f.type)}>
                + {f.label} Ekle
              </button>
            ))}
            {catalogForActiveCategory.length === 0 && (
              <p style={{ fontSize: 13, color: "#6b7280" }}>Bu kategori için henüz mobilya yok.</p>
            )}
          </div>

          <h4>Yerleştirilenler</h4>
          {furniture.length === 0 && <p style={{ color: "#6b7280", fontSize: 14 }}>Henüz mobilya yok.</p>}
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {furniture.map((item) => {
              const label = FURNITURE_CATALOG.find((c) => c.type === item.type)?.label ?? item.type;
              const isSelected = item.id === selectedFurnitureId;
              return (
                <li
                  key={item.id}
                  onClick={() => setSelectedFurnitureId(item.id)}
                  style={{
                    border: isSelected ? "2px solid #2563eb" : "1px solid #e5e7eb",
                    borderRadius: 8,
                    padding: 8,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    <button onClick={(e) => { e.stopPropagation(); rotateFurniture(item.id); }} style={{ fontSize: 12 }}>
                      Döndür (90°)
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteFurniture(item.id); }} style={{ fontSize: 12 }}>
                      Sil
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {viewMode === "2d" && (
        <div style={{ flex: "1 1 260px", minWidth: 240 }}>
          <h3 style={{ marginTop: 0 }}>Odalar</h3>
          {rooms.length === 0 && <p style={{ color: "#6b7280", fontSize: 14 }}>Henüz oda yok.</p>}
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {rooms.map((room) => (
              <li key={room.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 8 }}>
                <input
                  value={room.name}
                  onChange={(e) => renameRoom(room.id, e.target.value)}
                  style={{ width: "100%", marginBottom: 4, fontWeight: 600 }}
                />
                <div style={{ fontSize: 13, color: "#374151" }}>
                  {polygonAreaM2(room.points).toFixed(2)} m²
                </div>
                <label style={{ fontSize: 12, display: "block", marginTop: 4 }}>
                  Yükseklik (cm):{" "}
                  <input
                    type="number"
                    value={room.heightCm}
                    min={100}
                    max={500}
                    onChange={(e) => setRoomHeight(room.id, Number(e.target.value) || DEFAULT_HEIGHT_CM)}
                    style={{ width: 60 }}
                  />
                </label>
                <label style={{ fontSize: 12, display: "block", marginTop: 4 }}>
                  Oda Tipi:{" "}
                  <select
                    value={room.category}
                    onChange={(e) => setRoomCategory(room.id, e.target.value as RoomCategory)}
                  >
                    {ROOM_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ fontSize: 12, display: "block", marginTop: 4 }}>
                  Zemin:{" "}
                  <select
                    value={room.floorMaterial}
                    onChange={(e) => setRoomFloorMaterial(room.id, e.target.value as FloorMaterial)}
                  >
                    <option value="ahsap">Ahşap</option>
                    <option value="mermer">Mermer</option>
                  </select>
                </label>
                <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                  Tavan rengi:{" "}
                  <input
                    type="color"
                    value={room.ceilingColor}
                    onChange={(e) => setRoomCeilingColor(room.id, e.target.value)}
                    style={{ width: 32, height: 22, padding: 0, border: "1px solid #d1d5db" }}
                  />
                </label>
                <button onClick={() => deleteRoom(room.id)} style={{ marginTop: 4, fontSize: 12 }}>
                  Sil
                </button>
              </li>
            ))}
          </ul>
          {rooms.length > 0 && (
            <p style={{ fontSize: 13, marginTop: 12 }}>
              <strong>Toplam alan:</strong>{" "}
              {rooms.reduce((s, r) => s + polygonAreaM2(r.points), 0).toFixed(2)} m²
            </p>
          )}
        </div>
      )}
    </div>
  </div>
  );
}
