import { useState } from "react";
import { Wallet, ShieldCheck, ArrowLeftRight, ScrollText } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

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
      if (tab === "login") await login(email, password);
      else await signup(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-accent text-white px-12 py-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <Wallet size={18} strokeWidth={2} />
          </div>
          <span className="font-semibold tracking-tight">Wallet &amp; Ledger</span>
        </div>

        <div>
          <h1 className="text-4xl font-semibold tracking-tight leading-[1.15] mb-4">
            Every rupee,
            <br />
            provably accounted for.
          </h1>
          <p className="text-white/60 text-sm max-w-sm">
            Built on double-entry accounting — the same discipline banks use
            — so balances are never just numbers you have to trust.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {[
            [ScrollText, "Append-only ledger, never edited in place"],
            [ArrowLeftRight, "Idempotent transfers — safe against retries"],
            [ShieldCheck, "Row-level locking prevents double-spending"],
          ].map(([Icon, text]) => (
            <div key={text} className="flex items-center gap-3 text-sm text-white/70">
              <Icon size={16} className="shrink-0" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center">
              <Wallet size={18} strokeWidth={2} />
            </div>
            <span className="font-semibold tracking-tight">Wallet &amp; Ledger</span>
          </div>

          <h2 className="text-xl font-semibold tracking-tight mb-1">
            {tab === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-ink-soft text-sm mb-7">
            {tab === "login"
              ? "Log in to view your accounts and send transfers."
              : "Takes a few seconds. No card required."}
          </p>

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
                    : "border-transparent text-ink-faint hover:text-ink-soft"
                }`}
              >
                {t === "login" ? "Log in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-soft">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                placeholder="you@example.com"
                className="text-sm text-ink bg-surface border border-border-strong rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-4 focus:ring-credit/10 focus:border-credit transition-shadow"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-soft">
              Password
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={tab === "login" ? "current-password" : "new-password"}
                placeholder="••••••••"
                className="text-sm text-ink bg-surface border border-border-strong rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-4 focus:ring-credit/10 focus:border-credit transition-shadow"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="bg-accent text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-accent/90 active:scale-[0.99] transition-all disabled:opacity-60 mt-1 shadow-card"
            >
              {loading ? "Please wait…" : tab === "login" ? "Log in" : "Create account"}
            </button>

            {error && <p className="text-debit text-xs">{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
