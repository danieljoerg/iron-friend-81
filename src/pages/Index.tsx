import { useState, useCallback, useEffect } from "react";
import { Dumbbell } from "lucide-react";
import WeekSelector from "@/components/WeekSelector";
import DayCard from "@/components/DayCard";
import ProgressChart from "@/components/ProgressChart";
import { getWeekStart, getOrCreateWeek, saveWeek, WeekLog, FULL_DAYS } from "@/lib/workoutData";

const Index = () => {
  const [weekStart, setWeekStart] = useState(() => getWeekStart());
  const [week, setWeek] = useState<WeekLog>(() => getOrCreateWeek(getWeekStart()));
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setWeek(getOrCreateWeek(weekStart));
  }, [weekStart]);

  const navigateWeek = (direction: number) => {
    const d = new Date(weekStart + "T00:00:00");
    d.setDate(d.getDate() + direction * 7);
    setWeekStart(d.toISOString().split("T")[0]);
  };

  const goToToday = () => setWeekStart(getWeekStart());

  const handleDayChange = useCallback(
    (dayIndex: number, updatedDay: typeof week.days[0]) => {
      const updatedWeek = {
        ...week,
        days: week.days.map((d, i) => (i === dayIndex ? updatedDay : d)),
      };
      setWeek(updatedWeek);
      saveWeek(updatedWeek);
      setRefreshKey((k) => k + 1);
    },
    [week]
  );

  // Figure out today's day name
  const today = new Date();
  const todayName = FULL_DAYS[today.getDay() === 0 ? 6 : today.getDay() - 1];
  const isCurrentWeek = weekStart === getWeekStart();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
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
          <WeekSelector
            weekStart={weekStart}
            onPrev={() => navigateWeek(-1)}
            onNext={() => navigateWeek(1)}
            onToday={goToToday}
          />
        </div>

        {/* Progress Chart */}
        <div className="mb-6">
          <ProgressChart key={refreshKey} />
        </div>

        {/* Day Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {week.days.map((dayLog, idx) => (
            <DayCard
              key={dayLog.day}
              dayLog={dayLog}
              isToday={isCurrentWeek && dayLog.day === todayName}
              onChange={(updated) => handleDayChange(idx, updated)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
