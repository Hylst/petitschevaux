import {
  Color,
  COLORS,
  PLAYERS,
  SAFE,
  Token,
  FINISH,
  globalIndex,
} from "./constants";

export type PlayerType = "human" | "ai";
export type Phase = "roll" | "move" | "gameover";
export type SoundTrigger =
  | "click"
  | "roll"
  | "move"
  | "capture"
  | "spawn"
  | "home"
  | "victory"
  | null;

export interface LogEntry {
  id: string;
  text: string;
  color: Color;
  time: Date;
}

export interface GameState {
  tokens: Token[];
  order: Color[];
  turnIdx: number;
  dice: number | null;
  phase: Phase;
  types: Record<Color, PlayerType>;
  message: string;
  winner: Color | null;
  sixCount: number;
  movable: string[]; // token ids that can move with current dice
  lastMovedId: string | null;
  soundTrigger: SoundTrigger;
  history: LogEntry[];
}

export function createTokens(): Token[] {
  const tokens: Token[] = [];
  for (const color of COLORS) {
    for (let i = 0; i < 4; i++) {
      tokens.push({
        id: `${color}-${i}`,
        color,
        slot: i,
        state: "yard",
        progress: 0,
      });
    }
  }
  return tokens;
}

export function initState(types: Record<Color, PlayerType>): GameState {
  const order = [...COLORS];
  const firstColor = order[0];
  return {
    tokens: createTokens(),
    order,
    turnIdx: 0,
    dice: null,
    phase: "roll",
    types,
    message: `Tour de ${PLAYERS[firstColor].name} — Lancez les dés !`,
    winner: null,
    sixCount: 0,
    movable: [],
    lastMovedId: null,
    soundTrigger: null,
    history: [
      {
        id: "init",
        text: `Début de la partie ! Tour de ${PLAYERS[firstColor].name}.`,
        color: firstColor,
        time: new Date(),
      },
    ],
  };
}

export function currentColor(s: GameState): Color {
  return s.order[s.turnIdx];
}

function getMovable(tokens: Token[], color: Color, dice: number): string[] {
  return tokens
    .filter((t) => {
      if (t.color !== color || t.state === "done") return false;
      if (t.state === "yard") return dice === 6;
      return t.progress + dice <= FINISH;
    })
    .map((t) => t.id);
}

export type Action =
  | { type: "ROLL"; value?: number }
  | { type: "MOVE"; id: string }
  | { type: "RESET"; types: Record<Color, PlayerType> }
  | { type: "SET_TYPE"; color: Color; value: PlayerType }
  | { type: "CLEAR_SOUND" };

function addLog(history: LogEntry[], color: Color, text: string): LogEntry[] {
  return [
    {
      id: `${Date.now()}-${Math.random()}`,
      text,
      color,
      time: new Date(),
    },
    ...history.slice(0, 49),
  ];
}

function nextTurn(s: GameState): Partial<GameState> {
  const turnIdx = (s.turnIdx + 1) % s.order.length;
  const color = s.order[turnIdx];
  return {
    turnIdx,
    dice: null,
    phase: "roll",
    sixCount: 0,
    movable: [],
    message: `Tour de ${PLAYERS[color].name} — Lancez les dés !`,
  };
}

