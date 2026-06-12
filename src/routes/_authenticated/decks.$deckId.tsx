import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getDeck, updateCardConfidence } from "@/lib/profile.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCw, Check, X, Sparkles, Play, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/decks/$deckId")({
  component: DeckPage,
});

function DeckPage() {
  const { deckId } = Route.useParams();
  const fetchDeck = useServerFn(getDeck);
  const { data } = useQuery({
    queryKey: ["deck", deckId],
    queryFn: () => fetchDeck({ data: { deckId } }),
  });

  if (!data?.deck) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Back</Link>

      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{data.deck.source_type}</div>
        <h1 className="font-display text-4xl font-bold mt-1">{data.deck.title}</h1>
      </div>

      <Card className="rounded-3xl border-border/40 bg-gradient-to-br from-lavender/15 to-sky/15 p-6">
        <div className="flex items-center gap-2 text-sm font-medium mb-2"><Sparkles className="size-4 text-grape" /> AI Summary</div>
        <div className="text-sm whitespace-pre-wrap leading-relaxed">{data.deck.summary}</div>
      </Card>

      <FlashcardStack cards={data.cards} deckId={deckId} />

      {data.quiz && (
        <Link to="/quiz/$quizId" params={{ quizId: data.quiz.id }}>
          <Card className="rounded-3xl p-6 border-border/40 bg-gradient-to-r from-coral to-sunny text-white flex items-center justify-between hover:scale-[1.01] transition-transform cursor-pointer">
            <div>
              <h3 className="font-display text-xl font-bold">Ready for the quiz?</h3>
              <p className="text-sm text-white/80">Test your recall + earn XP</p>
            </div>
            <Button size="lg" className="rounded-xl bg-white text-coral hover:bg-white/90"><Play className="size-4" /> Start</Button>
          </Card>
        </Link>
      )}
    </div>
  );
}

type Card = { id: string; front: string; back: string; confidence: number };

function FlashcardStack({ cards, deckId }: { cards: Card[]; deckId: string }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const qc = useQueryClient();
  const update = useServerFn(updateCardConfidence);

  if (!cards.length) return null;
  const card = cards[idx];
  const total = cards.length;
  const known = cards.filter((c) => c.confidence >= 2).length;

  async function rate(conf: number) {
    await update({ data: { cardId: card.id, confidence: conf } });
    qc.invalidateQueries({ queryKey: ["deck", deckId] });
    setFlipped(false);
    setIdx((i) => Math.min(i + 1, total - 1));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-2xl font-bold">Flashcards</h2>
        <div className="text-sm text-muted-foreground">{idx + 1} / {total} · Known: <span className="font-semibold text-mint">{known}</span></div>
      </div>

      <div className="relative h-80 [perspective:1500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={card.id + (flipped ? "b" : "f")}
            initial={{ opacity: 0, y: 30, rotateX: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ type: "spring", stiffness: 90, damping: 16 }}
            onClick={() => setFlipped((f) => !f)}
            className={`absolute inset-0 rounded-3xl p-8 cursor-pointer shadow-2xl border border-border/40 flex flex-col justify-center items-center text-center ${
              flipped
                ? "bg-gradient-to-br from-mint/30 to-sky/30"
                : "bg-gradient-to-br from-lavender/20 to-grape/20"
            }`}
          >
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">{flipped ? "Answer" : "Question"}</div>
            <p className="font-display text-xl md:text-2xl font-semibold leading-snug">{flipped ? card.back : card.front}</p>
            <div className="mt-6 inline-flex items-center gap-1 text-xs text-muted-foreground"><RotateCw className="size-3" /> Tap to flip</div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <Button variant="ghost" size="icon" onClick={() => { setIdx((i) => Math.max(0, i - 1)); setFlipped(false); }}><ChevronLeft /></Button>
        {flipped ? (
          <div className="flex-1 grid grid-cols-3 gap-2">
            <Button onClick={() => rate(0)} variant="outline" className="rounded-xl border-coral/40 text-coral hover:bg-coral/10"><X className="size-4" />Again</Button>
            <Button onClick={() => rate(1)} variant="outline" className="rounded-xl border-sunny/40 text-sunny hover:bg-sunny/10">Hard</Button>
            <Button onClick={() => rate(3)} className="rounded-xl bg-gradient-to-r from-mint to-sky text-white"><Check className="size-4" />Easy</Button>
          </div>
        ) : (
          <Button onClick={() => setFlipped(true)} className="flex-1 rounded-xl bg-gradient-to-r from-grape to-lavender text-white">Flip card</Button>
        )}
        <Button variant="ghost" size="icon" onClick={() => { setIdx((i) => Math.min(total - 1, i + 1)); setFlipped(false); }}><ChevronRight /></Button>
      </div>
    </div>
  );
}
