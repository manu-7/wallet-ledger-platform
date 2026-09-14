import { useAuth } from "../context/AuthContext.jsx";

export default function TopBar() {
  const { userEmail, logout } = useAuth();

  return (
    <header className="flex items-center justify-between px-8 py-4 border-b border-border bg-surface">
      <h1 className="text-lg font-semibold tracking-tight">Wallet &amp; Ledger</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-ink-soft">{userEmail}</span>
        <button
          onClick={logout}
          className="text-sm border border-border-strong rounded px-3 py-1.5 hover:border-ink transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
