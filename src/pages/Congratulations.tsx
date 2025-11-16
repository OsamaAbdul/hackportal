import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Confetti from "react-confetti";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

const CongratulationsPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary/5 to-background px-4">
      <Confetti width={window.innerWidth} height={window.innerHeight} />

      <Card className="mx-auto w-full max-w-lg p-10 text-center shadow-xl border-primary/20">
        <div className="flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-primary" />
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight">
          🎉 Congratulations!
        </h1>

        <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
          Your project has been successfully submitted to the{" "}
          <strong>{slug}</strong> hackathon.
          We’re rooting for you — best of luck! 🚀
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Button
            className="w-full"
            onClick={() => navigate(`/hackathon/${slug}`)}
          >
            View Hackathon
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/")}
          >
            Go to Home
          </Button>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => navigate(`/submit/${slug}`)}
          >
            Submit Another Project
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default CongratulationsPage;
