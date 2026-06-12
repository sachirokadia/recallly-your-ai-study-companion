import { createFileRoute } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  Sparkles, FileText, Youtube as YoutubeIcon, Brain, Layers, BarChart3, Calendar,
  MessageSquareText, Zap, ArrowRight, Play, Upload, GraduationCap,
  Flame, Trophy, Target, BookOpen, Wand2, MoonStar,
} from "lucide-react";
import heroDashboard from "@/assets/hero-dashboard.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Recallly — Study smarter. Recall faster." },
      { name: "description", content: "AI study platform that turns lectures, PDFs and YouTube videos into instant summaries, flashcards, quizzes and revision plans." },
    ],
  }),
  component: Landing,
});

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 80, damping: 16 } },
};

function Landing() {
  return (
    <div className="relative mesh-bg min-h-screen text-foreground overflow-hidden">
      <Blobs />
      <Nav />
      <Hero />
      <LogoStrip />
      <Features />
      <HowItWorks />
      <TutorShowcase />
      <AnalyticsPreview />
      <Testimonials />
      <NightBeforeExam />
      <CTA />
      <Footer />
    </div>
  );
}

function Blobs() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-32 -left-20 h-[480px] w-[480px] rounded-full bg-grape/30 blur-3xl animate-blob" />
      <div className="absolute top-1/3 -right-32 h-[520px] w-[520px] rounded-full bg-sky/30 blur-3xl animate-blob" style={{ animationDelay: "-6s" }} />
      <div className="absolute bottom-0 left-1/3 h-[420px] w-[420px] rounded-full bg-coral/25 blur-3xl animate-blob" style={{ animationDelay: "-12s" }} />
    </div>
  );
}

function Nav() {
  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="sticky top-4 z-50 mx-auto mt-4 flex w-[min(1200px,94%)] items-center justify-between rounded-3xl glass-strong px-5 py-3"
    >
      <a href="#" className="flex items-center gap-2 font-display font-extrabold text-lg">
        <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[image:var(--gradient-brand)] text-white shadow-glow">
          <Sparkles className="h-5 w-5" />
        </span>
        Recallly
      </a>
      <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground">
        <a href="#features" className="hover:text-foreground transition">Features</a>
        <a href="#how" className="hover:text-foreground transition">How it works</a>
        <a href="#tutor" className="hover:text-foreground transition">AI Tutor</a>
        <a href="#analytics" className="hover:text-foreground transition">Analytics</a>
      </nav>
      <div className="flex items-center gap-2">
        <a href="/auth" className="hidden sm:inline-flex px-4 py-2 rounded-2xl text-sm font-semibold text-foreground/80 hover:bg-white/60 transition">
          Log in
        </a>
        <a href="/auth" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold text-white bg-[image:var(--gradient-brand)] shadow-soft hover:shadow-glow transition-all hover:-translate-y-0.5">
          Get started <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </motion.header>
  );
}

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);

  return (
    <section ref={ref} className="relative mx-auto w-[min(1200px,94%)] pt-20 pb-28 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-semibold text-grape"
      >
        <Sparkles className="h-3.5 w-3.5" /> AI-native study companion for Gen Z
      </motion.div>

      <motion.h1
        variants={fadeUp} initial="hidden" animate="show"
        className="mt-6 font-display text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight"
      >
        Turn lectures into <br className="hidden md:block" />
        <span className="gradient-text">instant understanding.</span>
      </motion.h1>

      <motion.p
        variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }}
        className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
      >
        Upload notes, videos, or PDFs and let Recallly generate summaries, quizzes,
        flashcards, and revision plans — instantly.
      </motion.p>

      <motion.div
        variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }}
        className="mt-8 flex flex-wrap items-center justify-center gap-3"
      >
        <button className="group inline-flex items-center gap-2 rounded-2xl bg-[image:var(--gradient-brand)] px-6 py-3.5 text-sm font-semibold text-white shadow-float hover:shadow-glow transition-all hover:-translate-y-0.5">
          Get Started <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </button>
        <button className="inline-flex items-center gap-2 rounded-2xl glass px-6 py-3.5 text-sm font-semibold text-foreground hover:bg-white/80 transition">
          <Play className="h-4 w-4 fill-current" /> Watch demo
        </button>
      </motion.div>

      {/* Floating hero dashboard */}
      <motion.div style={{ y }} className="relative mx-auto mt-20 max-w-5xl">
        <FloatingWidget icon={<Flame className="h-4 w-4" />} label="12-day streak" sub="Keep it up!"
          className="absolute -left-4 md:-left-10 top-10 bg-coral/20 text-coral" delay={0.3} />
        <FloatingWidget icon={<Trophy className="h-4 w-4" />} label="+340 XP" sub="Quiz mastered"
          className="absolute -right-4 md:-right-8 top-20 bg-sunny/30 text-[oklch(0.5_0.15_70)]" delay={0.5} />
        <FloatingWidget icon={<Brain className="h-4 w-4" />} label="92% recall" sub="Biology • Cell"
          className="absolute -left-6 bottom-16 bg-mint/30 text-[oklch(0.45_0.12_165)]" delay={0.7} />
        <FloatingWidget icon={<MessageSquareText className="h-4 w-4" />} label="AI Tutor" sub="Explain like a friend"
          className="absolute -right-2 md:right-6 bottom-24 bg-sky/30 text-[oklch(0.4_0.14_245)]" delay={0.9} />

        <motion.div
          initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="relative rounded-[2.5rem] glass-strong p-3 shadow-float"
        >
          <div className="absolute -inset-1 -z-10 rounded-[2.7rem] bg-[image:var(--gradient-aurora)] opacity-40 blur-2xl animate-glow" />
          <img
            src={heroDashboard} alt="Recallly dashboard preview"
            width={1536} height={1152}
            className="rounded-[2rem] w-full h-auto"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

