import React, { useState } from "react";
import {
  Color,
  COLORS,
  PLAYERS,
  SAFE,
  TRACK,
  Token,
  CELL,
  tokenCoord,
  FINISH,
} from "./constants";
import { Crown, Target } from "lucide-react";

interface BoardProps {
  tokens: Token[];
  movable: string[];
  currentColor: Color;
  dice: number | null;
  onTokenClick: (id: string) => void;
  interactive: boolean;
  lastMovedId: string | null;
}

const TRACK_KEYS = new Set(TRACK.map(([r, c]) => `${r},${c}`));

// Lookup of which color a start cell belongs to.
const STARTS: Record<string, Color> = {};
for (const color of COLORS) {
  const [r, c] = TRACK[PLAYERS[color].start];
  STARTS[`${r},${c}`] = color;
}

// Safe cell coords.
const SAFE_KEYS = new Set(
  [...SAFE].map((i) => {
    const [r, c] = TRACK[i];
    return `${r},${c}`;
  })
);

// Home column lookup.
const HOME_COLOR: Record<string, Color> = {};
for (const color of COLORS) {
  for (const [r, c] of PLAYERS[color].home) HOME_COLOR[`${r},${c}`] = color;
}

function cellStyle(r: number, c: number): React.CSSProperties {
  return {
    position: "absolute",
    top: `${r * CELL}%`,
    left: `${c * CELL}%`,
    width: `${CELL}%`,
    height: `${CELL}%`,
  };
}

// Helper to find target coordinate for ghost preview
function getTargetCoord(t: Token, dice: number): { r: number; c: number } | null {
  if (t.state === "done") return null;
  const def = PLAYERS[t.color];
  let nextProgress = 0;

  if (t.state === "yard") {
    if (dice !== 6) return null;
    nextProgress = 0;
  } else {
    nextProgress = t.progress + dice;
    if (nextProgress > FINISH) return null;
  }

  // nextProgress === FINISH tombe intentionnellement dans la branche du dessous :
  // tokenCoord() place un pion arrive a 56 sur def.home[5] (case propre a sa couleur,
  // pas le centre du plateau), l'aperçu doit viser exactement la meme case.
  if (nextProgress <= 50) {
    const [row, col] = TRACK[(def.start + nextProgress) % 52];
    return { r: row + 0.5, c: col + 0.5 };
  }
  const [row, col] = def.home[nextProgress - 51];
  return { r: row + 0.5, c: col + 0.5 };
}

