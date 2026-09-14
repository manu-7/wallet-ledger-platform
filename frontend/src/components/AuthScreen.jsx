import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { API_BASE } from "../api.js";

export default function AuthScreen() {
  const { login, signup } = useAuth();
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (tab === "login") {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Wallet &amp; Ledger</h1>
          <p className="text-ink-soft text-sm mt-1">Double-entry accounts. Every rupee traced.</p>
        </div>

        <div className="flex gap-6 border-b border-border mb-6">
          {["login", "signup"].map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setError("");
              }}
              className={`pb-3 text-sm -mb-px border-b-2 transition-colors ${
                tab === t
                  ? "border-credit text-ink font-medium"
                  : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              {t === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-xs text-ink-soft">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              className="text-sm text-ink bg-surface border border-border-strong rounded px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-credit/20 focus:border-credit"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-ink-soft">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={tab === "login" ? "current-password" : "new-password"}
              className="text-sm text-ink bg-surface border border-border-strong rounded px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-credit/20 focus:border-credit"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="bg-ink text-white rounded px-4 py-2.5 text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-60 mt-1"
          >
            {loading ? "Please wait…" : tab === "login" ? "Log in" : "Create account"}
          </button>

          {error && <p className="text-debit text-xs">{error}</p>}
        </form>

        <p className="text-[11px] text-border-strong mt-8">
          Connects to <code className="bg-surface border border-border px-1.5 py-0.5 rounded">{API_BASE}</code>
        </p>
      </div>
    </div>
  );
}
