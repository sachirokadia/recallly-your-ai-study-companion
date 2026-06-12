import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyDecks } from "@/lib/profile.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/decks/")({
  component: DecksList,
});

function DecksList() {
  const fetchDecks = useServerFn(listMyDecks);
  const { data: decks } = useQuery({ queryKey: ["decks"], queryFn: () => fetchDecks() });
  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-4xl font-bold">My <span className="gradient-text">decks</span></h1>
        <Link to="/upload"><Button className="rounded-xl bg-gradient-to-r from-grape to-lavender text-white"><Plus className="size-4" /> New</Button></Link>
      </div>
      {!decks?.length ? (
        <Card className="rounded-3xl border-dashed border-2 p-10 text-center">
          <BookOpen className="size-10 mx-auto text-muted-foreground mb-3" />
          <p>No decks yet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((d) => (
            <Link key={d.id} to="/decks/$deckId" params={{ deckId: d.id }}>
              <Card className="p-5 rounded-3xl border-border/40 bg-card/60 hover:scale-[1.02] transition-transform h-full">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{d.source_type}</div>
                <h3 className="font-display font-bold text-lg mt-1 line-clamp-2">{d.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{d.summary?.slice(0, 140)}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
