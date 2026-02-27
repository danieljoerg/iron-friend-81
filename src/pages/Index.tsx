import { useState, useCallback, useEffect } from "react";
import { Dumbbell, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getWeekStart as getWeekStartForDate } from "@/lib/workoutData";
import WeekSelector from "@/components/WeekSelector";
import DayCard from "@/components/DayCard";
import ProgressChart from "@/components/ProgressChart";
import { getWeekStart, formatDateString, FULL_DAYS, type WeekLog } from "@/lib/workoutData";
import { getOrCreateWeekDb, saveWeekDb, getRepRangesDb, setRepRangeDb, getPreviousWeekData, type RepRange, type ExerciseTarget } from "@/lib/workoutDb";
import type { ExerciseLog } from "@/lib/workoutData";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [weekStart, setWeekStart] = useState(() => getWeekStart());
  const [week, setWeek] = useState<WeekLog>({
    weekStart: getWeekStart(),
    days: FULL_DAYS.map((day) => ({ day, exercises: [] })),
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [repRanges, setRepRanges] = useState<Record<string, RepRange>>({});
  const [prevWeekData, setPrevWeekData] = useState<Record<string, ExerciseLog[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      getOrCreateWeekDb(weekStart, user.id),
      getRepRangesDb(user.id),
      getPreviousWeekData(weekStart, user.id),
    ]).then(([w, rr, prev]) => {
      setWeek(w);
      setRepRanges(rr);
      setPrevWeekData(prev);
      setLoading(false);
    });
  }, [weekStart, user]);

  const handleRepRangeChange = (exercise: string, min: number, max: number) => {
    setRepRanges((prev) => ({ ...prev, [exercise]: { exercise, min_reps: min, max_reps: max } }));
    if (user) setRepRangeDb(user.id, exercise, min, max);
  };

  const navigateWeek = (direction: number) => {
    const d = new Date(weekStart + "T00:00:00");
    d.setDate(d.getDate() + direction * 7);
    setWeekStart(formatDateString(d));
  };

  const goToToday = () => setWeekStart(getWeekStart());

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
    },
    [week, user]
  );

  const today = new Date();
  const todayName = FULL_DAYS[today.getDay() === 0 ? 6 : today.getDay() - 1];
  const isCurrentWeek = weekStart === getWeekStart();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-xl">Lift Log</h1>
              <p className="text-muted-foreground text-xs font-mono">Progressive overload tracker</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <WeekSelector
              weekStart={weekStart}
              onPrev={() => navigateWeek(-1)}
              onNext={() => navigateWeek(1)}
              onToday={goToToday}
              onDateSelect={(date) => setWeekStart(getWeekStartForDate(date))}
            />
            <button
              onClick={() => navigate("/profile")}
              className="p-2 rounded-lg bg-secondary hover:bg-border transition-colors text-muted-foreground hover:text-foreground"
              title="Profil"
            >
              <User className="w-4 h-4" />
            </button>
            <button
              onClick={signOut}
              className="p-2 rounded-lg bg-secondary hover:bg-border transition-colors text-muted-foreground hover:text-foreground"
              title="Ausloggen"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        <Tabs defaultValue="tracking" className="mt-2">
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
                    weekStart={weekStart}
                    onChange={(updated) => handleDayChange(idx, updated)}
                    repRanges={repRanges}
                    onRepRangeChange={handleRepRangeChange}
                    prevDayExercises={prevWeekData[dayLog.day] || []}
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