export function reducer(s: GameState, action: Action): GameState {
  switch (action.type) {
    case "CLEAR_SOUND":
      return { ...s, soundTrigger: null };

    case "RESET":
      return { ...initState(action.types), soundTrigger: "click" };

    case "SET_TYPE": {
      return {
        ...s,
        types: { ...s.types, [action.color]: action.value },
        soundTrigger: "click",
        history: addLog(
          s.history,
          action.color,
          `${PLAYERS[action.color].name} est maintenant contrôlé par : ${
            action.value === "ai" ? "L'ordinateur" : "Un joueur"
          }.`
        ),
      };
    }

    case "ROLL": {
      if (s.phase !== "roll") return s;
      const color = currentColor(s);
      const value = action.value ?? Math.floor(Math.random() * 6) + 1;
      const sixCount = value === 6 ? s.sixCount + 1 : 0;

      // Three sixes in a row forfeits the turn.
      if (sixCount === 3) {
        const msg = `🎲 ${PLAYERS[color].name} a obtenu trois 6 consécutifs — son tour est annulé !`;
        return {
          ...s,
          dice: value,
          ...nextTurn(s),
          message: msg,
          soundTrigger: "click",
          history: addLog(s.history, color, msg),
        } as GameState;
      }

      const movable = getMovable(s.tokens, color, value);
      if (movable.length === 0) {
        const msg = `🎲 ${PLAYERS[color].name} a lancé un ${value} — aucun pion ne peut bouger.`;
        return {
          ...s,
          dice: value,
          sixCount,
          movable: [],
          ...nextTurn(s),
          message: msg,
          soundTrigger: "roll",
          history: addLog(s.history, color, msg),
        } as GameState;
      }

      return {
        ...s,
        dice: value,
        sixCount,
        movable,
        phase: "move",
        soundTrigger: "roll",
        message:
          movable.length === 1
            ? `🎲 ${PLAYERS[color].name} a obtenu un ${value} — Déplacement en cours.`
            : `🎲 ${PLAYERS[color].name} a obtenu un ${value} — Choisissez un pion à déplacer.`,
      };
    }

    case "MOVE": {
      if (s.phase !== "move" || s.dice === null) return s;
      if (!s.movable.includes(action.id)) return s;
      const color = currentColor(s);
      const dice = s.dice;

      let captured = 0;
      let finished = false;
      let spawned = false;

      const tokens = s.tokens.map((t) => ({ ...t }));
      const moving = tokens.find((t) => t.id === action.id)!;

      if (moving.state === "yard") {
        moving.state = "active";
        moving.progress = 0;
        spawned = true;
      } else {
        moving.progress += dice;
        if (moving.progress === FINISH) {
          moving.state = "done";
          finished = true;
        }
      }

      // Capturing — only on the shared main track and non-safe cells.
      if (moving.state === "active" && moving.progress <= 50) {
        const gi = globalIndex(color, moving.progress);
        if (!SAFE.has(gi)) {
          for (const t of tokens) {
            if (
              t.color !== color &&
              t.state === "active" &&
              t.progress <= 50 &&
              globalIndex(t.color, t.progress) === gi
            ) {
              t.state = "yard";
              t.progress = 0;
              captured++;
            }
          }
        }
      }

      let trigger: SoundTrigger = "move";
      if (captured > 0) trigger = "capture";
      else if (finished) trigger = "home";
      else if (spawned) trigger = "spawn";

      let actionDesc = `Pion avancé de ${dice} case${dice > 1 ? "s" : ""}.`;
      if (spawned) actionDesc = `✨ Un nouveau pion sort de sa base !`;
      if (captured > 0) actionDesc = `⚔️ Capture spectaculaire ! Pion adverse renvoyé en base !`;
      if (finished) actionDesc = `🌟 Magnifique ! Un pion atteint le centre en sécurité !`;

      const nextHistory = addLog(s.history, color, actionDesc);

      // Win check.
      const allDone = tokens
        .filter((t) => t.color === color)
        .every((t) => t.state === "done");
      if (allDone) {
        const winMsg = `🏆 Victoire éclatante de ${PLAYERS[color].name} ! Game Over.`;
        return {
          ...s,
          tokens,
          dice: null,
          phase: "gameover",
          movable: [],
          winner: color,
          lastMovedId: moving.id,
          soundTrigger: "victory",
          message: winMsg,
          history: addLog(nextHistory, color, winMsg),
        };
      }

      const extra = dice === 6 || captured > 0 || finished;
      let msg = "";
      if (captured > 0)
        msg = `⚔️ ${PLAYERS[color].name} a capturé ${captured} pion${
          captured > 1 ? "s" : ""
        } ! Relancez les dés.`;
      else if (finished)
        msg = `🌟 ${PLAYERS[color].name} a mis un pion au centre ! Relancez les dés.`;
      else if (dice === 6)
        msg = `🎲 ${PLAYERS[color].name} a obtenu un 6 — Relancez les dés !`;

      if (extra) {
        return {
          ...s,
          tokens,
          dice: null,
          phase: "roll",
          movable: [],
          lastMovedId: moving.id,
          message: msg,
          soundTrigger: trigger,
          history: nextHistory,
        };
      }

      const nextTurnState = nextTurn(s);
      return {
        ...s,
        tokens,
        lastMovedId: moving.id,
        soundTrigger: trigger,
        history: nextHistory,
        ...nextTurnState,
      } as GameState;
    }

    default:
      return s;
  }
}

// Simple AI: pick the highest-scoring move.
export function aiPickMove(s: GameState): string | null {
  if (s.movable.length === 0) return null;
  const color = currentColor(s);
  const dice = s.dice!;
  let best: string | null = null;
  let bestScore = -Infinity;

  for (const id of s.movable) {
    const t = s.tokens.find((x) => x.id === id)!;
    let score = 0;
    if (t.state === "yard") {
      score = 70; // Prioritize getting a token out
    } else {
      const np = t.progress + dice;
      if (np === FINISH) score = 120; // Best: finish
      else if (np <= 50) {
        const gi = globalIndex(color, np);
        let cap = false;
        if (!SAFE.has(gi)) {
          cap = s.tokens.some(
            (o) =>
              o.color !== color &&
              o.state === "active" &&
              o.progress <= 50 &&
              globalIndex(o.color, o.progress) === gi
          );
        }
        score = cap ? 110 : np + (SAFE.has(gi) ? 15 : 0);
      } else {
        score = 80 + np; // Advancing securely in home column
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = id;
    }
  }
  return best;
}