function FloatingWidget({ icon, label, sub, className = "", delay = 0 }: {
  icon: React.ReactNode; label: string; sub: string; className?: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 120, damping: 14 }}
      className={`hidden md:flex z-10 items-center gap-3 rounded-2xl glass-strong px-4 py-3 animate-float ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/70">{icon}</span>
      <div className="text-left">
        <div className="text-sm font-bold text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
    </motion.div>
  );
}

function LogoStrip() {
  const items = ["Stanford", "MIT", "Cambridge", "IIT", "NUS", "ETH", "Oxford"];
  return (
    <section className="mx-auto w-[min(1200px,94%)] py-10">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Loved by 120k+ students from
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-2xl font-display font-bold text-foreground/40">
        {items.map((i) => <span key={i} className="hover:text-foreground/70 transition">{i}</span>)}
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: FileText, color: "bg-grape/15 text-grape", title: "PDF & Notes", desc: "Drop a PDF or scanned notes. Get instant summaries, key points, and Q&A." },
  { icon: YoutubeIcon, color: "bg-coral/20 text-coral", title: "YouTube → Notes", desc: "Paste any video link. Recallly extracts chapters, notes, and quizzes." },
  { icon: Layers, color: "bg-sky/25 text-[oklch(0.4_0.14_245)]", title: "Smart Flashcards", desc: "Auto-generated, spaced-repetition cards with swipe & flip animations." },
  { icon: Brain, color: "bg-mint/25 text-[oklch(0.4_0.12_165)]", title: "AI Tutor", desc: "Ask anything. Get answers in Hinglish, plain English, or exam-style." },
  { icon: BarChart3, color: "bg-sunny/30 text-[oklch(0.45_0.14_70)]", title: "Study Analytics", desc: "Track time, weak topics, streaks and confidence — beautifully visualized." },
  { icon: Calendar, color: "bg-accent text-accent-foreground", title: "Revision Planner", desc: "AI builds a calendar around your exam dates, syllabus and free time." },
];

function Features() {
  return (
    <section id="features" className="relative mx-auto w-[min(1200px,94%)] py-24">
      <SectionHeader
        eyebrow="Everything you need"
        title={<>One platform. <span className="gradient-text">Every study superpower.</span></>}
        sub="Built for the way real students learn — fast, visual, and a little bit addictive."
      />
      <motion.div
        initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {FEATURES.map((f) => (
          <motion.div
            key={f.title}
            variants={fadeUp}
            whileHover={{ y: -6, rotate: -0.3 }}
            className="group relative rounded-3xl glass p-6 transition-shadow hover:shadow-float"
          >
            <div className={`grid h-12 w-12 place-items-center rounded-2xl ${f.color}`}>
              <f.icon className="h-6 w-6" />
            </div>
            <h3 className="mt-5 font-display text-xl font-bold">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            <div className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition" style={{ background: "radial-gradient(400px at var(--x,50%) var(--y,50%), oklch(0.7 0.2 295 / 0.08), transparent 60%)" }} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

function SectionHeader({ eyebrow, title, sub }: { eyebrow: string; title: React.ReactNode; sub: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ duration: 0.5 }}
      className="mx-auto max-w-2xl text-center"
    >
      <span className="inline-flex rounded-full glass px-3 py-1 text-xs font-semibold uppercase tracking-wider text-grape">{eyebrow}</span>
      <h2 className="mt-4 font-display text-4xl md:text-5xl font-extrabold leading-tight">{title}</h2>
      <p className="mt-4 text-muted-foreground">{sub}</p>
    </motion.div>
  );
}

const STEPS = [
  { icon: Upload, title: "Upload anything", desc: "PDFs, slides, photos of notes, or a YouTube link." },
  { icon: Wand2, title: "AI does the magic", desc: "Summaries, flashcards, and quizzes generated in seconds." },
  { icon: GraduationCap, title: "Master & track", desc: "Study, revise, and watch your confidence climb." },
];

function HowItWorks() {
  return (
    <section id="how" className="relative mx-auto w-[min(1200px,94%)] py-24">
      <SectionHeader
        eyebrow="How Recallly works"
        title={<>From chaos to <span className="gradient-text">clarity in 3 steps.</span></>}
        sub="No setup. No clutter. Just upload and learn."
      />
      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.12 }}
            className="relative rounded-3xl glass-strong p-7"
          >
            <div className="absolute -top-4 -left-4 grid h-12 w-12 place-items-center rounded-2xl bg-[image:var(--gradient-brand)] text-white font-display font-extrabold shadow-glow">
              {i + 1}
            </div>
            <s.icon className="h-8 w-8 text-grape" />
            <h3 className="mt-5 font-display text-xl font-bold">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function TutorShowcase() {
  return (
    <section id="tutor" className="relative mx-auto w-[min(1200px,94%)] py-24">
      <div className="grid items-center gap-12 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
        >
          <span className="inline-flex rounded-full glass px-3 py-1 text-xs font-semibold uppercase tracking-wider text-grape">AI Tutor</span>
          <h2 className="mt-4 font-display text-4xl md:text-5xl font-extrabold leading-tight">
            Like a brilliant friend, <br/><span className="gradient-text">awake at 3am.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Ask anything. Get explanations that actually click — in plain English,
            Hinglish, or "explain like I'm cramming." Examples, analogies, formulas, on demand.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {["Hinglish & multilingual support", "Step-by-step problem solving", "Smart suggestions while you type", "Source-aware from your uploads"].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-mint/30 text-[oklch(0.4_0.12_165)]"><Zap className="h-3.5 w-3.5" /></span>
                {t}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="relative rounded-[2rem] glass-strong p-5"
        >
          <div className="absolute -inset-1 -z-10 rounded-[2.2rem] bg-[image:var(--gradient-aurora)] opacity-30 blur-2xl" />
          <div className="space-y-4">
            <ChatBubble role="user">Explain photosynthesis like I have 1 hour before my exam 😩</ChatBubble>
            <ChatBubble role="ai">
              Got you. Plants are basically solar-powered chefs 🍳:
              <br/>• <b>Sunlight</b> hits chlorophyll (green pigment)
              <br/>• <b>CO₂ + H₂O</b> get cooked into <b>glucose + O₂</b>
              <br/>• Happens in <b>chloroplasts</b> — light reactions then Calvin cycle.
            </ChatBubble>
            <ChatBubble role="user">Give me 3 likely exam questions</ChatBubble>
          </div>
          <div className="mt-5 flex items-center gap-2 rounded-2xl glass px-4 py-3">
            <MessageSquareText className="h-4 w-4 text-grape" />
            <span className="text-sm text-muted-foreground flex-1">Ask Recallly anything…</span>
            <button className="grid h-9 w-9 place-items-center rounded-xl bg-[image:var(--gradient-brand)] text-white shadow-soft">
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ChatBubble({ role, children }: { role: "user" | "ai"; children: React.ReactNode }) {
  const isUser = role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser ? "bg-[image:var(--gradient-brand)] text-white rounded-br-md" : "glass rounded-bl-md"
      }`}>{children}</div>
    </motion.div>
  );
}

