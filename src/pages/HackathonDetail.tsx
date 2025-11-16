import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Hackathon {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  organizer_id: string;
}

interface Submission {
  id: string;
  team_name: string;
  project_title: string;
  description: string;
  github_link: string | null;
  demo_link: string | null;
  created_at: string;
  ai_analysis: any;
  user_id: string;
  pitch_file_url: string | null;
}

interface SubmissionWithUser extends Submission {
  profiles: {
    name: string;
    email: string;
  };
}

const HackathonDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<SubmissionWithUser[]>([]);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [hasExistingSubmission, setHasExistingSubmission] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  
  // Auth form state
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  
  // Submission form state
  const [submissionForm, setSubmissionForm] = useState({
    team_name: "",
    project_title: "",
    description: "",
    github_link: "",
    demo_link: "",
  });
  const [pitchFile, setPitchFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadHackathon();
    checkUser();
  }, [slug]);

  useEffect(() => {
    if (user && hackathon) {
      const organizer = user.id === hackathon.organizer_id;
      setIsOrganizer(organizer);
      
      if (organizer) {
        loadAllSubmissions();
      } else {
        loadSubmissions();
        checkExistingSubmission();
      }
    }
  }, [user, hackathon]);

  const loadHackathon = async () => {
    try {
      const { data, error } = await supabase
        .from("hackathons")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;
      setHackathon(data);
    } catch (error: any) {
      console.error("Error loading hackathon:", error);
      toast({
        title: "Error",
        description: "Hackathon not found",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const loadSubmissions = async () => {
    if (!user || !hackathon) return;

    try {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("hackathon_id", hackathon.id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error("Error loading submissions:", error);
    }
  };

  const loadAllSubmissions = async () => {
    if (!hackathon) return;

    try {
      const { data, error } = await supabase
        .from("submissions")
        .select(`
          *,
          profiles:user_id (
            name,
            email
          )
        `)
        .eq("hackathon_id", hackathon.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAllSubmissions(data || []);
    } catch (error) {
      console.error("Error loading all submissions:", error);
    }
  };

  const checkExistingSubmission = async () => {
    if (!user || !hackathon) return;

    try {
      const { data, error } = await supabase
        .from("submissions")
        .select("id")
        .eq("hackathon_id", hackathon.id)
        .eq("user_id", user.id)
        .single();

      setHasExistingSubmission(!!data);
    } catch (error) {
      setHasExistingSubmission(false);
    }
  };

  const analyzeSubmission = async (
    submissionId: string, 
    github_link: string | null, 
    demo_link: string | null, 
    description: string,
    team_name: string,
    project_title: string,
    pitch_file_url: string | null
  ) => {
    setAnalyzingId(submissionId);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-submission', {
        body: { 
          github_link, 
          demo_link, 
          description,
          team_name,
          project_title,
          pitch_file_url
        }
      });

      if (error) throw error;

      // Update submission with analysis
      const { error: updateError } = await supabase
        .from("submissions")
        .update({ ai_analysis: data })
        .eq("id", submissionId);

      if (updateError) throw updateError;

      toast({
        title: "Analysis Complete",
        description: "AI analysis has been generated for this submission",
      });

      // Reload submissions
      if (isOrganizer) {
        loadAllSubmissions();
      } else {
        loadSubmissions();
      }
    } catch (error: any) {
      console.error("Error analyzing submission:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze submission",
        variant: "destructive",
      });
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.href,
            data: { name, role: "participant" }
          }
        });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Account created! You can now submit your project.",
        });
        
        setUser(data.user);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Logged in successfully!",
        });
        
        setUser(data.user);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !hackathon) return;

    if (hasExistingSubmission) {
      toast({
        title: "Already Submitted",
        description: "You can only submit one project per hackathon",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      let pitchFileUrl = null;

      // Upload pitch file if provided
      if (pitchFile) {
        setUploadingFile(true);
        const fileExt = pitchFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('pitch-files')
          .upload(fileName, pitchFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('pitch-files')
          .getPublicUrl(uploadData.path);
        
        pitchFileUrl = publicUrl;
        setUploadingFile(false);
      }

      const { data: newSubmission, error } = await supabase
        .from("submissions")
        .insert({
          hackathon_id: hackathon.id,
          user_id: user.id,
          team_name: submissionForm.team_name,
          project_title: submissionForm.project_title,
          description: submissionForm.description,
          github_link: submissionForm.github_link || null,
          demo_link: submissionForm.demo_link || null,
          pitch_file_url: pitchFileUrl,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your project has been submitted! Analyzing...",
      });

      setSubmissionForm({
        team_name: "",
        project_title: "",
        description: "",
        github_link: "",
        demo_link: "",
      });
      setPitchFile(null);

      setHasExistingSubmission(true);
      loadSubmissions();

      // Trigger AI analysis
      if (newSubmission) {
        analyzeSubmission(
          newSubmission.id,
          newSubmission.github_link,
          newSubmission.demo_link,
          newSubmission.description,
          newSubmission.team_name,
          newSubmission.project_title,
          newSubmission.pitch_file_url
        );
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
      setUploadingFile(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };

  const handleCopyLink = () => {
    const shareableLink = `${window.location.origin}/submit/${slug}`;
    navigator.clipboard.writeText(shareableLink);
    setLinkCopied(true);
    toast({
      title: "Link copied!",
      description: "Share this link with participants",
    });
    setTimeout(() => setLinkCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hackathon) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">{hackathon.name}</h1>
            <p className="mt-2 text-muted-foreground">
              {new Date(hackathon.start_date).toLocaleDateString()} - {new Date(hackathon.end_date).toLocaleDateString()}
            </p>
          </div>
          {user && (
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          )}
        </div>

        {/* Description */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>About this Hackathon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{hackathon.description}</p>
          </CardContent>
        </Card>

        {/* Organizer View */}
        {isOrganizer ? (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Shareable Link</CardTitle>
                <CardDescription>Share this link with participants to submit their projects</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input 
                    value={`${window.location.origin}/submit/${slug}`}
                    readOnly
                    className="flex-1"
                  />
                  <Button onClick={handleCopyLink}>
                    {linkCopied ? "Copied!" : "Copy Link"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Submissions ({allSubmissions.length})</CardTitle>
                <CardDescription>Review all submitted projects</CardDescription>
              </CardHeader>
              <CardContent>
                {allSubmissions.length === 0 ? (
                  <p className="text-muted-foreground">No submissions yet.</p>
                ) : (
                  <div className="space-y-6">
                    {allSubmissions.map((submission) => (
                      <Card key={submission.id} className="border-2">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-xl">{submission.project_title}</CardTitle>
                              <CardDescription className="mt-1">
                                Team: {submission.team_name} • By {submission.profiles?.name} • {new Date(submission.created_at).toLocaleDateString()}
                              </CardDescription>
                            </div>
                            {!submission.ai_analysis && (
                              <Button
                                size="sm"
                                onClick={() => analyzeSubmission(
                                  submission.id, 
                                  submission.github_link, 
                                  submission.demo_link, 
                                  submission.description,
                                  submission.team_name,
                                  submission.project_title,
                                  submission.pitch_file_url
                                )}
                                disabled={analyzingId === submission.id}
                              >
                                {analyzingId === submission.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Analyze"}
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-muted-foreground">{submission.description}</p>
                          
                          <div className="flex gap-2">
                            {submission.pitch_file_url && (
                              <a href={submission.pitch_file_url} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm">
                                  View Pitch
                                </Button>
                              </a>
                            )}
                            {submission.github_link && (
                              <a href={submission.github_link} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm">
                                  GitHub
                                </Button>
                              </a>
                            )}
                            {submission.demo_link && (
                              <a href={submission.demo_link} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm">
                                  Demo
                                </Button>
                              </a>
                            )}
                          </div>

                          {submission.ai_analysis && (
                            <div className="mt-4 rounded-lg border bg-muted/50 p-4 space-y-3">
                              <h4 className="font-semibold text-sm">AI Analysis</h4>
                              {submission.ai_analysis.analysis && (
                                <div className="space-y-2 text-sm">
                                  {submission.ai_analysis.analysis.final_score && (
                                    <div className="flex gap-4 text-lg font-bold">
                                      <span>Final Score:</span>
                                      <span className="text-primary">{submission.ai_analysis.analysis.final_score}/100</span>
                                    </div>
                                  )}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="flex gap-4">
                                      <span className="font-medium">Innovation:</span>
                                      <span className="text-primary">{submission.ai_analysis.analysis.innovation_score}/10</span>
                                    </div>
                                    <div className="flex gap-4">
                                      <span className="font-medium">Completeness:</span>
                                      <span className="text-primary">{submission.ai_analysis.analysis.completeness_score}/10</span>
                                    </div>
                                    {submission.ai_analysis.analysis.github_activity_score !== undefined && (
                                      <div className="flex gap-4">
                                        <span className="font-medium">GitHub Activity:</span>
                                        <span className="text-primary">{submission.ai_analysis.analysis.github_activity_score}/10</span>
                                      </div>
                                    )}
                                    {submission.ai_analysis.analysis.pitch_quality_score && (
                                      <div className="flex gap-4">
                                        <span className="font-medium">Pitch Quality:</span>
                                        <span className="text-primary">{submission.ai_analysis.analysis.pitch_quality_score}/10</span>
                                      </div>
                                    )}
                                  </div>
                                  {submission.ai_analysis.analysis.strengths && (
                                    <div>
                                      <span className="font-medium">Strengths:</span>
                                      <ul className="ml-4 mt-1 list-disc text-muted-foreground">
                                        {Array.isArray(submission.ai_analysis.analysis.strengths) 
                                          ? submission.ai_analysis.analysis.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)
                                          : <li>{submission.ai_analysis.analysis.strengths}</li>
                                        }
                                      </ul>
                                    </div>
                                  )}
                                  {submission.ai_analysis.analysis.areas_for_improvement && (
                                    <div>
                                      <span className="font-medium">Areas for Improvement:</span>
                                      <ul className="ml-4 mt-1 list-disc text-muted-foreground">
                                        {Array.isArray(submission.ai_analysis.analysis.areas_for_improvement) 
                                          ? submission.ai_analysis.analysis.areas_for_improvement.map((s: string, i: number) => <li key={i}>{s}</li>)
                                          : <li>{submission.ai_analysis.analysis.areas_for_improvement}</li>
                                        }
                                      </ul>
                                    </div>
                                  )}
                                  {submission.ai_analysis.analysis.overall_recommendation && (
                                    <div>
                                      <span className="font-medium">Recommendation:</span>
                                      <p className="mt-1 text-muted-foreground">{submission.ai_analysis.analysis.overall_recommendation}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : !user ? (
          <Card>
            <CardHeader>
              <CardTitle>Register to Submit Your Project</CardTitle>
              <CardDescription>Create an account or login to submit your project</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as "login" | "signup")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  <TabsTrigger value="login">Login</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signup">
                  <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={authLoading}>
                      {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign Up"}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="login">
                  <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={authLoading}>
                      {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Login"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Submission Form */}
            {!hasExistingSubmission && (
              <Card>
                <CardHeader>
                  <CardTitle>Submit Your Project</CardTitle>
                  <CardDescription>Fill in the details of your project (one submission per hackathon)</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="team_name">Team Name</Label>
                      <Input
                        id="team_name"
                        value={submissionForm.team_name}
                        onChange={(e) => setSubmissionForm({ ...submissionForm, team_name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="project_title">Project Title</Label>
                      <Input
                        id="project_title"
                        value={submissionForm.project_title}
                        onChange={(e) => setSubmissionForm({ ...submissionForm, project_title: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={submissionForm.description}
                        onChange={(e) => setSubmissionForm({ ...submissionForm, description: e.target.value })}
                        required
                        rows={5}
                      />
                    </div>
                    <div>
                      <Label htmlFor="github_link">GitHub Repository (Optional)</Label>
                      <Input
                        id="github_link"
                        type="url"
                        placeholder="https://github.com/username/repo"
                        value={submissionForm.github_link}
                        onChange={(e) => setSubmissionForm({ ...submissionForm, github_link: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="demo_link">Demo Link (Optional)</Label>
                      <Input
                        id="demo_link"
                        type="url"
                        placeholder="https://your-demo.com"
                        value={submissionForm.demo_link}
                        onChange={(e) => setSubmissionForm({ ...submissionForm, demo_link: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pitch_file">Pitch Deck (PDF or PPTX, Optional)</Label>
                      <Input
                        id="pitch_file"
                        type="file"
                        accept=".pdf,.pptx,.ppt"
                        onChange={(e) => setPitchFile(e.target.files?.[0] || null)}
                        className="cursor-pointer"
                      />
                      {pitchFile && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Selected: {pitchFile.name} ({(pitchFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                    </div>
                    <Button type="submit" className="w-full" disabled={submitting || uploadingFile}>
                      {uploadingFile ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Project"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* My Submissions */}
            <Card>
              <CardHeader>
                <CardTitle>My Submission</CardTitle>
                <CardDescription>Your submitted project for this hackathon</CardDescription>
              </CardHeader>
              <CardContent>
                {submissions.length === 0 ? (
                  <p className="text-muted-foreground">You haven't submitted a project yet.</p>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((submission) => (
                      <Card key={submission.id} className="border-2">
                        <CardHeader>
                          <CardTitle className="text-lg">{submission.project_title}</CardTitle>
                          <CardDescription>
                            Team: {submission.team_name} • Submitted {new Date(submission.created_at).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-muted-foreground">{submission.description}</p>
                          
                          <div className="flex gap-2">
                            {submission.pitch_file_url && (
                              <a href={submission.pitch_file_url} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm">
                                  View Pitch
                                </Button>
                              </a>
                            )}
                            {submission.github_link && (
                              <a href={submission.github_link} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm">
                                  GitHub
                                </Button>
                              </a>
                            )}
                            {submission.demo_link && (
                              <a href={submission.demo_link} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm">
                                  Demo
                                </Button>
                              </a>
                            )}
                          </div>

                          {submission.ai_analysis && (
                            <div className="mt-4 rounded-lg border bg-muted/50 p-4 space-y-2">
                              <h4 className="font-semibold text-sm">AI Analysis Results</h4>
                              {submission.ai_analysis.analysis && (
                                <div className="space-y-2 text-sm">
                                  {submission.ai_analysis.analysis.final_score && (
                                    <div className="flex gap-4 text-lg font-bold">
                                      <span>Final Score:</span>
                                      <span className="text-primary">{submission.ai_analysis.analysis.final_score}/100</span>
                                    </div>
                                  )}
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="flex gap-4">
                                      <span className="font-medium">Innovation:</span>
                                      <span className="text-primary">{submission.ai_analysis.analysis.innovation_score}/10</span>
                                    </div>
                                    <div className="flex gap-4">
                                      <span className="font-medium">Completeness:</span>
                                      <span className="text-primary">{submission.ai_analysis.analysis.completeness_score}/10</span>
                                    </div>
                                    {submission.ai_analysis.analysis.github_activity_score !== undefined && (
                                      <div className="flex gap-4">
                                        <span className="font-medium">GitHub Activity:</span>
                                        <span className="text-primary">{submission.ai_analysis.analysis.github_activity_score}/10</span>
                                      </div>
                                    )}
                                    {submission.ai_analysis.analysis.pitch_quality_score && (
                                      <div className="flex gap-4">
                                        <span className="font-medium">Pitch Quality:</span>
                                        <span className="text-primary">{submission.ai_analysis.analysis.pitch_quality_score}/10</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default HackathonDetail;
