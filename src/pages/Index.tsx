import { useState, useCallback, useEffect, useRef } from "react";
import { Dumbbell, LogOut, User, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { getWeekStart as getWeekStartForDate } from "@/lib/workoutData";
import WeekSelector from "@/components/WeekSelector";
import DayCard from "@/components/DayCard";
import ProgressChart from "@/components/ProgressChart";
import { getWeekStart, formatDateString, FULL_DAYS, type WeekLog } from "@/lib/workoutData";
import { getOrCreateWeekDb, saveWeekDb, getRepRangesDb, setRepRangeDb, setYoutubeUrlDb, getPreviousWeekData, getActiveMesocycle, createMesocycle, deleteMesocycle, getMesocycleWeekInfo, computeDeloadTargets, type RepRange, type ExerciseTarget, type Mesocycle } from "@/lib/workoutDb";
import MesocycleBanner from "@/components/MesocycleBanner";
import type { ExerciseLog } from "@/lib/workoutData";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [weekStart, setWeekStart] = useState(() => getWeekStart());
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [week, setWeek] = useState<WeekLog>({
    weekStart: getWeekStart(),
    days: FULL_DAYS.map((day) => ({ day, exercises: [] })),
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [repRanges, setRepRanges] = useState<Record<string, RepRange>>({});
  const [prevWeekData, setPrevWeekData] = useState<Record<string, ExerciseLog[]>>({});
  const [defaultTrainingDays, setDefaultTrainingDays] = useState<string[]>(["Monday", "Tuesday", "Thursday", "Friday"]);
  const [weekTrainingDays, setWeekTrainingDays] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [mesocycle, setMesocycle] = useState<Mesocycle | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, training_days").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name);
        if (Array.isArray(data?.training_days)) setDefaultTrainingDays(data.training_days as string[]);
      });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      getOrCreateWeekDb(weekStart, user.id),
      getRepRangesDb(user.id),
      getPreviousWeekData(weekStart, user.id),
      getActiveMesocycle(user.id),
    ]).then(([w, rr, prev, meso]) => {
      setWeek(w);
      setRepRanges(rr);
      setPrevWeekData(prev);
      setMesocycle(meso);
      setWeekTrainingDays(w.trainingDays ?? null);
      setLoading(false);
    });
  }, [weekStart, user]);

  const handleRepRangeChange = (exercise: string, min: number, max: number) => {
    setRepRanges((prev) => ({ ...prev, [exercise]: { exercise, min_reps: min, max_reps: max } }));
    if (user) setRepRangeDb(user.id, exercise, min, max);
  };

  const handleYoutubeUrlChange = (exercise: string, url: string | null) => {
    setRepRanges((prev) => ({
      ...prev,
      [exercise]: { ...prev[exercise], exercise, min_reps: prev[exercise]?.min_reps ?? 8, max_reps: prev[exercise]?.max_reps ?? 12, youtube_url: url || undefined },
    }));
    if (user) setYoutubeUrlDb(user.id, exercise, url);
  };

  const navigateWeek = (direction: number) => {
    const d = new Date(weekStart + "T00:00:00");
    d.setDate(d.getDate() + direction * 7);
    setWeekStart(formatDateString(d));
  };

  const goToToday = () => setWeekStart(getWeekStart());

  const handleCreateMesocycle = async (durationWeeks: number) => {
    if (!user) return;
    const meso = await createMesocycle(user.id, weekStart, durationWeeks);
    setMesocycle(meso);
  };

  const handleDeleteMesocycle = async () => {
    if (!mesocycle) return;
    await deleteMesocycle(mesocycle.id);
    setMesocycle(null);
  };

  const mesoWeekInfo = mesocycle ? getMesocycleWeekInfo(mesocycle, weekStart) : null;

  const handleDayChange = useCallback(
    (dayIndex: number, updatedDay: typeof week.days[0]) => {
      const updatedWeek = {
        ...week,
        days: week.days.map((d, i) => (i === dayIndex ? updatedDay : d)),
      };
      setWeek(updatedWeek);
      setRefreshKey((k) => k + 1);
      if (user) {
        saveWeekDb(updatedWeek, user.id);
      }
      // If day was marked done, collapse it and expand next day
      if (updatedDay.done) {
        const nextDay = dayIndex < 6 ? dayIndex + 1 : null;
        setExpandedDay(nextDay);
      }
    },
    [week, user]
  );

  const today = new Date();
  const todayIdx = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const todayName = FULL_DAYS[todayIdx];
  const isCurrentWeek = weekStart === getWeekStart();

  // Set initial expanded day: skip done days, default to today or first non-done
  // Runs after week data is loaded (loading transitions to false)
  useEffect(() => {
    if (loading) return; // Wait until data is loaded
    if (isCurrentWeek) {
      if (week.days[todayIdx]?.done) {
        const nextNonDone = week.days.findIndex((d, i) => i > todayIdx && !d.done);
        setExpandedDay(nextNonDone >= 0 ? nextNonDone : null);
      } else {
        setExpandedDay(todayIdx);
      }
    } else {
      const firstNonDone = week.days.findIndex((d) => !d.done);
      setExpandedDay(firstNonDone >= 0 ? firstNonDone : null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart, loading]);

  // Persist scroll position across tab hide/show (e.g. closing browser between sets)
  useEffect(() => {
    const SCROLL_KEY = "lift-log-scroll-pos";

    // Restore saved scroll position after content is loaded
    if (!loading) {
      const saved = sessionStorage.getItem(SCROLL_KEY);
      if (saved) {
        const pos = parseInt(saved, 10);
        // Small delay to let DOM render
        requestAnimationFrame(() => {
          window.scrollTo(0, pos);
        });
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
      }
    };

    const handleBeforeUnload = () => {
      sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [loading]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Top bar: greeting + settings */}
        <div className="flex items-center justify-center gap-2 mb-1 relative">
          <h1 className="font-heading font-bold text-lg text-center">
            {displayName ? `Hey, ${displayName} 👋` : "Lift Log"}
          </h1>
          <button
            onClick={() => navigate("/profile")}
            className="absolute right-0 p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            title="Profil & Einstellungen"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
        <p className="text-muted-foreground text-xs font-mono mb-5 text-center">Progressive overload tracker</p>

        {/* Week navigation */}
        <div className="flex items-center justify-center mb-5">
          <WeekSelector
            weekStart={weekStart}
            onPrev={() => navigateWeek(-1)}
            onNext={() => navigateWeek(1)}
            onToday={goToToday}
            onDateSelect={(date) => setWeekStart(getWeekStartForDate(date))}
            mesocycle={mesocycle}
            onCreateMesocycle={handleCreateMesocycle}
            onDeleteMesocycle={handleDeleteMesocycle}
          />
        </div>

        <Tabs defaultValue="tracking" className="mt-0">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="tracking" className="flex-1 text-xs font-mono">Tracking</TabsTrigger>
            <TabsTrigger value="progress" className="flex-1 text-xs font-mono">Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="tracking">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {week.days.map((dayLog, idx) => (
                  <DayCard
                    key={dayLog.day}
                    dayLog={dayLog}
                    isToday={isCurrentWeek && dayLog.day === todayName}
                    isRestDay={!trainingDays.includes(dayLog.day)}
                    weekStart={weekStart}
                    onChange={(updated) => handleDayChange(idx, updated)}
                    repRanges={repRanges}
                    onRepRangeChange={handleRepRangeChange}
                    onYoutubeUrlChange={handleYoutubeUrlChange}
                    prevDayExercises={prevWeekData[dayLog.day] || []}
                    expanded={expandedDay === idx}
                    onToggleExpanded={() => setExpandedDay(expandedDay === idx ? null : idx)}
                    isDeloadWeek={mesoWeekInfo?.isDeload ?? false}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="progress">
            <ProgressChart key={refreshKey} userId={user?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
