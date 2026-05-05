import { EXERCISES, MUSCLE_GROUPS, type MuscleGroup } from "@/lib/workoutData";
import { getExerciseProgressDb, getMuscleGroupProgressDb, getOverallProgressDb, getMesocycleComparisonDb, getPersonalRecordsDb, type MesocycleComparison, type PersonalRecord } from "@/lib/workoutDb";
import { useState, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, TrendingDown, Minus, Trophy, Activity, Award } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface ProgressChartProps {
  userId?: string;
}

type ChartData = { week: string; volume: number; maxWeight: number }[];

function ProgressContent({ data }: { data: ChartData }) {
  const trend = data.length >= 2
    ? data[data.length - 1].volume - data[data.length - 2].volume
    : 0;

  if (data.length === 0) return null;

  return (
    <>
      <div className="flex items-center gap-4 mb-4">
        <div>
          <p className="text-muted-foreground text-[10px] font-mono uppercase tracking-wider">Weekly Volume</p>
          <p className="font-mono text-2xl font-bold text-foreground">
            {data[data.length - 1].volume.toLocaleString()}
            <span className="text-sm text-muted-foreground ml-1">kg</span>
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-[10px] font-mono uppercase tracking-wider">Max Weight</p>
          <p className="font-mono text-2xl font-bold text-foreground">
            {data[data.length - 1].maxWeight}
            <span className="text-sm text-muted-foreground ml-1">kg</span>
          </p>
        </div>
        {data.length >= 2 && (
          <div className="ml-auto flex items-center gap-1">
            {trend > 0 ? <TrendingUp className="w-4 h-4 text-primary" /> : trend < 0 ? <TrendingDown className="w-4 h-4 text-destructive" /> : <Minus className="w-4 h-4 text-muted-foreground" />}
            <span className={`font-mono text-sm font-bold ${trend > 0 ? "text-primary" : trend < 0 ? "text-destructive" : "text-muted-foreground"}`}>
              {trend > 0 ? "+" : ""}{trend.toLocaleString()} kg
            </span>
          </div>
        )}
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="week" tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "hsl(220, 10%, 50%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => { const d = new Date(v + "T00:00:00"); return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }); }} />
            <YAxis tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "hsl(220, 10%, 50%)" }} axisLine={false} tickLine={false} width={45} />
            <Tooltip contentStyle={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 14%, 18%)", borderRadius: "8px", fontFamily: "JetBrains Mono", fontSize: "12px", color: "hsl(0, 0%, 95%)" }} labelFormatter={(v) => { const d = new Date(v + "T00:00:00"); return "Week of " + d.toLocaleDateString("en-US", { month: "short", day: "numeric" }); }} />
            <Line type="monotone" dataKey="volume" stroke="hsl(142, 72%, 50%)" strokeWidth={2} dot={{ fill: "hsl(142, 72%, 50%)", r: 3 }} activeDot={{ r: 5, fill: "hsl(142, 72%, 50%)" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

function MesocycleComparisonContent({ data }: { data: MesocycleComparison[] }) {
  if (data.length === 0) return null;

  const latest = data[data.length - 1];
  const previous = data.length >= 2 ? data[data.length - 2] : null;
  const volumeTrend = previous ? latest.peakWeekVolume - previous.peakWeekVolume : 0;
  const weightTrend = previous ? latest.maxWeight - previous.maxWeight : 0;

  const barColors = data.map((_, i) => {
    const opacity = 0.4 + (0.6 * (i / Math.max(data.length - 1, 1)));
    return `hsl(142, 72%, ${30 + opacity * 25}%)`;
  });

  return (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg bg-secondary/50 p-3">
          <p className="text-muted-foreground text-[10px] font-mono uppercase tracking-wider">Peak Wochenvolumen</p>
          <p className="font-mono text-xl font-bold text-foreground">
            {latest.peakWeekVolume.toLocaleString()}
            <span className="text-xs text-muted-foreground ml-1">kg</span>
          </p>
          {previous && (
            <div className="flex items-center gap-1 mt-1">
              {volumeTrend > 0 ? <TrendingUp className="w-3 h-3 text-primary" /> : volumeTrend < 0 ? <TrendingDown className="w-3 h-3 text-destructive" /> : <Minus className="w-3 h-3 text-muted-foreground" />}
              <span className={`font-mono text-xs font-bold ${volumeTrend > 0 ? "text-primary" : volumeTrend < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {volumeTrend > 0 ? "+" : ""}{volumeTrend.toLocaleString()} kg
              </span>
            </div>
          )}
        </div>
        <div className="rounded-lg bg-secondary/50 p-3">
          <p className="text-muted-foreground text-[10px] font-mono uppercase tracking-wider">Max Gewicht</p>
          <p className="font-mono text-xl font-bold text-foreground">
            {latest.maxWeight}
            <span className="text-xs text-muted-foreground ml-1">kg</span>
          </p>
          {previous && (
            <div className="flex items-center gap-1 mt-1">
              {weightTrend > 0 ? <TrendingUp className="w-3 h-3 text-primary" /> : weightTrend < 0 ? <TrendingDown className="w-3 h-3 text-destructive" /> : <Minus className="w-3 h-3 text-muted-foreground" />}
              <span className={`font-mono text-xs font-bold ${weightTrend > 0 ? "text-primary" : weightTrend < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {weightTrend > 0 ? "+" : ""}{weightTrend} kg
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bar chart: Peak week volume per mesocycle */}
      <p className="text-muted-foreground text-[10px] font-mono uppercase tracking-wider mb-2">Peak Wochenvolumen pro Mesozyklus</p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "hsl(220, 10%, 50%)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "hsl(220, 10%, 50%)" }} axisLine={false} tickLine={false} width={50} />
            <Tooltip
              contentStyle={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 14%, 18%)", borderRadius: "8px", fontFamily: "JetBrains Mono", fontSize: "12px", color: "hsl(0, 0%, 95%)" }}
              formatter={(value: number) => [`${value.toLocaleString()} kg`, "Peak Volume"]}
            />
            <Bar dataKey="peakWeekVolume" radius={[6, 6, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={barColors[i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detail table */}
      <div className="mt-4 space-y-2">
        {data.map((m, i) => {
          const prev = i > 0 ? data[i - 1] : null;
          const diff = prev ? m.peakWeekVolume - prev.peakWeekVolume : 0;
          const pct = prev && prev.peakWeekVolume > 0 ? ((diff / prev.peakWeekVolume) * 100).toFixed(1) : null;
          return (
            <div key={m.mesoIndex} className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2">
              <div className="flex items-center gap-2">
                {i === data.length - 1 && <Trophy className="w-3.5 h-3.5 text-primary" />}
                <span className="font-mono text-xs font-medium text-foreground">{m.label}</span>
                <span className="text-muted-foreground text-[10px] font-mono">
                  {new Date(m.startWeek + "T00:00:00").toLocaleDateString("de-CH", { month: "short", year: "2-digit" })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-foreground">{m.peakWeekVolume.toLocaleString()} kg</span>
                {pct !== null && (
                  <span className={`font-mono text-[10px] font-bold ${diff > 0 ? "text-primary" : diff < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {diff > 0 ? "+" : ""}{pct}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="h-48 flex items-center justify-center">
      <p className="text-muted-foreground text-sm font-mono">
        No data yet — log some {label} sets!
      </p>
    </div>
  );
}

export default function ProgressChart({ userId }: ProgressChartProps) {
  const [tab, setTab] = useState("exercise");
  const [selectedExercise, setSelectedExercise] = useState<string>(EXERCISES[0]);
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup>(MUSCLE_GROUPS[0]);
  const [data, setData] = useState<ChartData>([]);
  const [mesoData, setMesoData] = useState<MesocycleComparison[]>([]);
  const [prData, setPrData] = useState<PersonalRecord[]>([]);

  useEffect(() => {
    if (!userId) return;
    if (tab === "exercise") {
      getExerciseProgressDb(selectedExercise, userId).then(setData);
    } else if (tab === "muscle") {
      getMuscleGroupProgressDb(selectedMuscle, userId).then(setData);
    } else if (tab === "overall") {
      getOverallProgressDb(userId).then(setData);
    } else if (tab === "meso") {
      getMesocycleComparisonDb(userId).then(setMesoData);
    } else if (tab === "pr") {
      getPersonalRecordsDb(userId).then(setPrData);
    }
  }, [tab, selectedExercise, selectedMuscle, userId]);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-bold text-lg">Progress</h2>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="exercise" className="flex-1 text-xs font-mono">Exercise</TabsTrigger>
          <TabsTrigger value="muscle" className="flex-1 text-xs font-mono">Muscle</TabsTrigger>
          <TabsTrigger value="overall" className="flex-1 text-xs font-mono">Overall</TabsTrigger>
          <TabsTrigger value="meso" className="flex-1 text-xs font-mono">Meso</TabsTrigger>
        </TabsList>

        <TabsContent value="exercise">
          <select
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary mb-4 w-full"
          >
            {EXERCISES.map((ex) => (
              <option key={ex} value={ex}>{ex}</option>
            ))}
          </select>
          {data.length > 0 ? <ProgressContent data={data} /> : <EmptyState label={selectedExercise.toLowerCase()} />}
        </TabsContent>

        <TabsContent value="muscle">
          <select
            value={selectedMuscle}
            onChange={(e) => setSelectedMuscle(e.target.value as MuscleGroup)}
            className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary mb-4 w-full"
          >
            {MUSCLE_GROUPS.map((mg) => (
              <option key={mg} value={mg}>{mg}</option>
            ))}
          </select>
          {data.length > 0 ? <ProgressContent data={data} /> : <EmptyState label={selectedMuscle.toLowerCase()} />}
        </TabsContent>

        <TabsContent value="overall">
          {data.length > 0 ? <ProgressContent data={data} /> : <EmptyState label="workout" />}
        </TabsContent>

        <TabsContent value="meso">
          {mesoData.length > 0 ? (
            <MesocycleComparisonContent data={mesoData} />
          ) : (
            <div className="h-48 flex flex-col items-center justify-center gap-2">
              <Activity className="w-6 h-6 text-muted-foreground" />
              <p className="text-muted-foreground text-sm font-mono text-center">
                Noch keine Mesozyklus-Daten — schliesse mindestens einen Mesozyklus ab!
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
