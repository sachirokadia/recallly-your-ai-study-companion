import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { generateStudyPack } from "@/lib/ai.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, Youtube, Type, Upload as UploadIcon, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/upload")({
  component: UploadPage,
});

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // worker
  // @ts-expect-error vite worker import
  const worker = (await import("pdfjs-dist/build/pdf.worker.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = worker;
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  let out = "";
  const maxPages = Math.min(pdf.numPages, 40);
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const c = await page.getTextContent();
    out += c.items.map((it: { str?: string }) => it.str ?? "").join(" ") + "\n\n";
  }
  return out.trim();
}

function UploadPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const gen = useServerFn(generateStudyPack);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<string>("");

  async function run(payload: { title: string; sourceType: "pdf" | "youtube" | "text"; sourceName?: string; content: string }) {
    setBusy(true);
    try {
      setStep("✨ Recallly is reading your content…");
      const res = await gen({ data: payload });
      qc.invalidateQueries({ queryKey: ["decks"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Study pack ready!");
      nav({ to: "/decks/$deckId", params: { deckId: res.deckId } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
      setBusy(false);
      setStep("");
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-4xl font-bold">Upload <span className="gradient-text">anything</span></h1>
        <p className="text-muted-foreground mt-2">PDFs, YouTube lectures, or pasted notes — Recallly turns it all into study material.</p>
      </motion.div>

      <Tabs defaultValue="pdf" className="mt-8">
        <TabsList className="grid grid-cols-3 max-w-md rounded-2xl bg-muted/40 p-1">
          <TabsTrigger value="pdf" className="rounded-xl"><FileText className="size-4 mr-1" />PDF</TabsTrigger>
          <TabsTrigger value="youtube" className="rounded-xl"><Youtube className="size-4 mr-1" />YouTube</TabsTrigger>
          <TabsTrigger value="text" className="rounded-xl"><Type className="size-4 mr-1" />Text</TabsTrigger>
        </TabsList>

        <TabsContent value="pdf"><PdfUpload onSubmit={run} busy={busy} /></TabsContent>
        <TabsContent value="youtube"><YoutubeUpload onSubmit={run} busy={busy} /></TabsContent>
        <TabsContent value="text"><TextUpload onSubmit={run} busy={busy} /></TabsContent>
      </Tabs>

      <AnimatePresence>
        {busy && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xl flex items-center justify-center"
          >
            <div className="text-center space-y-4">
              <div className="size-20 mx-auto rounded-3xl bg-gradient-to-br from-grape via-lavender to-sky flex items-center justify-center animate-glow">
                <Sparkles className="size-10 text-white animate-pulse" />
              </div>
              <p className="font-display text-xl font-bold">{step || "Working magic…"}</p>
              <p className="text-sm text-muted-foreground">Summarizing, generating flashcards & quiz</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type SubmitFn = (p: { title: string; sourceType: "pdf" | "youtube" | "text"; sourceName?: string; content: string }) => void;

function PdfUpload({ onSubmit, busy }: { onSubmit: SubmitFn; busy: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const onDrop = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.pdf$/i, ""));
  }, [title]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  });

  async function go() {
    if (!file || !title) return toast.error("Pick a PDF and give it a title");
    try {
      const text = await extractPdfText(file);
      if (text.length < 100) return toast.error("Couldn't read text from this PDF (scanned?)");
      onSubmit({ title, sourceType: "pdf", sourceName: file.name, content: text });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "PDF read failed");
    }
  }

  return (
    <Card className="mt-6 p-6 rounded-3xl border-border/40 bg-card/60">
      <div
        {...getRootProps()}
        className={`rounded-3xl border-2 border-dashed p-12 text-center transition-colors cursor-pointer ${
          isDragActive ? "border-grape bg-grape/10" : "border-border/60 hover:border-grape/60 hover:bg-muted/30"
        }`}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="size-8 text-grape" />
            <div className="text-left">
              <div className="font-medium">{file.name}</div>
              <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</div>
            </div>
            <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setFile(null); }}><X className="size-4" /></Button>
          </div>
        ) : (
          <>
            <UploadIcon className="size-10 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium">Drop a PDF or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">Up to 20MB · text-based PDFs work best</p>
          </>
        )}
      </div>
      <div className="mt-4 space-y-3">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Deck title (e.g. Chapter 3 — Photosynthesis)" className="rounded-xl h-11" />
        <Button onClick={go} disabled={busy || !file} className="w-full h-12 rounded-xl bg-gradient-to-r from-grape to-lavender text-white font-semibold">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          Generate study pack
        </Button>
      </div>
    </Card>
  );
}

function YoutubeUpload({ onSubmit, busy }: { onSubmit: SubmitFn; busy: boolean }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  function go() {
    if (!url || !title) return toast.error("Add a YouTube URL and title");
    if (transcript.length < 100) return toast.error("Paste at least the transcript or your notes (100+ chars)");
    onSubmit({ title, sourceType: "youtube", sourceName: url, content: transcript });
  }
  return (
    <Card className="mt-6 p-6 rounded-3xl border-border/40 bg-card/60 space-y-3">
      <div>
        <label className="text-sm font-medium">YouTube URL</label>
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtube.com/watch?v=…" className="rounded-xl h-11 mt-1" />
      </div>
      <div>
        <label className="text-sm font-medium">Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lecture title" className="rounded-xl h-11 mt-1" />
      </div>
      <div>
        <label className="text-sm font-medium">Transcript or notes</label>
        <Textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={8} placeholder="Paste the video transcript or your notes — Recallly turns it into a full study pack." className="rounded-xl mt-1" />
        <p className="text-xs text-muted-foreground mt-1">Tip: open the video → click "Show transcript" → copy & paste here.</p>
      </div>
      <Button onClick={go} disabled={busy} className="w-full h-12 rounded-xl bg-gradient-to-r from-coral to-sunny text-white font-semibold">
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        Generate study pack
      </Button>
    </Card>
  );
}

function TextUpload({ onSubmit, busy }: { onSubmit: SubmitFn; busy: boolean }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  function go() {
    if (!title || text.length < 100) return toast.error("Add a title and at least 100 chars");
    onSubmit({ title, sourceType: "text", content: text });
  }
  return (
    <Card className="mt-6 p-6 rounded-3xl border-border/40 bg-card/60 space-y-3">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Deck title" className="rounded-xl h-11" />
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={12} placeholder="Paste lecture notes, an article, or any study text…" className="rounded-xl" />
      <Button onClick={go} disabled={busy} className="w-full h-12 rounded-xl bg-gradient-to-r from-mint to-sky text-white font-semibold">
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        Generate study pack
      </Button>
    </Card>
  );
}
