"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { clsx } from "clsx";
import { Rotate3D, Eye, X, ZoomIn, ZoomOut, Zap, ShieldAlert, Sparkles, Layers } from "lucide-react";
import { AnatomicalSubdivisionId } from "./MedicalVectorAtlas";

export interface Interactive3DBiomechanicsLabProps {
  movementName: string;
  primaryMuscle?: string;
  targetMuscle?: string;
  secondaryMuscles?: string[];
  resistanceProfile?: "lengthened" | "shortened" | "constant" | "ascending";
  onClose?: () => void;
  className?: string;
}

export function Interactive3DBiomechanicsLab({
  movementName,
  primaryMuscle,
  targetMuscle,
  secondaryMuscles = ["Front Deltoids", "Triceps (Lateral Head)"],
  resistanceProfile = "lengthened",
  onClose,
  className,
}: Interactive3DBiomechanicsLabProps) {
  const effectivePrimary = targetMuscle || primaryMuscle || "Upper Chest (Clavicular Head)";
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 3D Orbital Camera angles
  const [rotationY, setRotationY] = useState<number>(0); // Azimuth: 0 = front, 180 = back
  const [rotationX, setRotationX] = useState<number>(0); // Elevation
  const [zoom, setZoom] = useState<number>(1.0);
  const [isFormBreakdownSimulated, setIsFormBreakdownSimulated] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<"front" | "back" | "oblique" | "torso">("front");

  const isDragging = useRef<boolean>(false);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Handle Drag / Touch Rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    setRotationY((prev) => (prev + deltaX * 0.8) % 360);
    setRotationX((prev) => Math.max(-45, Math.min(45, prev + deltaY * 0.5)));
    setActivePreset("oblique");
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // Touch Handlers for Gym Smartphones
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - lastMousePos.current.x;
    const deltaY = e.touches[0].clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

    setRotationY((prev) => (prev + deltaX * 0.9) % 360);
    setRotationX((prev) => Math.max(-45, Math.min(45, prev + deltaY * 0.6)));
    setActivePreset("oblique");
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  // Camera Presets
  const applyPreset = (preset: "front" | "back" | "oblique" | "torso") => {
    setActivePreset(preset);
    if (preset === "front") {
      setRotationY(0);
      setRotationX(0);
      setZoom(1.0);
    } else if (preset === "back") {
      setRotationY(180);
      setRotationX(0);
      setZoom(1.0);
    } else if (preset === "oblique") {
      setRotationY(45);
      setRotationX(10);
      setZoom(1.1);
    } else if (preset === "torso") {
      setRotationY(15);
      setRotationX(5);
      setZoom(1.5);
    }
  };

  // 3D Canvas Rendering Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const render = () => {
      t += 0.03;
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Deep dark aerospace lab background with radial glow
      const bgGrad = ctx.createRadialGradient(cx, cy * 0.8, 20, cx, cy, width * 0.7);
      bgGrad.addColorStop(0, "#0c1524");
      bgGrad.addColorStop(0.7, "#06090f");
      bgGrad.addColorStop(1, "#030508");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Perspective 3D rotation projection helper
      const radY = ((rotationY % 360) * Math.PI) / 180;
      const radX = (rotationX * Math.PI) / 180;
      const cosY = Math.cos(radY);
      const sinY = Math.sin(radY);
      const cosX = Math.cos(radX);
      const sinX = Math.sin(radX);

      const project = (x: number, y: number, z: number) => {
        // Rotate Y (azimuth)
        const x1 = x * cosY - z * sinY;
        const z1 = z * cosY + x * sinY;

        // Rotate X (elevation)
        const y2 = y * cosX - z1 * sinX;
        const z2 = z1 * cosX + y * sinX;

        // Perspective scale
        const fov = 400;
        const scale = (fov / (fov + z2)) * zoom;
        const px = cx + x1 * scale;
        const py = cy + y2 * scale;
        return { px, py, z: z2, scale };
      };

      // 1. Draw 3D Ground Holographic Grid
      ctx.strokeStyle = "rgba(16, 185, 129, 0.15)";
      ctx.lineWidth = 1;
      for (let g = -100; g <= 100; g += 40) {
        const p1 = project(g, 150, -100);
        const p2 = project(g, 150, 100);
        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.stroke();

        const p3 = project(-100, 150, g);
        const p4 = project(100, 150, g);
        ctx.beginPath();
        ctx.moveTo(p3.px, p3.py);
        ctx.lineTo(p4.px, p4.py);
        ctx.stroke();
      }

      // 2. Anatomical 3D Mesh Nodes
      const isChestActive = !isFormBreakdownSimulated;
      const isShoulderFault = isFormBreakdownSimulated;

      // Color pallete
      const primeColor = isChestActive
        ? `rgba(16, 185, 129, ${0.75 + Math.sin(t * 3) * 0.2})`
        : "rgba(30, 41, 59, 0.4)";
      const primeStroke = isChestActive ? "#10b981" : "#334155";

      const faultColor = isShoulderFault
        ? `rgba(239, 68, 68, ${0.8 + Math.sin(t * 4) * 0.2})`
        : "rgba(6, 182, 212, 0.4)";
      const faultStroke = isShoulderFault ? "#ef4444" : "#06b6d4";

      // Muscle Ellipsoids (Upper Pecs, Mid Pecs, Shoulders, Lats, Ribs, Arms, Spine)
      const structures = [
        // Head / Cranium
        { name: "head", x: 0, y: -120, z: 0, rx: 18, ry: 24, fill: "#0e1828", stroke: "#1c2e4a" },
        // Upper Clavicular Pec (Left & Right)
        {
          name: "pec_clav_l",
          x: -22,
          y: -65,
          z: -18,
          rx: 20,
          ry: 14,
          fill: primeColor,
          stroke: primeStroke,
          glow: isChestActive,
        },
        {
          name: "pec_clav_r",
          x: 22,
          y: -65,
          z: -18,
          rx: 20,
          ry: 14,
          fill: primeColor,
          stroke: primeStroke,
          glow: isChestActive,
        },
        // Sternal Mid Pec (Left & Right)
        {
          name: "pec_stern_l",
          x: -20,
          y: -45,
          z: -20,
          rx: 18,
          ry: 16,
          fill: isChestActive ? "rgba(16, 185, 129, 0.4)" : "#0f172a",
          stroke: isChestActive ? "#059669" : "#1e293b",
        },
        {
          name: "pec_stern_r",
          x: 20,
          y: -45,
          z: -20,
          rx: 18,
          ry: 16,
          fill: isChestActive ? "rgba(16, 185, 129, 0.4)" : "#0f172a",
          stroke: isChestActive ? "#059669" : "#1e293b",
        },
        // Anterior / Lateral Deltoids (Shoulders)
        {
          name: "delt_l",
          x: -54,
          y: -68,
          z: -5,
          rx: 16,
          ry: 22,
          fill: faultColor,
          stroke: faultStroke,
          glow: isShoulderFault,
        },
        {
          name: "delt_r",
          x: 54,
          y: -68,
          z: -5,
          rx: 16,
          ry: 22,
          fill: faultColor,
          stroke: faultStroke,
          glow: isShoulderFault,
        },
        // Biceps & Arms
        { name: "bicep_l", x: -62, y: -25, z: 0, rx: 12, ry: 20, fill: "#0d1624", stroke: "#1e2e46" },
        { name: "bicep_r", x: 62, y: -25, z: 0, rx: 12, ry: 20, fill: "#0d1624", stroke: "#1e2e46" },
        // Abdominal Core
        { name: "abs", x: 0, y: -15, z: -14, rx: 22, ry: 35, fill: "#0a111c", stroke: "#18263a" },
        // Latissimus Dorsi (Wings on back)
        {
          name: "lats_l",
          x: -36,
          y: -35,
          z: 14,
          rx: 18,
          ry: 32,
          fill: "rgba(15, 23, 42, 0.8)",
          stroke: "#223552",
        },
        {
          name: "lats_r",
          x: 36,
          y: -35,
          z: 14,
          rx: 18,
          ry: 32,
          fill: "rgba(15, 23, 42, 0.8)",
          stroke: "#223552",
        },
        // Pelvis & Glutes
        { name: "pelvis", x: 0, y: 35, z: 0, rx: 32, ry: 22, fill: "#090f18", stroke: "#19283f" },
        // Thighs / Quads
        { name: "thigh_l", x: -22, y: 80, z: -5, rx: 16, ry: 36, fill: "#0a121e", stroke: "#192a42" },
        { name: "thigh_r", x: 22, y: 80, z: -5, rx: 16, ry: 36, fill: "#0a121e", stroke: "#192a42" },
      ];

      // Sort by Z depth for realistic rendering painter's algorithm
      const projected = structures.map((s) => ({
        ...s,
        proj: project(s.x, s.y, s.z),
      }));
      projected.sort((a, b) => b.proj.z - a.proj.z);

      // Render each anatomical ellipsoid
      for (const item of projected) {
        const { px, py, scale } = item.proj;
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(px, py, item.rx * scale, item.ry * scale, 0, 0, Math.PI * 2);

        if (item.glow) {
          ctx.shadowColor = item.stroke;
          ctx.shadowBlur = 15;
        }

        ctx.fillStyle = item.fill;
        ctx.fill();
        ctx.lineWidth = 1.2 * scale;
        ctx.strokeStyle = item.stroke;
        ctx.stroke();

        // Muscle fiber striations inside prime target
        if (item.glow) {
          ctx.beginPath();
          ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
          ctx.lineWidth = 0.8 * scale;
          for (let i = -10; i <= 10; i += 5) {
            ctx.moveTo(px - 10 * scale, py + i * scale);
            ctx.lineTo(px + 10 * scale, py + (i - 4) * scale);
          }
          ctx.stroke();
        }

        ctx.restore();
      }

      // 3. Kinetic 3D Force Vectors (Converging Press Arc)
      if (isChestActive) {
        const pStartL = project(-70, -60, -25);
        const pEndL = project(-10, -70, -22);
        const pStartR = project(70, -60, -25);
        const pEndR = project(10, -70, -22);

        ctx.save();
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 2.5 * zoom;
        ctx.setLineDash([6, 4]);

        // Left force arrow
        ctx.beginPath();
        ctx.moveTo(pStartL.px, pStartL.py);
        ctx.lineTo(pEndL.px, pEndL.py);
        ctx.stroke();

        // Right force arrow
        ctx.beginPath();
        ctx.moveTo(pStartR.px, pStartR.py);
        ctx.lineTo(pEndR.px, pEndR.py);
        ctx.stroke();

        // Arrow heads
        ctx.fillStyle = "#10b981";
        ctx.beginPath();
        ctx.arc(pEndL.px, pEndL.py, 4 * zoom, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(pEndR.px, pEndR.py, 4 * zoom, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        // Red compensation vector: shoulders flaring out
        const pStartL = project(-40, -68, -5);
        const pEndL = project(-80, -90, -5);
        const pStartR = project(40, -68, -5);
        const pEndR = project(80, -90, -5);

        ctx.save();
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 3 * zoom;
        ctx.setLineDash([4, 4]);

        ctx.beginPath();
        ctx.moveTo(pStartL.px, pStartL.py);
        ctx.lineTo(pEndL.px, pEndL.py);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(pStartR.px, pStartR.py);
        ctx.lineTo(pEndR.px, pEndR.py);
        ctx.stroke();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [rotationY, rotationX, zoom, isFormBreakdownSimulated]);

  return (
    <div
      className={clsx(
        "relative flex flex-col w-full max-w-xl mx-auto rounded-3xl bg-[#05080e] border border-[#1b2d47] shadow-2xl overflow-hidden font-body select-none",
        className
      )}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between p-4 border-b border-[#142338] bg-[#070b13]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
            <Rotate3D className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
              <span className="text-[10px] font-mono font-black uppercase tracking-wider text-[#10b981]">
                3D Kinetic Lab // Orbit 360°
              </span>
            </div>
            <h3 className="text-sm font-display font-black text-white uppercase tracking-tight">
              {movementName}
            </h3>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#0b121e] hover:bg-[#142032] border border-[#1c2c44] flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main 3D Canvas Viewport */}
      <div className="relative w-full h-[320px] bg-[#04060a] overflow-hidden cursor-grab active:cursor-grabbing">
        <canvas
          ref={canvasRef}
          width={500}
          height={320}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full h-full block"
        />

        {/* Orbit Drag Instruction Overlay */}
        <div className="absolute top-3 left-3 pointer-events-none flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#090e18]/80 border border-[#19273c] text-[10px] font-mono text-slate-400">
          <Rotate3D className="w-3 h-3 text-cyan-400" />
          <span>Drag to orbit 360°</span>
        </div>

        {/* Resistance Profile Badge */}
        <div className="absolute top-3 right-3 pointer-events-none flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#090e18]/90 border border-[#10b981]/40 text-[10px] font-mono font-bold text-[#10b981] uppercase tracking-wider">
          <Zap className="w-3 h-3 text-[#10b981]" />
          <span>Peak Tension: {resistanceProfile}</span>
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 z-10">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2.0, z + 0.2))}
            className="w-7 h-7 rounded-lg bg-[#0b121e]/90 hover:bg-[#142032] border border-[#1c2c44] flex items-center justify-center text-slate-300 transition-all active:scale-95"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
            className="w-7 h-7 rounded-lg bg-[#0b121e]/90 hover:bg-[#142032] border border-[#1c2c44] flex items-center justify-center text-slate-300 transition-all active:scale-95"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Camera Preset Quick Buttons */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 z-10">
          {(["front", "oblique", "back", "torso"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => applyPreset(p)}
              className={clsx(
                "px-2 py-1 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider transition-all",
                activePreset === p
                  ? "bg-[#10b981] text-black shadow-md"
                  : "bg-[#0b121e]/80 hover:bg-[#142032] border border-[#1c2c44] text-slate-300"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Mind-Muscle Form Breakdown Simulator Toggle */}
      <div className="p-4 border-t border-[#142338] bg-[#070b13] space-y-3">
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#090e18] border border-[#19273c]">
          <div className="flex items-center gap-2">
            {isFormBreakdownSimulated ? (
              <ShieldAlert className="w-4 h-4 text-[#ef4444] animate-bounce shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-[#10b981] shrink-0" />
            )}
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Form Simulation Mode
              </span>
              <p className="text-xs font-bold text-white leading-tight">
                {isFormBreakdownSimulated ? "Fault: Front Shoulder Dominance" : "Optimal: Clavicular Upper Pec"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsFormBreakdownSimulated((prev) => !prev)}
            className={clsx(
              "px-3 py-1.5 rounded-xl text-[10px] font-mono font-black uppercase tracking-wider transition-all shadow-sm active:scale-95",
              isFormBreakdownSimulated
                ? "bg-[#ef4444] text-white"
                : "bg-[#10b981] text-black"
            )}
          >
            {isFormBreakdownSimulated ? "Reset to Clean Form" : "Simulate Shoulder Fault"}
          </button>
        </div>

        {/* Real-Time Mechanical Diagnostic Explanation */}
        <div
          className={clsx(
            "p-3 rounded-xl border text-xs leading-relaxed",
            isFormBreakdownSimulated
              ? "bg-[#ef4444]/10 border-[#ef4444]/40 text-red-100"
              : "bg-[#10b981]/10 border-[#10b981]/30 text-emerald-200"
          )}
        >
          {isFormBreakdownSimulated ? (
            <p>
              <strong className="text-[#ef4444] uppercase font-mono tracking-wider block mb-0.5">
                Shoulder Hijacking Tension:
              </strong>
              When elbows flare past 60° and scapulae unlock, the anterior deltoids and supraspinatus absorb 65% of the compressive load. The upper clavicular chest relaxes, reducing hypertrophy stimulus and increasing impingement risk.
            </p>
          ) : (
            <p>
              <strong className="text-[#10b981] uppercase font-mono tracking-wider block mb-0.5">
                Clavicular Line of Drive (Optimal):
              </strong>
              Bench set at 30° aligns the dumbbell descent with the natural origin-to-insertion angle of the clavicular pectoral fibers. Scapulae remain depressed, maximizing stretch at the bottom without joint compensation.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
