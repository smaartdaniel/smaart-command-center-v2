import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-display font-bold mb-2" data-testid="text-not-found">Page Not Found</h1>
        <p className="text-sm text-muted-foreground mb-4">The page you're looking for doesn't exist.</p>
        <Link href="/">
          <button className="flex items-center gap-1.5 text-sm text-primary hover:underline mx-auto" data-testid="link-back-home">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </Link>
      </div>
    </div>
  );
}
