import { useState } from "react";
import { apiRequest, setToken } from "@/lib/queryClient";


export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await apiRequest("POST", "/api/auth/login", { email, password });
      const data = await res.json();
      setToken(data.token);
      onLogin();
    } catch (err: any) {
      const msg = err?.message || "Login failed";
      // Extract the message after the status code prefix if present
      const cleanMsg = msg.includes(": ") ? msg.split(": ").slice(1).join(": ") : msg;
      try {
        const parsed = JSON.parse(cleanMsg);
        setError(parsed.message || "Invalid email or password");
      } catch {
        setError(cleanMsg || "Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-card border border-border rounded-xl shadow-lg p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <img src="/assets/Smaart-Company-Logos-white-and-Navy.png" alt="SMAART Company" className="h-12 w-auto dark:hidden" />
            <img src="/assets/Smaart-Company-Logos-white.png" alt="SMAART Company" className="h-12 w-auto hidden dark:block" />
            <p className="text-xs text-muted-foreground tracking-widest uppercase mt-3">Command Center</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
                placeholder="you@smaartcompany.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
