import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Trophy, Dumbbell, ArrowUp, ArrowDown, Minus, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type MuscleDetail = {
  muscle: string;
  startVolume: number;
  endVolume: number;
  changePercent: number;
  startMaxWeight: number;
  endMaxWeight: number;
  weightChange: number;
  totalSets: number;
  topExercise: string;
};

type SharedResult = {
  id: string;
  display_name: string | null;
  duration_weeks: number;
  start_week: string;
  total_volume: number;
  total_sets: number;
  overall_max_weight: number;
  overall_change_percent: number;
  muscle_details: MuscleDetail[];
  created_at: string;
};

export default function SharedResultPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<SharedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return; }
    supabase
      .from("shared_mesocycle_results")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
        } else {
          setResult({
            ...data,
            muscle_details: (data.muscle_details as any[]) || [],
          } as SharedResult);
        }
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground font-mono text-sm">Dieses Ergebnis existiert nicht oder wurde gelöscht.</p>
          <button onClick={() => navigate("/auth")} className="text-primary font-mono text-sm underline">
            Zur App →
          </button>
        </div>
      </div>
    );
  }

  const r = result;
  const name = r.display_name || "Someone";
  const overallChange = r.overall_change_percent;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Trophy className="w-10 h-10 text-primary mx-auto" />
          <h1 className="text-2xl font-heading font-bold">
            {name} hat einen Mesozyklus abgeschlossen! 🏁
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            {r.duration_weeks} Wochen · ab {new Date(r.start_week + "T00:00:00").toLocaleDateString("de-CH", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>

        {/* Headline stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-secondary/50 p-3 text-center">
            <p className="text-muted-foreground text-[9px] font-mono uppercase tracking-wider">Gesamt Vol.</p>
            <p className="font-mono text-lg font-bold text-foreground">{(r.total_volume / 1000).toFixed(0)}t</p>
          </div>
          <div className="rounded-xl bg-secondary/50 p-3 text-center">
            <p className="text-muted-foreground text-[9px] font-mono uppercase tracking-wider">Total Sets</p>
            <p className="font-mono text-lg font-bold text-foreground">{r.total_sets}</p>
          </div>
          <div className="rounded-xl bg-secondary/50 p-3 text-center">
            <p className="text-muted-foreground text-[9px] font-mono uppercase tracking-wider">Max Gewicht</p>
            <p className="font-mono text-lg font-bold text-foreground">{r.overall_max_weight}kg</p>
          </div>
        </div>

        {/* Overall change */}
        <div className="flex items-center justify-center">
          <div className={`inline-flex items-center gap-2 rounded-full px-5 py-2 font-mono font-bold text-sm ${overallChange > 0 ? "bg-primary/15 text-primary" : overallChange < 0 ? "bg-destructive/15 text-destructive" : "bg-secondary text-muted-foreground"}`}>
            {overallChange > 0 ? <ArrowUp className="w-4 h-4" /> : overallChange < 0 ? <ArrowDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
            Volumen {overallChange > 0 ? "+" : ""}{overallChange}% gestiegen
          </div>
        </div>

        {/* Muscle details */}
        {r.muscle_details.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Fortschritt pro Muskelgruppe
            </h3>
            {r.muscle_details.map((md) => (
              <div key={md.muscle} className="rounded-xl border border-border bg-card p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm font-bold">{md.muscle}</span>
                  </div>
                  <span className={`font-mono text-sm font-bold ${md.changePercent > 0 ? "text-primary" : md.changePercent < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {md.changePercent > 0 ? "+" : ""}{md.changePercent}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[9px] font-mono text-muted-foreground uppercase">Volumen</p>
                    <p className="text-xs font-mono">
                      <span className="text-muted-foreground">{md.startVolume.toLocaleString()}</span>
                      <span className="text-muted-foreground mx-0.5">→</span>
                      <span className="font-bold text-foreground">{md.endVolume.toLocaleString()}</span>
                      <span className="text-muted-foreground text-[9px]"> kg</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono text-muted-foreground uppercase">Max Gew.</p>
                    <p className="text-xs font-mono">
                      <span className="text-muted-foreground">{md.startMaxWeight}</span>
                      <span className="text-muted-foreground mx-0.5">→</span>
                      <span className="font-bold text-foreground">{md.endMaxWeight}</span>
                      <span className="text-muted-foreground text-[9px]"> kg</span>
                      {md.weightChange !== 0 && (
                        <span className={`ml-1 text-[9px] font-bold ${md.weightChange > 0 ? "text-primary" : "text-destructive"}`}>
                          {md.weightChange > 0 ? "+" : ""}{md.weightChange}
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono text-muted-foreground uppercase">Sets</p>
                    <p className="text-xs font-mono font-bold text-foreground">{md.totalSets}</p>
                  </div>
                </div>
                {md.topExercise && (
                  <p className="text-[10px] font-mono text-muted-foreground">
                    Top: {md.topExercise}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Branding */}
        <p className="text-center text-[10px] font-mono text-muted-foreground/50">
          Lift Log · Progressive Overload Tracker
        </p>

        {/* CTA */}
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center space-y-4">
          <h3 className="text-lg font-heading font-bold">
            Want to track your own progressive overload and get real results?
          </h3>
          <p className="text-sm text-muted-foreground">
            Automatische Progression, Mesozyklus-Planung, detaillierte Statistiken — alles in einer App.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="inline-flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-mono font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg"
          >
            Jetzt kostenlos starten
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