function AnalyticsPreview() {
  const bars = [40, 65, 50, 80, 72, 90, 60];
  return (
    <section id="analytics" className="relative mx-auto w-[min(1200px,94%)] py-24">
      <SectionHeader
        eyebrow="Study Analytics"
        title={<>See your progress <span className="gradient-text">like never before.</span></>}
        sub="Beautiful, motivating insights that actually change behavior."
      />
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
          className="md:col-span-2 rounded-3xl glass-strong p-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Weekly study time</p>
              <p className="font-display text-3xl font-extrabold mt-1">14h 32m <span className="text-sm font-medium text-mint">↑ 18%</span></p>
            </div>
            <Target className="h-6 w-6 text-grape" />
          </div>
          <div className="mt-8 flex h-44 items-end gap-3">
            {bars.map((h, i) => (
              <motion.div key={i}
                initial={{height:0}} whileInView={{height:`${h}%`}} viewport={{once:true}}
                transition={{delay:i*0.08, type:"spring", stiffness:80, damping:14}}
                className="flex-1 rounded-2xl bg-[image:var(--gradient-brand)] opacity-90"
              />
            ))}
          </div>
          <div className="mt-3 grid grid-cols-7 text-center text-xs text-muted-foreground font-medium">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => <span key={d}>{d}</span>)}
          </div>
        </motion.div>

        <div className="grid gap-6">
          <StatCard icon={<Flame className="h-5 w-5"/>} tint="bg-coral/20 text-coral" label="Current streak" value="12 days" />
          <StatCard icon={<Brain className="h-5 w-5"/>} tint="bg-mint/30 text-[oklch(0.4_0.12_165)]" label="Avg. recall" value="89%" />
          <StatCard icon={<BookOpen className="h-5 w-5"/>} tint="bg-sky/30 text-[oklch(0.4_0.14_245)]" label="Topics mastered" value="47" />
        </div>
      </div>
    </section>
  );
}

