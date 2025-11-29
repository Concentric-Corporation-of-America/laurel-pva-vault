import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FolderLock, Shield, Database, FileText } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to auth page
    navigate("/auth");
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-accent/20">
      <div className="text-center max-w-2xl px-4">
        <div className="flex justify-center mb-8">
          <div className="p-4 rounded-full bg-primary/10">
            <FolderLock className="h-16 w-16 text-primary" />
          </div>
        </div>
        <h1 className="mb-4 text-4xl font-bold">Laurel County PVA</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Property Valuation Administrator Document Management System
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-lg bg-card border border-border">
            <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold">Secure Access</h3>
            <p className="text-sm text-muted-foreground">Role-based permissions</p>
          </div>
          <div className="p-4 rounded-lg bg-card border border-border">
            <Database className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold">Organized Storage</h3>
            <p className="text-sm text-muted-foreground">12 specialized buckets</p>
          </div>
          <div className="p-4 rounded-lg bg-card border border-border">
            <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold">Compliance Ready</h3>
            <p className="text-sm text-muted-foreground">Federal security standards</p>
          </div>
        </div>
        <Button onClick={() => navigate("/auth")} size="lg">
          Get Started
        </Button>
      </div>
    </div>
  );
};

export default Index;
