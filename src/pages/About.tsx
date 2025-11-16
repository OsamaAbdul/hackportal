import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Code2, Zap, Shield, Users } from "lucide-react";

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-bold">
            About <span className="text-primary">HackPortal</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            The modern platform built for hackathon organizers and participants
          </p>
        </div>

        <Card className="mb-8 p-8">
          <h2 className="mb-4 text-2xl font-bold">Our Mission</h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            HackPortal was created to streamline the hackathon experience for organizers. We believe 
            that managing hackathons should be simple, efficient, and enjoyable. Participants can submit 
            their projects via shareable links without needing to create accounts.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            Built with modern web technologies and designed for developers, HackPortal provides a sleek, 
            intuitive interface with powerful features for event management and AI-powered submission analysis.
          </p>
        </Card>

        <div className="mb-12">
          <h2 className="mb-6 text-center text-2xl font-bold">Why HackPortal?</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Code2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-bold">Developer-First</h3>
              <p className="text-sm text-muted-foreground">
                Built by developers, for developers. Every feature is designed with the developer
                experience in mind.
              </p>
            </Card>

            <Card className="p-6">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                <Zap className="h-6 w-6 text-success" />
              </div>
              <h3 className="mb-2 font-bold">Lightning Fast</h3>
              <p className="text-sm text-muted-foreground">
                Modern architecture ensures quick load times and smooth interactions throughout the
                platform.
              </p>
            </Card>

            <Card className="p-6">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
                <Shield className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="mb-2 font-bold">Secure & Reliable</h3>
              <p className="text-sm text-muted-foreground">
                Built on robust infrastructure with Google authentication to keep your data safe and
                secure.
              </p>
            </Card>

            <Card className="p-6">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mb-2 font-bold">Community Focused</h3>
              <p className="text-sm text-muted-foreground">
                Perfect for GDG chapters, university hackathons, and developer communities worldwide.
              </p>
            </Card>
          </div>
        </div>

        <Card className="p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold">Ready to Transform Your Hackathon?</h2>
          <p className="mb-6 text-muted-foreground">
            Join the growing community of organizers and participants using HackPortal
          </p>
          <Button size="lg" onClick={() => navigate("/auth")}>
            Get Started Now
          </Button>
        </Card>
      </main>
    </div>
  );
};

export default About;
