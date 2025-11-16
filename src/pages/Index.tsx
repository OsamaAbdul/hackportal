import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, Users, Zap, Sparkles, CheckCircle } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-4 text-6xl font-bold tracking-tight">
            <span className="text-primary">Hack</span>Portal
          </h1>
          <p className="mb-2 text-xl text-muted-foreground">
            Built for Developers
          </p>
          <p className="mb-8 text-lg text-muted-foreground">
            The modern platform for hackathon submissions and judging
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/about")}>
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold">
          Everything You Need
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          <Card className="p-8 text-center transition-all hover:shadow-lg">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-bold">For Organizers</h3>
            <p className="text-muted-foreground">
              Create hackathons, manage submissions, and coordinate your event with ease
            </p>
          </Card>

          <Card className="p-8 text-center transition-all hover:shadow-lg">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <Zap className="h-8 w-8 text-success" />
            </div>
            <h3 className="mb-2 text-xl font-bold">Lightning Fast</h3>
            <p className="text-muted-foreground">
              Modern, responsive design built with the latest web technologies
            </p>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold">How It Works</h2>
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              1
            </div>
            <div>
              <h3 className="mb-1 text-lg font-bold">Sign in with Google</h3>
              <p className="text-muted-foreground">
                Quick and secure authentication using your Google account
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              1
            </div>
            <div>
              <h3 className="mb-1 text-lg font-bold">Sign Up as Organizer</h3>
              <p className="text-muted-foreground">
                Create your account to start managing hackathons
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              2
            </div>
            <div>
              <h3 className="mb-1 text-lg font-bold">Create Your Hackathon</h3>
              <p className="text-muted-foreground">
                Set up your event with dates, description, and requirements
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              3
            </div>
            <div>
              <h3 className="mb-1 text-lg font-bold">Share Submission Link</h3>
              <p className="text-muted-foreground">
                Get a unique link to share with participants for project submissions
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              4
            </div>
            <div>
              <h3 className="mb-1 text-lg font-bold">Review & Analyze</h3>
              <p className="text-muted-foreground">
                View all submissions with AI-powered analysis and scoring
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-block rounded-full bg-accent/20 px-4 py-2 text-sm font-semibold text-accent">
            Coming Soon
          </div>
          <h2 className="mb-4 text-3xl font-bold">AI-Powered Features</h2>
          <p className="mb-12 text-muted-foreground">
            Powered by Google's Gemini AI to enhance your hackathon experience
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6 opacity-75">
              <Sparkles className="mb-3 h-8 w-8 text-accent" />
              <h3 className="mb-2 font-bold">AI Judge Assistant</h3>
              <p className="text-sm text-muted-foreground">
                Get intelligent insights and scoring suggestions
              </p>
            </Card>
            <Card className="p-6 opacity-75">
              <CheckCircle className="mb-3 h-8 w-8 text-success" />
              <h3 className="mb-2 font-bold">Project Summarizer</h3>
              <p className="text-sm text-muted-foreground">
                Automatic summaries of project submissions
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-3xl font-bold">Ready to Get Started?</h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Join HackPortal today and experience the future of hackathon management
          </p>
          <Button size="lg" onClick={() => navigate("/auth")}>
            Sign In with Google
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Perfect for GDG hackathons and developer events</p>
          <p className="mt-2">© 2025 HackPortal. Built with ❤️ for developers.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
