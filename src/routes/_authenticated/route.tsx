import { createFileRoute, Outlet, redirect, Link, useRouterState, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile } from "@/lib/profile.functions";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
  SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";
import { Home, Upload, Layers, Trophy, Flame, LogOut, Sparkles, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedShell,
});

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "New Upload", url: "/upload", icon: Upload },
  { title: "My Decks", url: "/decks", icon: Layers },
];

function AppSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const fetchProfile = useServerFn(getMyProfile);
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchProfile(),
  });
  const router = useRouter();
  const qc = useQueryClient();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }
  const initial = (profile?.display_name ?? "R").slice(0, 1).toUpperCase();
  return (
    <Sidebar collapsible="icon" className="border-r border-border/40 bg-card/40 backdrop-blur-xl">
      <SidebarHeader className="px-4 py-5">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="size-9 rounded-2xl bg-gradient-to-br from-grape via-lavender to-sky flex items-center justify-center shadow-lg">
            <Sparkles className="size-5 text-white" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display font-bold text-lg gradient-text">Recallly</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Study OS</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((it) => (
                <SidebarMenuItem key={it.url}>
                  <SidebarMenuButton asChild isActive={path.startsWith(it.url)}>
                    <Link to={it.url} className="flex items-center gap-2">
                      <it.icon className="size-4" />
                      <span>{it.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Stats</SidebarGroupLabel>
          <SidebarGroupContent className="px-2 space-y-2">
            <div className="rounded-2xl p-3 bg-gradient-to-br from-coral/15 to-sunny/15 border border-coral/20">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Flame className="size-3.5 text-coral" /> Streak</div>
              <div className="font-display text-2xl font-bold">{profile?.current_streak ?? 0} <span className="text-xs font-normal text-muted-foreground">days</span></div>
            </div>
            <div className="rounded-2xl p-3 bg-gradient-to-br from-mint/15 to-sky/15 border border-mint/20">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Trophy className="size-3.5 text-mint" /> XP</div>
              <div className="font-display text-2xl font-bold">{profile?.xp ?? 0}</div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="flex items-center gap-2 rounded-2xl p-2 bg-muted/40">
          <Avatar className="size-9">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-gradient-to-br from-grape to-lavender text-white">{initial}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{profile?.display_name ?? "Student"}</div>
            <div className="text-xs text-muted-foreground">Level {profile?.level ?? 1}</div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut} title="Sign out"><LogOut className="size-4" /></Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function AuthedShell() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full mesh-bg">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border/40 flex items-center px-3 gap-2 bg-background/40 backdrop-blur-xl">
            <SidebarTrigger />
            <span className="text-sm text-muted-foreground">Welcome back ✨</span>
          </header>
          <main className="flex-1 overflow-auto"><Outlet /></main>
        </div>
      </div>
    </SidebarProvider>
  );
}