function StatCard({ icon, tint, label, value }: { icon: React.ReactNode; tint: string; label: string; value: string }) {
  return (
    <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
      whileHover={{ y: -4 }}
      className="rounded-3xl glass p-5 flex items-center gap-4">
      <span className={`grid h-12 w-12 place-items-center rounded-2xl ${tint}`}>{icon}</span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="font-display text-2xl font-extrabold">{value}</p>
      </div>
    </motion.div>
  );
}

const TESTIMONIALS = [
  { name: "Aanya R.", role: "Pre-med, Mumbai", quote: "I went from panic-studying to actually understanding bio. The flashcards are dangerously addictive.", color: "bg-coral/15" },
  { name: "Kai M.", role: "CS @ NUS", quote: "Pasted a 90-min lecture YouTube link. Got better notes than I'd ever write myself.", color: "bg-sky/20" },
  { name: "Sofía L.", role: "Law student", quote: "The AI Tutor explains cases like a friend. My grades jumped a full letter.", color: "bg-mint/25" },
  { name: "Daniel K.", role: "High school senior", quote: "Night Before Exam mode saved my chemistry final. No cap.", color: "bg-sunny/30" },
];

function Testimonials() {
  return (
    <section className="relative mx-auto w-[min(1200px,94%)] py-24">
      <SectionHeader
        eyebrow="Loved by students"
        title={<>Real students. <span className="gradient-text">Real glow-ups.</span></>}
        sub="Over 120,000 students study with Recallly every week."
      />
      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {TESTIMONIALS.map((t, i) => (
          <motion.div key={t.name}
            initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
            transition={{delay: i*0.08}}
            whileHover={{ y: -6, rotate: i % 2 ? 0.6 : -0.6 }}
            className={`rounded-3xl glass-strong p-6`}>
            <div className={`inline-grid h-10 w-10 place-items-center rounded-2xl ${t.color} font-display font-bold`}>
              {t.name[0]}
            </div>
            <p className="mt-4 text-sm leading-relaxed">"{t.quote}"</p>
            <div className="mt-4 text-xs">
              <div className="font-bold">{t.name}</div>
              <div className="text-muted-foreground">{t.role}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function NightBeforeExam() {
  return (
    <section className="relative mx-auto w-[min(1200px,94%)] py-20">
      <motion.div
        initial={{opacity:0, scale:0.95}} whileInView={{opacity:1, scale:1}} viewport={{once:true}}
        className="relative overflow-hidden rounded-[2.5rem] p-10 md:p-14"
        style={{ background: "linear-gradient(135deg, oklch(0.32 0.12 285), oklch(0.38 0.16 305), oklch(0.45 0.18 25))" }}
      >
        <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-coral/40 blur-3xl animate-blob" />
        <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-sky/40 blur-3xl animate-blob" style={{animationDelay:"-8s"}}/>
        <div className="relative grid items-center gap-8 md:grid-cols-2 text-white">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              <MoonStar className="h-3.5 w-3.5" /> Emergency mode
            </span>
            <h2 className="mt-4 font-display text-4xl md:text-5xl font-extrabold leading-tight">
              Night Before Exam.
            </h2>
            <p className="mt-4 text-white/80 max-w-md">
              One tap. Recallly generates a crash revision: top topics, likely questions,
              quick formulas, and a 60-minute sprint plan.
            </p>
            <button className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-grape shadow-glow hover:-translate-y-0.5 transition">
              Activate Crash Mode <Flame className="h-4 w-4" />
            </button>
          </div>
          <div className="relative">
            <motion.div
              animate={{ rotate: [0, 4, -3, 0], y: [0, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
              className="ml-auto grid h-56 w-56 md:h-72 md:w-72 place-items-center rounded-full bg-white/10 backdrop-blur-xl border border-white/20"
            >
              <div className="grid h-40 w-40 md:h-52 md:w-52 place-items-center rounded-full bg-[image:var(--gradient-brand)] shadow-glow">
                <Flame className="h-20 w-20 text-white drop-shadow-lg" />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function CTA() {
  return (
    <section className="relative mx-auto w-[min(1100px,94%)] py-24 text-center">
      <motion.div
        initial={{opacity:0, y:30}} whileInView={{opacity:1, y:0}} viewport={{once:true}}
        className="relative rounded-[2.5rem] glass-strong p-12 md:p-16 overflow-hidden"
      >
        <div className="absolute -inset-1 -z-10 rounded-[2.7rem] bg-[image:var(--gradient-aurora)] opacity-40 blur-2xl animate-glow" />
        <h2 className="font-display text-4xl md:text-6xl font-extrabold leading-tight">
          Your smartest <span className="gradient-text">semester starts now.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
          Join 120,000+ students turning panic into confidence. Free to start. No card required.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-2xl bg-[image:var(--gradient-brand)] px-7 py-4 text-sm font-bold text-white shadow-float hover:shadow-glow transition-all hover:-translate-y-0.5">
            Get started free <ArrowRight className="h-4 w-4" />
          </button>
          <button className="inline-flex items-center gap-2 rounded-2xl glass px-7 py-4 text-sm font-bold hover:bg-white/80 transition">
            Talk to us
          </button>
        </div>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative mx-auto w-[min(1200px,94%)] pb-12 pt-8 text-sm text-muted-foreground">
      <div className="rounded-3xl glass p-8 grid gap-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 font-display font-extrabold text-foreground text-lg">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[image:var(--gradient-brand)] text-white">
              <Sparkles className="h-5 w-5" />
            </span>
            Recallly
          </div>
          <p className="mt-3 max-w-sm">Study smarter. Recall faster. The AI study companion built for the way Gen Z actually learns.</p>
        </div>
        <FooterCol title="Product" items={["Features","AI Tutor","Flashcards","Pricing"]} />
        <FooterCol title="Company" items={["About","Blog","Careers","Contact"]} />
      </div>
      <p className="mt-6 text-center text-xs">© {new Date().getFullYear()} Recallly. Crafted with ☕ & curiosity.</p>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="font-display font-bold text-foreground">{title}</h4>
      <ul className="mt-3 space-y-2">
        {items.map(i => <li key={i}><a href="#" className="hover:text-foreground transition">{i}</a></li>)}
      </ul>
    </div>
  );
}
