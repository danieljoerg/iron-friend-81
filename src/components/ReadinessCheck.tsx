import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const LEVELS = [
  { value: 1, emoji: "😫", label: "Schlecht", color: "bg-destructive/20 border-destructive/40 text-destructive" },
  { value: 2, emoji: "😮‍💨", label: "Mäßig", color: "bg-orange-500/20 border-orange-500/40 text-orange-400" },
  { value: 3, emoji: "😐", label: "Okay", color: "bg-yellow-500/20 border-yellow-500/40 text-yellow-400" },
  { value: 4, emoji: "😊", label: "Gut", color: "bg-primary/20 border-primary/40 text-primary" },
  { value: 5, emoji: "🔥", label: "Top", color: "bg-primary/30 border-primary/50 text-primary" },
];

interface ReadinessCheckProps {
  day: string;
  open: boolean;
  onSelect: (value: number) => void;
  onCancel: () => void;
}

export default function ReadinessCheck({ day, open, onSelect, onCancel }: ReadinessCheckProps) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (value: number) => {
    setSelected(value);
    // Short delay so user sees their selection
    setTimeout(() => {
      onSelect(value);
      setSelected(null);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-center font-heading text-lg">
            Wie fühlst du dich heute?
          </DialogTitle>
          <DialogDescription className="text-center text-xs font-mono text-muted-foreground">
            Readiness Check · {day}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center gap-2 py-4">
          {LEVELS.map((level) => (
            <button
              key={level.value}
              onClick={() => handleSelect(level.value)}
              className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-3 transition-all ${
                selected === level.value
                  ? level.color + " scale-110 shadow-lg"
                  : "border-border bg-secondary hover:border-muted-foreground/30 hover:scale-105"
              }`}
            >
              <span className="text-2xl">{level.emoji}</span>
              <span className="text-[9px] font-mono text-muted-foreground">{level.label}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
