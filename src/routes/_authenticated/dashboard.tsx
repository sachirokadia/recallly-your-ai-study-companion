import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { motion } from "framer-motion";
import { getMyProfile, listMyDecks } from "@/lib/profile.functions";
import { askTutor } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Flame, Trophy, Layers, Upload, Sparkles, Send, Loader2, ArrowRight, BookOpen } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const fetchProfile = useServerFn(getMyProfile);
  const fetchDecks = useServerFn(listMyDecks);
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });
  const { data: decks } = useQuery({ queryKey: ["decks"], queryFn: () => fetchDecks() });

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
          Hey, <span className="gradient-text">{profile?.display_name ?? "Student"}</span> 👋
        </h1>
        <p className="text-muted-foreground mt-2">Pick up where you left off, or upload something new.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={Flame} label="Day streak" value={profile?.current_streak ?? 0} tint="from-coral/20 to-sunny/20 border-coral/30" />
        <StatCard icon={Trophy} label="Total XP" value={profile?.xp ?? 0} tint="from-mint/20 to-sky/20 border-mint/30" />
        <StatCard icon={Layers} label="Decks" value={decks?.length ?? 0} tint="from-lavender/20 to-grape/20 border-lavender/30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TutorCard />
        <Card className="lg:col-span-1 p-6 rounded-3xl border-border/40 bg-gradient-to-br from-grape via-lavender to-sky text-white overflow-hidden relative">
          <div className="absolute -top-10 -right-10 size-40 rounded-full bg-white/10 blur-2xl" />
          <Sparkles className="size-6 mb-4" />
          <h3 className="font-display text-xl font-bold">Drop a PDF or YouTube link</h3>
          <p className="text-sm text-white/80 mt-1">Get a summary, flashcards & a quiz in seconds.</p>
          <Link to="/upload" className="mt-5 inline-flex items-center gap-2 rounded-full bg-white text-grape px-4 py-2 text-sm font-semibold hover:scale-[1.02] transition-transform">
            <Upload className="size-4" /> Start uploading <ArrowRight className="size-4" />
          </Link>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-2xl font-bold">Recent decks</h2>
          <Link to="/upload" className="text-sm text-muted-foreground hover:text-foreground story-link">+ New</Link>
        </div>
        {!decks?.length ? (
          <Card className="rounded-3xl border-dashed border-2 border-border/60 p-10 text-center bg-card/40">
            <BookOpen className="size-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No decks yet — upload your first PDF or paste a YouTube link.</p>
            <Link to="/upload" className="mt-4 inline-flex"><Button className="rounded-xl bg-gradient-to-r from-grape to-lavender text-white">Get started</Button></Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {decks.map((d) => (
              <Link key={d.id} to="/decks/$deckId" params={{ deckId: d.id }}>
                <Card className="p-5 rounded-3xl border-border/40 bg-card/60 backdrop-blur hover:scale-[1.02] transition-transform cursor-pointer h-full">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">{d.source_type}</div>
                  <h3 className="font-display font-bold text-lg mt-1 line-clamp-2">{d.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{d.summary?.slice(0, 140) ?? "—"}</p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tint }: { icon: typeof Flame; label: string; value: number | string; tint: string }) {
  return (
    <Card className={`p-5 rounded-3xl border bg-gradient-to-br ${tint} backdrop-blur`}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="size-4" /> {label}</div>
      <div className="font-display text-4xl font-bold mt-2">{value}</div>
    </Card>
  );
}

function TutorCard() {
  const ask = useServerFn(askTutor);
  const [q, setQ] = useState("");
  const [a, setA] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  async function send() {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const r = await ask({ data: { question: q } });
      setA(r.answer);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Tutor failed");
    } finally {
      setLoading(false);
    }
  }
  return (
    <Card className="lg:col-span-2 p-6 rounded-3xl border-border/40 bg-card/60 backdrop-blur relative overflow-hidden">
      <div className="absolute -top-20 -right-20 size-48 rounded-full bg-lavender/20 blur-3xl" />
      <div className="flex items-center gap-2">
        <div className="size-10 rounded-2xl bg-gradient-to-br from-mint to-sky flex items-center justify-center">
          <Sparkles className="size-5 text-white" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold">AI Tutor</h3>
          <p className="text-xs text-muted-foreground">Ask anything — explained like a friend</p>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {a && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-muted/50 p-4 text-sm whitespace-pre-wrap leading-relaxed"
          >
            {a}
          </motion.div>
        )}
        <div className="flex gap-2 items-end">
          <Textarea
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Explain Bayes' theorem like I'm 12…"
            rows={2}
            className="rounded-2xl resize-none"
          />
          <Button onClick={send} disabled={loading} size="icon" className="size-11 rounded-2xl bg-gradient-to-br from-grape to-lavender">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
      </div>
    </Card>
  );
}
