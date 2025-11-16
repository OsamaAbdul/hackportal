import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileUp, Send } from "lucide-react";
import { toast } from "sonner";

const SubmitProject = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [hackathon, setHackathon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pitchFile, setPitchFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    teamName: "",
    projectTitle: "",
    description: "",
    githubLink: "",
    demoLink: "",
    members: "",
  });

  useEffect(() => {
    loadHackathon();
  }, [slug]);

  const loadHackathon = async () => {
    try {
      const { data, error } = await supabase
        .from("hackathons")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;

      if (!data) {
        toast.error("Hackathon not found");
        navigate("/");
        return;
      }

      setHackathon(data);
    } catch (error) {
      console.error("Load hackathon error:", error);
      toast.error("Failed to load hackathon");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ];
      
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload a PDF or PPTX file");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      setPitchFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hackathon) return;

    try {
      setSubmitting(true);

      let pitchFileUrl = null;

      // Upload pitch file if provided
      if (pitchFile) {
        const fileExt = pitchFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${hackathon.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("pitch-files")
          .upload(filePath, pitchFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("pitch-files")
          .getPublicUrl(filePath);

        pitchFileUrl = publicUrl;
      }

      // Parse members JSON
      let membersArray = [];
      if (formData.members) {
        try {
          membersArray = JSON.parse(formData.members);
        } catch {
          membersArray = formData.members.split(",").map((m: string) => m.trim());
        }
      }

      // Create submission (user_id is null for anonymous submissions)
      const { error: submissionError } = await supabase
        .from("submissions")
        .insert({
          hackathon_id: hackathon.id,
          user_id: null,
          team_name: formData.teamName,
          project_title: formData.projectTitle,
          description: formData.description,
          github_link: formData.githubLink || null,
          demo_link: formData.demoLink || null,
          pitch_file_url: pitchFileUrl,
          members: membersArray,
        });

      if (submissionError) throw submissionError;

      toast.success("Project submitted successfully!");
      
      // Reset form
      setFormData({
        teamName: "",
        projectTitle: "",
        description: "",
        githubLink: "",
        demoLink: "",
        members: "",
      });
      setPitchFile(null);
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(error.message || "Failed to submit project");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!hackathon) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 text-center">
          <h1 className="mb-2 text-3xl font-bold">
            <span className="text-primary">Hack</span>Portal
          </h1>
          <p className="text-muted-foreground">Submit Your Project</p>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-8">
        <Card className="mb-8 p-6">
          <h2 className="mb-2 text-2xl font-bold">{hackathon.name}</h2>
          {hackathon.description && (
            <p className="text-muted-foreground">{hackathon.description}</p>
          )}
          <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
            <span>
              Starts: {new Date(hackathon.start_date).toLocaleDateString()}
            </span>
            <span>
              Ends: {new Date(hackathon.end_date).toLocaleDateString()}
            </span>
          </div>
        </Card>

        <Card className="p-8">
          <h3 className="mb-6 text-xl font-bold">Project Submission Form</h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="teamName">Team Name *</Label>
              <Input
                id="teamName"
                value={formData.teamName}
                onChange={(e) =>
                  setFormData({ ...formData, teamName: e.target.value })
                }
                placeholder="The Innovators"
                required
              />
            </div>

            <div>
              <Label htmlFor="projectTitle">Project Title *</Label>
              <Input
                id="projectTitle"
                value={formData.projectTitle}
                onChange={(e) =>
                  setFormData({ ...formData, projectTitle: e.target.value })
                }
                placeholder="Revolutionary AI Solution"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Project Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe your project, its purpose, and impact..."
                rows={6}
                required
              />
            </div>

            <div>
              <Label htmlFor="githubLink">GitHub Repository Link</Label>
              <Input
                id="githubLink"
                type="url"
                value={formData.githubLink}
                onChange={(e) =>
                  setFormData({ ...formData, githubLink: e.target.value })
                }
                placeholder="https://github.com/username/repo"
              />
            </div>

            <div>
              <Label htmlFor="demoLink">Demo/Live Link</Label>
              <Input
                id="demoLink"
                type="url"
                value={formData.demoLink}
                onChange={(e) =>
                  setFormData({ ...formData, demoLink: e.target.value })
                }
                placeholder="https://demo.yourproject.com"
              />
            </div>

            <div>
              <Label htmlFor="pitchFile">Pitch Deck (PDF or PPTX)</Label>
              <div className="mt-2">
                <label
                  htmlFor="pitchFile"
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-border p-6 transition-colors hover:border-primary"
                >
                  <FileUp className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {pitchFile ? pitchFile.name : "Click to upload pitch deck (Max 10MB)"}
                  </span>
                </label>
                <input
                  id="pitchFile"
                  type="file"
                  accept=".pdf,.pptx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Upload your pitch deck in PDF or PowerPoint format
              </p>
            </div>

            <div>
              <Label htmlFor="members">Team Members (comma-separated)</Label>
              <Textarea
                id="members"
                value={formData.members}
                onChange={(e) =>
                  setFormData({ ...formData, members: e.target.value })
                }
                placeholder="John Doe, Jane Smith, Bob Johnson"
                rows={3}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                List all team members separated by commas
              </p>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              <Send className="mr-2 h-5 w-5" />
              {submitting ? "Submitting..." : "Submit Project"}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default SubmitProject;
