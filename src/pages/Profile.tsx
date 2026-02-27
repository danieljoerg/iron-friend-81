import { useState, useEffect } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ProfileData {
  display_name: string;
  age: number | null;
  gender: string;
  body_weight: number | null;
  height: number | null;
  training_experience: string;
}

const GENDER_OPTIONS = ["Männlich", "Weiblich", "Divers"];
const EXPERIENCE_OPTIONS = ["Anfänger (< 1 Jahr)", "Fortgeschritten (1-3 Jahre)", "Erfahren (3+ Jahre)", "Elite (5+ Jahre)"];

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    display_name: "",
    age: null,
    gender: "",
    body_weight: null,
    height: null,
    training_experience: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, age, gender, body_weight, height, training_experience")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile({
            display_name: data.display_name || "",
            age: data.age,
            gender: data.gender || "",
            body_weight: data.body_weight ? Number(data.body_weight) : null,
            height: data.height ? Number(data.height) : null,
            training_experience: data.training_experience || "",
          });
        }
        setLoading(false);
      });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: profile.display_name || null,
        age: profile.age,
        gender: profile.gender || null,
        body_weight: profile.body_weight,
        height: profile.height,
        training_experience: profile.training_experience || null,
      })
      .eq("user_id", user.id);

    setSaving(false);
    if (error) {
      toast.error("Fehler beim Speichern");
    } else {
      toast.success("Profil gespeichert");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-lg bg-secondary hover:bg-border transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-heading font-bold text-xl">Mein Profil</h1>
            <p className="text-muted-foreground text-xs font-mono">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-mono text-muted-foreground mb-1 block">Name</label>
            <input
              type="text"
              value={profile.display_name}
              onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
              placeholder="Dein Name"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-1 block">Alter</label>
              <input
                type="number"
                min={10}
                max={100}
                value={profile.age ?? ""}
                onChange={(e) => setProfile({ ...profile, age: e.target.value ? Number(e.target.value) : null })}
                placeholder="Jahre"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-1 block">Geschlecht</label>
              <select
                value={profile.gender}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Auswählen</option>
                {GENDER_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-1 block">Gewicht (kg)</label>
              <input
                type="number"
                min={30}
                max={300}
                step={0.1}
                value={profile.body_weight ?? ""}
                onChange={(e) => setProfile({ ...profile, body_weight: e.target.value ? Number(e.target.value) : null })}
                placeholder="kg"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-1 block">Größe (cm)</label>
              <input
                type="number"
                min={100}
                max={250}
                value={profile.height ?? ""}
                onChange={(e) => setProfile({ ...profile, height: e.target.value ? Number(e.target.value) : null })}
                placeholder="cm"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-muted-foreground mb-1 block">Trainingserfahrung</label>
            <select
              value={profile.training_experience}
              onChange={(e) => setProfile({ ...profile, training_experience: e.target.value })}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Auswählen</option>
              {EXPERIENCE_OPTIONS.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-mono font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Speichern..." : "Profil speichern"}
          </button>

          <button
            onClick={signOut}
            className="w-full text-center text-xs font-mono text-muted-foreground hover:text-destructive transition-colors py-2"
          >
            Ausloggen
          </button>
        </div>
      </div>
    </div>
  );
}
