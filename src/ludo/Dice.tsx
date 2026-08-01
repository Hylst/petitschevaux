interface DiceProps {
  value: number | null;
  rolling: boolean;
  color: string;
}

const PIP_LAYOUT: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

export default function Dice({ value, rolling, color }: DiceProps) {
  const v = value ?? 0;
  const pips = PIP_LAYOUT[v] ?? [];
  return (
    <div
      className={`grid grid-cols-3 grid-rows-3 gap-1 rounded-2xl bg-white p-2.5 shadow-lg ring-2 transition-transform ${
        rolling ? "animate-spin" : ""
      }`}
      style={{
        width: 64,
        height: 64,
        // @ts-ignore
        "--tw-ring-color": color,
      }}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="flex items-center justify-center">
          {pips.includes(i) && (
            <span
              className="block rounded-full"
              style={{ width: 9, height: 9, background: color }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
