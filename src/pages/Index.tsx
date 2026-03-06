import { useState, useCallback, useEffect, useRef } from "react";
import { Dumbbell, LogOut, User, Settings, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { getWeekStart as getWeekStartForDate } from "@/lib/workoutData";
import WeekSelector from "@/components/WeekSelector";
import DayCard from "@/components/DayCard";
import ProgressChart from "@/components/ProgressChart";
import { getWeekStart, formatDateString, FULL_DAYS, type WeekLog } from "@/lib/workoutData";
import { getOrCreateWeekDb, saveWeekDb, completeWeekAndPrepareNext, getRepRangesDb, setRepRangeDb, setYoutubeUrlDb, getPreviousWeekData, getActiveMesocycle, createMesocycle, deleteMesocycle, getMesocycleWeekInfo, computeDeloadTargets, type RepRange, type ExerciseTarget, type Mesocycle } from "@/lib/workoutDb";
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
  const skipNextFetchRef = useRef(false);
  const pendingWeekDataRef = useRef<{ week: WeekLog; prevData: Record<string, ExerciseLog[]>; trainingDays: string[] | null } | null>(null);

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
    if (skipNextFetchRef.current) {
      console.log("[Index] Skipping fetch for", weekStart, "- data already set from completeWeek");
      skipNextFetchRef.current = false;
      return;
    }
    console.log("[Index] Fetching week data for", weekStart);
    setLoading(true);
    Promise.all([
      getOrCreateWeekDb(weekStart, user.id),
      getRepRangesDb(user.id),
      getPreviousWeekData(weekStart, user.id),
      getActiveMesocycle(user.id),
    ]).then(([w, rr, prev, meso]) => {
      console.log("[Index] Loaded week", weekStart, "- exercises per day:", w.days.map(d => `${d.day}:${d.exercises.length}`).join(", "));
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
  const effectiveTrainingDays = weekTrainingDays ?? defaultTrainingDays;

  const allDaysDone = week.days.every(d => d.done || (!effectiveTrainingDays.includes(d.day) && d.exercises.length === 0));
  const hasAnyExercises = week.days.some(d => d.exercises.length > 0);

  const handleCompleteWeek = async () => {
    if (!user) return;
    
    // Mark all days as done
    const completedWeek: WeekLog = {
      ...week,
      days: week.days.map(d => ({
        ...d,
        done: d.exercises.length > 0 ? true : d.done,
        exercises: d.exercises.map(ex => ({
          ...ex,
          sets: ex.sets.map(s => ({ ...s, done: true })),
        })),
      })),
    };

    console.log("[handleCompleteWeek] Completing week", completedWeek.weekStart,
      "exercises:", completedWeek.days.map(d => `${d.day}:${d.exercises.length}`).join(", "));

    // Optimistic update: show completed state
    setWeek(completedWeek);

    // Save completed week + create next week with copied exercises
    const nextWeek = await completeWeekAndPrepareNext(completedWeek, user.id);

    console.log("[handleCompleteWeek] Next week ready:", nextWeek.weekStart,
      "exercises:", nextWeek.days.map(d => `${d.day}:${d.exercises.length}`).join(", "));

    // Load prev week data for progression targets
    const prevData = await getPreviousWeekData(nextWeek.weekStart, user.id);

    // CRITICAL: Set skip flag BEFORE any state updates to prevent useEffect overwrite
    skipNextFetchRef.current = true;

    // Update all state - weekStart LAST to ensure skip flag is read by effect
    setWeek(nextWeek);
    setPrevWeekData(prevData);
    setWeekTrainingDays(nextWeek.trainingDays ?? null);
    setLoading(false);
    // Use functional update to ensure this triggers the effect AFTER other states are set
    setWeekStart(nextWeek.weekStart);
  };

  const handleToggleWeekDay = (day: string) => {
    const current = weekTrainingDays ?? [...defaultTrainingDays];
    const updated = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    setWeekTrainingDays(updated);
    const updatedWeek = { ...week, trainingDays: updated };
    setWeek(updatedWeek);
    if (user) saveWeekDb(updatedWeek, user.id);
  };

  const handleResetWeekDays = () => {
    setWeekTrainingDays(null);
    const updatedWeek = { ...week, trainingDays: null };
    setWeek(updatedWeek);
    if (user) saveWeekDb(updatedWeek, user.id);
  };

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
            trainingDays={effectiveTrainingDays}
            hasWeekOverride={weekTrainingDays !== null}
            onToggleDay={handleToggleWeekDay}
            onResetDays={handleResetWeekDays}
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
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {week.days.map((dayLog, idx) => (
                    <DayCard
                      key={dayLog.day}
                      dayLog={dayLog}
                      isToday={isCurrentWeek && dayLog.day === todayName}
                      isRestDay={!effectiveTrainingDays.includes(dayLog.day)}
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

                {/* Complete Week Button */}
                {hasAnyExercises && !allDaysDone && (
                  <button
                    onClick={handleCompleteWeek}
                    className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-mono font-medium transition-all bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                  >
                    <CheckCheck className="w-4 h-4" />
                    Woche abschließen → nächste Woche
                  </button>
                )}
                {hasAnyExercises && allDaysDone && (
                  <button
                    onClick={() => navigateWeek(1)}
                    className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-mono font-medium transition-all bg-primary/80 text-primary-foreground hover:bg-primary/70 shadow-sm"
                  >
                    <CheckCheck className="w-4 h-4" />
                    Nächste Woche →
                  </button>
                )}
              </>
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
