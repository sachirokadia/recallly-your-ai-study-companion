import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { getQuiz, submitQuizAttempt } from "@/lib/profile.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy, Timer, Check, X, ArrowRight, Sparkles } from "lucide-react";

type Question = { question: string; options: string[]; correct: number; explanation: string };

export const Route = createFileRoute("/_authenticated/quiz/$quizId")({
  component: QuizPage,
});

function QuizPage() {
  const { quizId } = Route.useParams();
  const fetch = useServerFn(getQuiz);
  const submit = useServerFn(submitQuizAttempt);
  const qc = useQueryClient();
  const { data: quiz } = useQuery({ queryKey: ["quiz", quizId], queryFn: () => fetch({ data: { quizId } }) });

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [xp, setXp] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const start = useRef<number>(Date.now());

  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, [done]);

  if (!quiz) return <div className="p-10 text-center text-muted-foreground">Loading quiz…</div>;
  const questions = (quiz.questions as unknown as Question[]) ?? [];
  const total = questions.length;
  const q = questions[idx];

  function pick(i: number) {
    if (selected !== null) return;
    setSelected(i);
    if (i === q.correct) setScore((s) => s + 1);
  }

  async function next() {
    if (idx + 1 < total) {
      setIdx(idx + 1);
      setSelected(null);
    } else {
      const time = Math.floor((Date.now() - start.current) / 1000);
      const r = await submit({ data: { quizId, score, total, timeSeconds: time } });
      setXp(r.xpEarned);
      setDone(true);
      qc.invalidateQueries({ queryKey: ["profile"] });
      const fire = (deg: number, x: number) =>
        confetti({ particleCount: 60, angle: deg, spread: 70, origin: { x, y: 0.7 }, colors: ["#a78bfa", "#7c3aed", "#38bdf8", "#34d399", "#f87171", "#fbbf24"] });
      fire(60, 0); fire(120, 1);
      setTimeout(() => { fire(90, 0.5); }, 400);
    }
  }

  if (done) {
    const pct = Math.round((score / total) * 100);
    return (
      <div className="p-6 md:p-10 max-w-2xl mx-auto">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 100 }}>
          <Card className="rounded-3xl p-10 text-center border-border/40 bg-gradient-to-br from-grape/20 via-lavender/20 to-sky/20">
            <div className="size-20 mx-auto rounded-3xl bg-gradient-to-br from-sunny to-coral flex items-center justify-center mb-4 animate-glow">
              <Trophy className="size-10 text-white" />
            </div>
            <h1 className="font-display text-4xl font-bold">{pct >= 80 ? "Crushed it!" : pct >= 50 ? "Nice work!" : "Good effort!"}</h1>
            <p className="text-muted-foreground mt-2">{score} / {total} correct</p>
            <div className="grid grid-cols-3 gap-3 mt-8 text-center">
              <Stat label="Score" value={`${pct}%`} />
              <Stat label="XP earned" value={`+${xp}`} />
              <Stat label="Time" value={`${elapsed}s`} />
            </div>
            <div className="mt-8 flex gap-2 justify-center">
              <Link to="/dashboard"><Button variant="outline" className="rounded-xl">Dashboard</Button></Link>
              <Button onClick={() => { setIdx(0); setSelected(null); setScore(0); setDone(false); start.current = Date.now(); }} className="rounded-xl bg-gradient-to-r from-grape to-lavender text-white">Retry</Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-bold">{quiz.title}</h1>
        <div className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full bg-card/60 border border-border/40">
          <Timer className="size-4 text-grape" /> {elapsed}s
        </div>
      </div>
      <Progress value={((idx + 1) / total) * 100} className="h-2" />
      <p className="text-xs text-muted-foreground mt-2">Question {idx + 1} of {total}</p>

      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ type: "spring", stiffness: 90, damping: 16 }}
        >
          <Card className="rounded-3xl p-8 mt-6 border-border/40 bg-card/60 backdrop-blur">
            <p className="font-display text-xl md:text-2xl font-semibold leading-snug">{q.question}</p>
            <div className="mt-6 space-y-2">
              {q.options.map((opt, i) => {
                const isCorrect = i === q.correct;
                const isPicked = selected === i;
                const show = selected !== null;
                return (
                  <button
                    key={i}
                    onClick={() => pick(i)}
                    disabled={selected !== null}
                    className={`w-full text-left rounded-2xl p-4 border transition-all flex items-center gap-3 ${
                      show && isCorrect
                        ? "border-mint bg-mint/15"
                        : show && isPicked
                          ? "border-coral bg-coral/15"
                          : "border-border/60 hover:border-grape/60 hover:bg-muted/30"
                    }`}
                  >
                    <div className={`size-7 rounded-full flex items-center justify-center text-xs font-bold ${show && isCorrect ? "bg-mint text-white" : show && isPicked ? "bg-coral text-white" : "bg-muted"}`}>
                      {show && isCorrect ? <Check className="size-4" /> : show && isPicked ? <X className="size-4" /> : String.fromCharCode(65 + i)}
                    </div>
                    <span className="flex-1">{opt}</span>
                  </button>
                );
              })}
            </div>
            {selected !== null && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-2xl bg-muted/50 p-4 text-sm">
                <div className="flex items-center gap-2 font-semibold mb-1"><Sparkles className="size-4 text-grape" /> Explanation</div>
                {q.explanation}
              </motion.div>
            )}
            {selected !== null && (
              <Button onClick={next} className="mt-5 w-full h-12 rounded-xl bg-gradient-to-r from-grape to-lavender text-white">
                {idx + 1 < total ? <>Next <ArrowRight className="size-4" /></> : <>Finish <Trophy className="size-4" /></>}
              </Button>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl p-4 bg-card/60 border border-border/40">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-display text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
