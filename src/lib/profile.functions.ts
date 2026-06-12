import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        display_name: z.string().min(1).max(80).optional(),
        avatar_url: z.string().url().optional().nullable(),
        subjects: z.array(z.string().max(40)).max(20).optional(),
        goals: z.string().max(500).optional().nullable(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("profiles").update(data).eq("id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const listMyDecks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("decks")
      .select("id, title, source_type, source_name, summary, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const getDeck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ deckId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const [{ data: deck }, { data: cards }, { data: quiz }] = await Promise.all([
      context.supabase.from("decks").select("*").eq("id", data.deckId).maybeSingle(),
      context.supabase
        .from("flashcards")
        .select("*")
        .eq("deck_id", data.deckId)
        .order("order_index"),
      context.supabase.from("quizzes").select("id, title").eq("deck_id", data.deckId).maybeSingle(),
    ]);
    return { deck, cards: cards ?? [], quiz };
  });

export const updateCardConfidence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ cardId: z.string().uuid(), confidence: z.number().int().min(0).max(3) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("flashcards")
      .update({ confidence: data.confidence })
      .eq("id", data.cardId);
    return { ok: true };
  });

export const getQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ quizId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: quiz } = await context.supabase
      .from("quizzes")
      .select("*")
      .eq("id", data.quizId)
      .maybeSingle();
    return quiz;
  });

export const submitQuizAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        quizId: z.string().uuid(),
        score: z.number().int().min(0),
        total: z.number().int().min(1),
        timeSeconds: z.number().int().min(0),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const xp = data.score * 10 + Math.max(0, Math.floor((60 - data.timeSeconds / data.total) * 2));
    await context.supabase.from("quiz_attempts").insert({
      quiz_id: data.quizId,
      user_id: context.userId,
      score: data.score,
      total: data.total,
      xp_earned: xp,
      time_seconds: data.timeSeconds,
    });
    const { data: prof } = await context.supabase
      .from("profiles")
      .select("xp")
      .eq("id", context.userId)
      .maybeSingle();
    await context.supabase
      .from("profiles")
      .update({ xp: (prof?.xp ?? 0) + xp })
      .eq("id", context.userId);
    return { xpEarned: xp };
  });
