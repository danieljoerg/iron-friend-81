import { getExerciseProgress, EXERCISES } from "@/lib/workoutData";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function ProgressChart() {
  const [selectedExercise, setSelectedExercise] = useState<string>(EXERCISES[0]);
  const data = getExerciseProgress(selectedExercise);

  const trend = data.length >= 2
    ? data[data.length - 1].volume - data[data.length - 2].volume
    : 0;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-bold text-lg">Progress</h2>
        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {EXERCISES.map((ex) => (
            <option key={ex} value={ex}>
              {ex}
            </option>
          ))}
        </select>
      </div>

      {data.length > 0 ? (
        <>
          <div className="flex items-center gap-4 mb-4">
            <div>
              <p className="text-muted-foreground text-[10px] font-mono uppercase tracking-wider">
                Weekly Volume
              </p>
              <p className="font-mono text-2xl font-bold text-foreground">
                {data[data.length - 1].volume.toLocaleString()}
                <span className="text-sm text-muted-foreground ml-1">kg</span>
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] font-mono uppercase tracking-wider">
                Max Weight
              </p>
              <p className="font-mono text-2xl font-bold text-foreground">
                {data[data.length - 1].maxWeight}
                <span className="text-sm text-muted-foreground ml-1">kg</span>
              </p>
            </div>
            {data.length >= 2 && (
              <div className="ml-auto flex items-center gap-1">
                {trend > 0 ? (
                  <TrendingUp className="w-4 h-4 text-primary" />
                ) : trend < 0 ? (
                  <TrendingDown className="w-4 h-4 text-destructive" />
                ) : (
                  <Minus className="w-4 h-4 text-muted-foreground" />
                )}
                <span
                  className={`font-mono text-sm font-bold ${
                    trend > 0
                      ? "text-primary"
                      : trend < 0
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {trend > 0 ? "+" : ""}
                  {trend.toLocaleString()} kg
                </span>
              </div>
            )}
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "hsl(220, 10%, 50%)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => {
                    const d = new Date(v + "T00:00:00");
                    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  }}
                />
                <YAxis
                  tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "hsl(220, 10%, 50%)" }}
                  axisLine={false}
                  tickLine={false}
                  width={45}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(220, 18%, 12%)",
                    border: "1px solid hsl(220, 14%, 18%)",
                    borderRadius: "8px",
                    fontFamily: "JetBrains Mono",
                    fontSize: "12px",
                    color: "hsl(0, 0%, 95%)",
                  }}
                  labelFormatter={(v) => {
                    const d = new Date(v + "T00:00:00");
                    return "Week of " + d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="volume"
                  stroke="hsl(142, 72%, 50%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(142, 72%, 50%)", r: 3 }}
                  activeDot={{ r: 5, fill: "hsl(142, 72%, 50%)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div className="h-48 flex items-center justify-center">
          <p className="text-muted-foreground text-sm font-mono">
            No data yet — log some {selectedExercise.toLowerCase()} sets!
          </p>
        </div>
      )}
    </div>
  );
}