export default function Board(props: BoardProps) {
  const { tokens, movable, dice, onTokenClick, interactive, lastMovedId } = props;
  const [hoverId, setHoverId] = useState<string | null>(null);

  // Build track + home cells.
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      const key = `${r},${c}`;
      const isTrack = TRACK_KEYS.has(key);
      const homeColor = HOME_COLOR[key];
      if (!isTrack && !homeColor) continue;

      const startColor = STARTS[key];
      let bg = "#ffffff";
      if (homeColor) bg = PLAYERS[homeColor].hex;
      else if (startColor) bg = PLAYERS[startColor].light;

      cells.push(
        <div
          key={"cell-" + key}
          style={{
            ...cellStyle(r, c),
            background: bg,
            boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.08)",
          }}
          className="flex items-center justify-center transition-colors duration-300"
        >
          {SAFE_KEYS.has(key) && (
            <div className="flex flex-col items-center justify-center">
              <span
                className="text-lg leading-none select-none transition-transform duration-300 hover:scale-125"
                style={{
                  color: startColor ? "rgba(0,0,0,0.5)" : "#94a3b8",
                  textShadow: "0 1px 2px rgba(0,0,0,0.1)",
                }}
              >
                ★
              </span>
            </div>
          )}
        </div>
      );
    }
  }

  // Token overlap offsets per cell.
  const groups: Record<string, Token[]> = {};
  for (const t of tokens) {
    const { r, c } = tokenCoord(t);
    const k = `${Math.round(r * 2)},${Math.round(c * 2)}`;
    (groups[k] ||= []).push(t);
  }

  const tokenEls = tokens.map((t) => {
    const { r, c } = tokenCoord(t);
    const k = `${Math.round(r * 2)},${Math.round(c * 2)}`;
    const grp = groups[k];
    const idx = grp.indexOf(t);
    const n = grp.length;
    let dx = 0;
    let dy = 0;

    if (n > 1 && t.state !== "yard") {
      const ang = (idx / n) * Math.PI * 2;
      const rad = 0.24;
      dx = Math.cos(ang) * rad;
      dy = Math.sin(ang) * rad;
    }

    const def = PLAYERS[t.color];
    const canMove = movable.includes(t.id) && interactive;
    const isHovered = hoverId === t.id && canMove;
    const size = t.state === "yard" ? CELL * 1.18 : CELL * 0.86;

    return (
      <button
        key={t.id}
        onClick={() => canMove && onTokenClick(t.id)}
        onMouseEnter={() => canMove && setHoverId(t.id)}
        onMouseLeave={() => setHoverId(null)}
        disabled={!canMove}
        style={{
          position: "absolute",
          top: `${(r + dy) * CELL}%`,
          left: `${(c + dx) * CELL}%`,
          width: `${size}%`,
          height: `${size}%`,
          transform: `translate(-50%, -50%) ${
            isHovered ? "scale(1.2) translateY(-4px)" : ""
          }`,
          background: `radial-gradient(circle at 35% 25%, ${def.light}, ${def.hex} 75%, #881337 100%)`,
          border: "2.5px solid rgba(255,255,255,0.95)",
          boxShadow:
            (canMove
              ? `0 0 15px 4px ${def.hex}, 0 0 0 3px rgba(255,255,255,0.9)`
              : "0 4px 6px rgba(0,0,0,0.3)") +
            (t.id === lastMovedId ? ", 0 0 25px 8px rgba(255,255,255,0.85)" : "") +
            (isHovered ? ", 0 8px 16px rgba(0,0,0,0.5)" : ""),
          cursor: canMove ? "pointer" : "default",
          zIndex: canMove ? (isHovered ? 50 : 40) : 20,
          transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          // @ts-ignore
          "--pulse-color": def.hex,
        }}
        className={`rounded-full flex items-center justify-center font-bold text-white shadow-xl ${
          canMove && !isHovered ? "animate-token-pulse animate-float" : ""
        }`}
        title={canMove ? `Cliquez pour déplacer ${def.name}` : undefined}
      >
        {t.state === "done" && <span className="text-[10px]">★</span>}
        {t.state !== "done" && (
          <span className="opacity-40 text-[9px] drop-shadow">
            {t.slot + 1}
          </span>
        )}
      </button>
    );
  });

  // Calculate Ghost Preview
  let ghostEl: React.ReactNode = null;
  if (hoverId && dice !== null) {
    const hoveringToken = tokens.find((t) => t.id === hoverId);
    if (hoveringToken) {
      const targetC = getTargetCoord(hoveringToken, dice);
      if (targetC) {
        const def = PLAYERS[hoveringToken.color];
        ghostEl = (
          <div
            style={{
              position: "absolute",
              top: `${targetC.r * CELL}%`,
              left: `${targetC.c * CELL}%`,
              width: `${CELL * 0.9}%`,
              height: `${CELL * 0.9}%`,
              transform: "translate(-50%, -50%)",
              zIndex: 35,
              borderColor: def.hex,
            }}
            className="rounded-full border-4 border-dashed bg-white/60 backdrop-blur-md shadow-2xl flex items-center justify-center animate-spin"
          >
            <Target className="w-5 h-5" style={{ color: def.hex }} />
          </div>
        );
      }
    }
  }

  return (
    <div
      className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] ring-4 ring-white/20 select-none"
      style={{ background: "#f8fafc" }}
    >
      {/* Corner yards */}
      {COLORS.map((color) => {
        const def = PLAYERS[color];
        return (
          <div
            key={"base-" + color}
            style={{
              position: "absolute",
              top: `${def.base.r0 * CELL}%`,
              left: `${def.base.c0 * CELL}%`,
              width: `${CELL * 6}%`,
              height: `${CELL * 6}%`,
              background: `radial-gradient(circle at 20% 20%, ${def.light}, ${def.hex} 80%)`,
            }}
            className="flex flex-col items-center justify-center p-3 shadow-inner"
          >
            {/* Elegant inner yard playground */}
            <div
              className="bg-white/95 rounded-2xl shadow-xl border-4 flex items-center justify-center relative overflow-hidden"
              style={{
                width: "72%",
                height: "72%",
                borderColor: def.light,
              }}
            >
              {/* Center player crest / initial */}
              <span
                className="absolute font-black tracking-tighter select-none opacity-10 text-5xl"
                style={{ color: def.hex }}
              >
                {def.name[0]}
              </span>
            </div>
          </div>
        );
      })}

      {cells}

      {/* Ghost target preview */}
      {ghostEl}

      {/* Center triangles (home finish) */}
      <div
        style={{
          position: "absolute",
          top: `${6 * CELL}%`,
          left: `${6 * CELL}%`,
          width: `${CELL * 3}%`,
          height: `${CELL * 3}%`,
        }}
        className="shadow-2xl flex items-center justify-center relative overflow-hidden"
      >
        <div
          className="absolute inset-0 transition-opacity"
          style={{
            background: PLAYERS.green.hex,
            clipPath: "polygon(0 0,100% 0,50% 50%)",
          }}
        />
        <div
          className="absolute inset-0 transition-opacity"
          style={{
            background: PLAYERS.yellow.hex,
            clipPath: "polygon(100% 0,100% 100%,50% 50%)",
          }}
        />
        <div
          className="absolute inset-0 transition-opacity"
          style={{
            background: PLAYERS.blue.hex,
            clipPath: "polygon(0 100%,100% 100%,50% 50%)",
          }}
        />
        <div
          className="absolute inset-0 transition-opacity"
          style={{
            background: PLAYERS.red.hex,
            clipPath: "polygon(0 0,0 100%,50% 50%)",
          }}
        />
        {/* Golden Central Win Crown */}
        <div className="absolute w-7 h-7 rounded-full bg-gradient-to-tr from-amber-200 via-yellow-400 to-amber-600 shadow-xl flex items-center justify-center ring-2 ring-white z-20 animate-pulse">
          <Crown className="w-4 h-4 text-slate-950 fill-slate-950" />
        </div>
      </div>

      {tokenEls}
    </div>
  );
}
