import { useState } from "react";

export default function ForgotPasswordPage({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-card border border-border rounded-xl shadow-lg p-8">
          <div className="flex flex-col items-center mb-8">
            <img src="/assets/Smaart-Company-Logos-white-and-Navy.png" alt="SMAART Company" className="h-12 w-auto dark:hidden" />
            <img src="/assets/Smaart-Company-Logos-white.png" alt="SMAART Company" className="h-12 w-auto hidden dark:block" />
            <p className="text-xs text-muted-foreground tracking-widest uppercase mt-3">Command Center</p>
          </div>

          <h2 className="text-lg font-semibold text-center mb-2">Reset your password</h2>

          {submitted ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                If an account with that email exists, we've sent a password reset link. Check your inbox.
              </p>
              <button onClick={onBack} className="text-sm text-primary hover:underline">
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="you@smaartcompany.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
              <div className="text-center">
                <button type="button" onClick={onBack} className="text-sm text-muted-foreground hover:underline">
                  Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
