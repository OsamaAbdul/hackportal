import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, LogOut, Sparkles, BarChart3, Users, Zap } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setProfile(profileData);

      // Load hackathons for organizers
      const { data: hackathonsData } = await supabase
        .from("hackathons")
        .select("*")
        .eq("organizer_id", session.user.id)
        .order("created_at", { ascending: false });

      setHackathons(hackathonsData || []);
    } catch (error) {
      console.error("Dashboard load error:", error);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold">
            <span className="text-primary">Hack</span>Portal
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{profile?.name}</span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div>
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">My Hackathons</h2>
                <p className="text-muted-foreground">Manage your events and view submissions</p>
              </div>
              <Button onClick={() => navigate("/create-hackathon")} size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Create Hackathon
              </Button>
            </div>

            {hackathons.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <Plus className="h-10 w-10 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-bold">No hackathons yet</h3>
                <p className="mb-6 text-muted-foreground">Create your first hackathon to get started</p>
                <Button onClick={() => navigate("/create-hackathon")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Hackathon
                </Button>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {hackathons.map((hackathon) => (
                  <Card
                    key={hackathon.id}
                    className="cursor-pointer p-6 transition-all hover:shadow-lg"
                    onClick={() => navigate(`/hackathon/${hackathon.slug}`)}
                  >
                    <h3 className="mb-2 text-xl font-bold">{hackathon.name}</h3>
                    <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                      {hackathon.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{new Date(hackathon.start_date).toLocaleDateString()}</span>
                      <Button variant="link" className="h-auto p-0 text-primary">
                        View Details →
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <div className="mt-12">
              <h3 className="mb-4 text-2xl font-bold">Coming Soon</h3>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="p-6 opacity-60">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
                    <Sparkles className="h-6 w-6 text-accent" />
                  </div>
                  <h4 className="mb-2 font-bold">AI Judge Assistant</h4>
                  <p className="text-xs text-muted-foreground">Powered by Gemini</p>
                </Card>
                <Card className="p-6 opacity-60">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/20">
                    <BarChart3 className="h-6 w-6 text-success" />
                  </div>
                  <h4 className="mb-2 font-bold">Analytics Dashboard</h4>
                  <p className="text-xs text-muted-foreground">Track engagement</p>
                </Card>
                <Card className="p-6 opacity-60">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="mb-2 font-bold">Team Management</h4>
                  <p className="text-xs text-muted-foreground">Collaborate easily</p>
                </Card>
                <Card className="p-6 opacity-60">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/20">
                    <Zap className="h-6 w-6 text-secondary" />
                  </div>
                  <h4 className="mb-2 font-bold">Auto Scoring</h4>
                  <p className="text-xs text-muted-foreground">Smart judging</p>
                </Card>
              </div>
            </div>
          </div>
      </main>
    </div>
  );
};

export default Dashboard;
