import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/App";

interface UserInfo {
  id: number;
  email: string;
  name: string;
  role: string;
  mustChangePassword: string | null;
  createdAt: string | null;
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("GET", "/api/admin/users");
      setUsers(await res.json());
    } catch {
      setMessage({ type: "error", text: "Failed to load users." });
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  if (user?.role !== "admin") {
    return (
      <div className="max-w-lg mx-auto py-8 px-4 text-center">
        <p className="text-muted-foreground">You don't have permission to view this page.</p>
      </div>
    );
  }

  const handleResetPassword = async (userId: number, userName: string) => {
    if (!confirm(`Reset password for ${userName}? They'll be given a default password and required to change it.`)) return;

    setResetting(userId);
    setMessage(null);
    try {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/reset-password`);
      const data = await res.json();
      setMessage({ type: "success", text: `Password reset for ${userName}. New password: ${data.defaultPassword}` });
      fetchUsers();
    } catch {
      setMessage({ type: "error", text: "Failed to reset password." });
    }
    setResetting(null);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-1">User Management</h1>
      <p className="text-muted-foreground text-sm mb-8">Manage users and reset passwords.</p>

      {message && (
        <div className={`mb-6 p-3 rounded-lg text-sm ${message.type === "success" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-destructive/10 text-destructive border border-destructive/20"}`}>
          {message.text}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-base font-semibold mb-1">All Users</h2>
        <p className="text-xs text-muted-foreground mb-4">Reset a user's password to the default format (smaart + first name + year + !)</p>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{u.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{u.role}</span>
                    {u.mustChangePassword === "true" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">Must change password</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{u.email}</p>
                </div>
                <button
                  onClick={() => handleResetPassword(u.id, u.name)}
                  disabled={resetting === u.id}
                  className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {resetting === u.id ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
