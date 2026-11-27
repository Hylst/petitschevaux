import { useEffect, useReducer, useRef, useState } from "react";
import { Color, COLORS, PLAYERS } from "./ludo/constants";
import {
  reducer,
  initState,
  currentColor,
  aiPickMove,
  PlayerType,
  LogEntry,
} from "./ludo/game";
import Board from "./ludo/Board";
import Dice from "./ludo/Dice";
import { sound } from "./ludo/sound";
import confetti from "canvas-confetti";
import {
  Volume2,
  VolumeX,
  Music,
  RotateCcw,
  Sparkles,
  Award,
  History as HistoryIcon,
  HelpCircle,
  Zap,
  Users,
  Bot,
  UserCheck,
  Info,
} from "lucide-react";

const DEFAULT_TYPES: Record<Color, PlayerType> = {
  red: "human",
  green: "ai",
  yellow: "ai",
  blue: "ai",
};

type GameSpeed = "normal" | "rapide" | "eclair";

const SPEED_DELAYS: Record<GameSpeed, { roll: number; move: number }> = {
  normal: { roll: 600, move: 750 },
  rapide: { roll: 350, move: 450 },
  eclair: { roll: 150, move: 200 },
};

export default function App() {
  const [state, dispatch] = useReducer(reducer, DEFAULT_TYPES, initState);
  const [rolling, setRolling] = useState(false);
  const [speed, setSpeed] = useState<GameSpeed>("rapide");
  const [musicOn, setMusicOn] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [sfxOn, setSfxOn] = useState(true);
  const [activeTab, setActiveTab] = useState<"controls" | "history" | "rules">("controls");
  const timers = useRef<number[]>([]);

  const color = currentColor(state);
  const isAITurn = state.types[color] === "ai" && state.phase !== "gameover";
  const isHumanTurn = state.types[color] === "human" && state.phase !== "gameover";

  function clearTimers() {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  }

  // Play appropriate sound fx when state.soundTrigger changes
  useEffect(() => {
    if (!sfxOn || !state.soundTrigger) return;
    try {
      switch (state.soundTrigger) {
        case "click":
          sound.playClick();
          break;
        case "roll":
          sound.playDiceRoll();
          break;
        case "move":
          sound.playMoveStep();
          break;
        case "capture":
          sound.playCapture();
          break;
        case "spawn":
          sound.playSpawn();
          break;
        case "home":
          sound.playHomeEnter();
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
          });
          break;
        case "victory":
          sound.playVictory();
          confetti({
            particleCount: 200,
            spread: 100,
            origin: { y: 0.5 },
          });
          break;
      }
    } catch (e) {
      console.error("Erreur SFX", e);
    }
    dispatch({ type: "CLEAR_SOUND" });
  }, [state.soundTrigger, sfxOn]);

  function doRoll() {
    if (state.phase !== "roll" || rolling) return;
    if (sfxOn) sound.playClick();
    setRolling(true);
    const delay = SPEED_DELAYS[speed].roll;
    const t = window.setTimeout(() => {
      setRolling(false);
      dispatch({ type: "ROLL" });
    }, delay);
    timers.current.push(t);
  }

  // Drive AI turns.
  useEffect(() => {
    if (state.phase === "gameover") return;
    if (state.types[color] !== "ai") return;

    const delay = SPEED_DELAYS[speed];

    if (state.phase === "roll" && !rolling) {
      const t = window.setTimeout(() => doRoll(), delay.roll);
      timers.current.push(t);
    } else if (state.phase === "move") {
      const id = aiPickMove(state);
      if (id) {
        const t = window.setTimeout(() => dispatch({ type: "MOVE", id }), delay.move);
        timers.current.push(t);
      }
    }
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.turnIdx, state.phase, state.dice, rolling, speed]);

  useEffect(() => () => clearTimers(), []);

  function handleReset(types: Record<Color, PlayerType>) {
    clearTimers();
    setRolling(false);
    if (sfxOn) sound.playClick();
    dispatch({ type: "RESET", types });
  }

  function toggleMusicSetting() {
    const nextState = sound.toggleMusic();
    setMusicOn(nextState);
    if (sfxOn) sound.playClick();
  }

  function toggleSfxSetting() {
    const nextState = sound.toggleSfx();
    setSfxOn(nextState);
    if (nextState) sound.playClick();
  }

  const homeCounts: Record<Color, number> = { red: 0, green: 0, yellow: 0, blue: 0 };
  for (const t of state.tokens) if (t.state === "done") homeCounts[t.color]++;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-indigo-950 to-slate-950 text-slate-100 pb-12">
      {/* Premium Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-40 shadow-xl">
        <div className="mx-auto max-w-7xl px-4 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white animate-spin" style={{ animationDuration: "6s" }} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-rose-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent">
                Petits Chevaux
              </h1>
              <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                <span>Créé par Geoffroy Streit (Hylst) avec l'aide d'une IA</span>
              </p>
            </div>
          </div>

          {/* Audio & Speed Top Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Speed Selector */}
            <div className="flex items-center rounded-xl border border-white/10 bg-black/30 p-1 backdrop-blur-md">
              <Zap className="w-3.5 h-3.5 text-amber-400 ml-2 mr-1" />
              <span className="text-[11px] font-semibold text-slate-400 mr-2.5 hidden sm:inline">Vitesse:</span>
              {(["normal", "rapide", "eclair"] as GameSpeed[]).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSpeed(s);
                    if (sfxOn) sound.playClick();
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold capitalize transition ${
                    speed === s
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* SFX Toggle */}
            <button
              onClick={toggleSfxSetting}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition shadow-lg ${
                sfxOn
                  ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                  : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
              title="Activer/Désactiver les effets sonores"
            >
              {sfxOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden md:inline">SFX</span>
            </button>

            {/* Music Toggle */}
            <button
              onClick={toggleMusicSetting}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition shadow-lg ${
                musicOn
                  ? "border-indigo-500/40 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30"
                  : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
              title="Activer/Désactiver la musique d'ambiance lounge"
            >
              <Music className={`w-4 h-4 ${musicOn ? "text-indigo-400 animate-bounce" : ""}`} />
              <span className="hidden md:inline">Musique</span>
            </button>

            {/* Info Toggle */}
            <button
              onClick={() => setShowInfo(true)}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-400 transition shadow-lg hover:bg-white/10"
              title="Comment ce jeu a été fait"
            >
              <Info className="w-4 h-4" />
              <span className="hidden md:inline">Infos</span>
            </button>
          </div>
        </div>
      </header>

      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4" onClick={() => setShowInfo(false)}>
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl border border-white/10 bg-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-3.5 text-sm leading-relaxed text-slate-300">
              <h3 className="text-xl font-black bg-gradient-to-r from-rose-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent">Comment ce jeu a été fait</h3>
              <p><strong className="text-white">Stack :</strong> React 19, TypeScript 5.9, Tailwind CSS 4, Vite 7, compilé en un seul fichier HTML, aucune dépendance chargée depuis l'extérieur (hors icônes vectorielles et confettis, tous deux inclus dans le bundle).</p>
              <p><strong className="text-white">Graphismes :</strong> plateau et pions en DOM/CSS, animations de déplacement et de capture, confettis à la victoire.</p>
              <p><strong className="text-white">Musique &amp; sons :</strong> synthétisés en direct avec l'API Web Audio, aucun fichier audio chargé.</p>
              <p><strong className="text-white">Interactions :</strong> clic sur le dé pour lancer, clic sur un pion jouable pour le déplacer, aperçu de la case d'arrivée au survol.</p>
              <p><strong className="text-white">Architecture :</strong> logique de jeu pilotée par un reducer (<code>game.ts</code>) séparé du rendu, historique des coups conservé pour l'onglet dédié.</p>
              <p><strong className="text-white">Algorithmes notables :</strong> un 6 obtenu, une capture ou un pion arrivé donnent un tour supplémentaire ; trois 6 consécutifs annulent le tour en cours (règle traditionnelle). Les cases protégées (étoilées) empêchent la capture des pions qui s'y trouvent.</p>
            </div>
            <div className="border-t border-white/10 p-4 text-center">
              <button onClick={() => setShowInfo(false)} className="px-6 py-2.5 rounded-xl font-black text-white bg-gradient-to-r from-rose-500 to-emerald-500 hover:brightness-110 active:scale-95 transition-all">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_1fr]">
          {/* Ludo Board */}
          <div className="mx-auto w-full max-w-[620px] flex flex-col items-center">
            <Board
              tokens={state.tokens}
              movable={state.movable}
              currentColor={color}
              dice={state.dice}
              onTokenClick={(id) => dispatch({ type: "MOVE", id })}
              interactive={isHumanTurn && state.phase === "move"}
              lastMovedId={state.lastMovedId}
            />

            {/* Sub board notification tip */}
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300 backdrop-blur">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Survolez un pion jouable pour prévisualiser sa case d'arrivée. Obtenez un 6 pour sortir !</span>
            </div>
          </div>

          {/* Interactive UI Aside */}
          <aside className="flex flex-col gap-6">
            {/* Tabs for Sidebar */}
            <div className="flex rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur-lg">
              <button
                onClick={() => { setActiveTab("controls"); if (sfxOn) sound.playClick(); }}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
                  activeTab === "controls"
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Panneau de Jeu</span>
              </button>

              <button
                onClick={() => { setActiveTab("history"); if (sfxOn) sound.playClick(); }}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
                  activeTab === "history"
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <HistoryIcon className="w-4 h-4" />
                <span>Historique</span>
              </button>

              <button
                onClick={() => { setActiveTab("rules"); if (sfxOn) sound.playClick(); }}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
                  activeTab === "rules"
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>Règles</span>
              </button>
            </div>

            {/* TAB 1: Main Controls & Scoreboard */}
            {activeTab === "controls" && (
              <div className="space-y-6 animate-fadeIn">
                {/* Active Turn Banner & Dice Card */}
                <div
                  className="rounded-3xl border bg-gradient-to-br from-slate-900/90 to-indigo-950/90 p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl transition-all"
                  style={{ borderColor: `${PLAYERS[color].hex}66`, boxShadow: `0 10px 40px -10px ${PLAYERS[color].hex}44` }}
                >
                  {/* Subtle background glow */}
                  <div
                    className="absolute -right-12 -top-12 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
                    style={{ background: PLAYERS[color].hex }}
                  />

                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-block h-6 w-6 rounded-full ring-4 ring-white/30 shadow-md shrink-0"
                        style={{ background: PLAYERS[color].hex }}
                      />
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          {state.phase === "gameover" ? "Fin de la partie" : "Joueur Actif"}
                        </span>
                        <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                          {PLAYERS[color].name}
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10 font-medium text-slate-300">
                            {state.types[color] === "ai" ? "🤖 Ordinateur" : "👤 Vous"}
                          </span>
                        </h2>
                      </div>
                    </div>
                  </div>

                  {/* Big Dice Roller */}
                  <div className="flex items-center gap-6 rounded-2xl border border-white/10 bg-black/40 p-5 shadow-inner">
                    <div className="shrink-0" onClick={() => isHumanTurn && doRoll()}>
                      <Dice value={state.dice} rolling={rolling} color={PLAYERS[color].hex} />
                    </div>

                    <div className="flex-1">
                      {state.phase === "gameover" ? (
                        <button
                          onClick={() => handleReset(state.types)}
                          className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4 font-extrabold text-white shadow-xl transition hover:scale-[1.02] active:scale-95"
                        >
                          <Award className="w-5 h-5 inline mr-2" /> Rejouer une Partie
                        </button>
                      ) : (
                        <button
                          onClick={doRoll}
                          disabled={!isHumanTurn || state.phase !== "roll" || rolling}
                          className="w-full rounded-2xl px-5 py-4 font-black text-white shadow-lg transition-all enabled:hover:scale-[1.02] enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 text-sm tracking-wide"
                          style={{ background: PLAYERS[color].hex, textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
                        >
                          {isAITurn
                            ? "🤖 Analyse de l'IA..."
                            : state.phase === "move"
                            ? "👉 Choisissez un pion"
                            : "🎲 Lancer les Dés"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Live Turn Guide message */}
                  <div className="mt-4 rounded-xl bg-white/5 p-3 border border-white/5 text-sm font-medium text-amber-200/90 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{state.message}</span>
                  </div>
                </div>

                {/* Scoreboard / Player Managers */}
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-xl">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Joueurs & Progression des pions
                    </h3>
                    <span className="text-xs font-semibold text-slate-500">Mode</span>
                  </div>

                  <div className="space-y-3">
                    {COLORS.map((c) => (
                      <div
                        key={c}
                        className={`flex items-center gap-3.5 rounded-2xl border p-3.5 transition-all ${
                          c === color
                            ? "border-white/30 bg-white/10 shadow-md ring-2 ring-white/20"
                            : "border-white/5 bg-white/5 hover:border-white/10"
                        }`}
                      >
                        <span
                          className="h-5 w-5 rounded-full ring-2 ring-white/40 shadow shrink-0"
                          style={{ background: PLAYERS[c].hex }}
                        />

                        <div className="flex-1 min-w-0">
                          <p className={`text-sm tracking-tight truncate ${c === color ? "font-black text-white" : "font-semibold text-slate-300"}`}>
                            {PLAYERS[c].name}
                          </p>
                          <div className="flex gap-1.5 mt-1">
                            {Array.from({ length: 4 }).map((_, i) => (
                              <span
                                key={i}
                                className="h-2.5 w-2.5 rounded-full transition-all"
                                style={{
                                  background: i < homeCounts[c] ? PLAYERS[c].hex : "rgba(255,255,255,0.12)",
                                  boxShadow: i < homeCounts[c] ? `0 0 8px ${PLAYERS[c].hex}` : "none",
                                }}
                                title={i < homeCounts[c] ? "Au centre" : "En jeu ou en base"}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Player Type Toggle */}
                        <button
                          onClick={() => {
                            dispatch({
                              type: "SET_TYPE",
                              color: c,
                              value: state.types[c] === "ai" ? "human" : "ai",
                            });
                          }}
                          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition shadow-sm ${
                            state.types[c] === "human"
                              ? "border-rose-500/40 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30"
                              : "border-indigo-500/40 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30"
                          }`}
                        >
                          {state.types[c] === "human" ? <UserCheck className="w-3.5 h-3.5 text-rose-400" /> : <Bot className="w-3.5 h-3.5 text-indigo-400" />}
                          <span>{state.types[c] === "human" ? "Vous" : "CPU"}</span>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Reinit button */}
                  <button
                    onClick={() => handleReset(state.types)}
                    className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition"
                  >
                    <RotateCcw className="w-4 h-4" /> Recommencer la Partie
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Live Action History */}
            {activeTab === "history" && (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-xl space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h3 className="font-bold text-slate-200 flex items-center gap-2">
                    <HistoryIcon className="w-4 h-4 text-indigo-400" /> Historique des Événements
                  </h3>
                  <span className="text-xs font-medium bg-white/10 px-2.5 py-1 rounded-full text-slate-400">
                    {state.history.length} Action{state.history.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="max-h-[480px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                  {state.history.map((log: LogEntry) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 rounded-2xl border border-white/5 bg-black/20 p-3.5 hover:border-white/10 transition"
                    >
                      <span
                        className="w-3 h-3 rounded-full mt-1 shrink-0"
                        style={{ background: PLAYERS[log.color].hex, boxShadow: `0 0 8px ${PLAYERS[log.color].hex}` }}
                      />
                      <div className="flex-1 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-bold" style={{ color: PLAYERS[log.color].light }}>
                            {PLAYERS[log.color].name}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {log.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-slate-300 mt-0.5">{log.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: French Rules Guide */}
            {activeTab === "rules" && (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-xl space-y-5 text-sm leading-relaxed text-slate-300 animate-fadeIn">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                  <HelpCircle className="w-5 h-5 text-emerald-400" /> Guide des Petits Chevaux
                </h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                      <span>🎲 Sortir de la Base</span>
                    </h4>
                    <p className="text-slate-400">
                      Vous devez obtenir un <strong>6</strong> pour faire sortir un pion de sa cour (base) et le placer sur la case de départ. En plus, un 6 vous offre une relance gratuite !
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                      <span>★ Les Zones Sécurisées</span>
                    </h4>
                    <p className="text-slate-400">
                      Les cases marquées par une étoile <strong>★</strong> sont des sanctuaires. Aucun pion ne peut y être capturé par un adversaire.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-rose-400 mb-1 flex items-center gap-1.5">
                      <span>⚔️ Capturer un Adversaire</span>
                    </h4>
                    <p className="text-slate-400">
                      Si vous atterrissez sur une case (non protégée) occupée par un pion adverse, vous le renvoyez dans sa base ! Cette capture spectaculaire vous accorde en prime <strong>un tour supplémentaire</strong>.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-indigo-400 mb-1 flex items-center gap-1.5">
                      <span>🌟 La Colonne de Victoire</span>
                    </h4>
                    <p className="text-slate-400">
                      Faites faire un tour complet du plateau à vos pions pour entrer dans votre colonne finale colorée. Le premier à amener ses <strong>4 pions au centre</strong> remporte la partie !
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/10 text-xs text-slate-500 text-center">
                    Créé par Geoffroy Streit (Hylst) avec l'aide d'une IA.
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
