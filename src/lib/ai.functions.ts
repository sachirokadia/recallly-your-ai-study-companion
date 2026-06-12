import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, Output } from "ai";
import { z } from "zod";

const GenInput = z.object({
  title: z.string().min(1).max(200),
  sourceType: z.enum(["pdf", "youtube", "text"]),
  sourceName: z.string().max(300).optional(),
  content: z.string().min(20).max(60_000),
});

const QuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).length(4),
  correct: z.number().int().min(0).max(3),
  explanation: z.string(),
});

const StudyPackSchema = z.object({
  summary: z.string(),
  flashcards: z
    .array(z.object({ front: z.string(), back: z.string() }))
    .min(4)
    .max(20),
  quiz: z.array(QuestionSchema).min(4).max(10),
});

export const generateStudyPack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenInput.parse(input))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const prompt = `You are Recallly, an AI study companion for Gen Z students. Take the source content below and produce:
1. A clear, friendly markdown summary (4-8 bullet points + 1 "key insight").
2. 8-12 high quality flashcards (front = question, back = concise answer).
3. 5-8 multiple-choice quiz questions (4 options each, mark correct index, brief explanation).

Source type: ${data.sourceType}
Title: ${data.title}
${data.sourceName ? `Source: ${data.sourceName}\n` : ""}
CONTENT:
"""
${data.content.slice(0, 50_000)}
"""`;

    const { output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      output: Output.object({ schema: StudyPackSchema }),
      prompt,
    });

    // Persist to DB
    const { supabase, userId } = context;
    const { data: deck, error: deckErr } = await supabase
      .from("decks")
      .insert({
        user_id: userId,
        title: data.title,
        source_type: data.sourceType,
        source_name: data.sourceName ?? null,
        summary: output.summary,
        status: "ready",
      })
      .select()
      .single();
    if (deckErr || !deck) throw new Error(deckErr?.message ?? "Failed to create deck");

    const cardRows = output.flashcards.map((c, i) => ({
      deck_id: deck.id,
      user_id: userId,
      front: c.front,
      back: c.back,
      order_index: i,
    }));
    await supabase.from("flashcards").insert(cardRows);

    const { data: quiz } = await supabase
      .from("quizzes")
      .insert({
        user_id: userId,
        deck_id: deck.id,
        title: `${data.title} — Quiz`,
        questions: output.quiz,
      })
      .select()
      .single();

    // bump streak/XP
    const today = new Date();
    const { data: prof } = await supabase
      .from("profiles")
      .select("xp, current_streak, longest_streak, last_study_at")
      .eq("id", userId)
      .maybeSingle();
    if (prof) {
      const last = prof.last_study_at ? new Date(prof.last_study_at) : null;
      const dayMs = 86400000;
      let streak = prof.current_streak ?? 0;
      if (!last) streak = 1;
      else {
        const diff = Math.floor((today.getTime() - last.getTime()) / dayMs);
        if (diff === 0) streak = streak || 1;
        else if (diff === 1) streak = streak + 1;
        else streak = 1;
      }
      await supabase
        .from("profiles")
        .update({
          xp: (prof.xp ?? 0) + 25,
          current_streak: streak,
          longest_streak: Math.max(prof.longest_streak ?? 0, streak),
          last_study_at: today.toISOString(),
        })
        .eq("id", userId);
    }

    return { deckId: deck.id, quizId: quiz?.id ?? null };
  });

export const askTutor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ question: z.string().min(1).max(2000), context: z.string().max(20_000).optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system:
        "You are Recallly's AI tutor for Gen Z students. Explain like a friend — clear, encouraging, with analogies and emoji when helpful. Keep it under 250 words unless asked.",
      prompt: data.context
        ? `Context:\n${data.context}\n\nQuestion: ${data.question}`
        : data.question,
    });
    return { answer: text };
  });
