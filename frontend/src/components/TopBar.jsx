import { Wallet, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function TopBar() {
  const { userEmail, logout } = useAuth();
  const initial = userEmail ? userEmail[0].toUpperCase() : "?";

  return (
    <header className="flex items-center justify-between px-6 sm:px-8 py-3.5 border-b border-border bg-surface">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-accent text-white flex items-center justify-center">
          <Wallet size={14} strokeWidth={2} />
        </div>
        <h1 className="text-[15px] font-semibold tracking-tight">Wallet &amp; Ledger</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-credit-soft text-credit text-[11px] font-medium flex items-center justify-center">
            {initial}
          </div>
          <span className="text-sm text-ink-soft">{userEmail}</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-sm border border-border-strong rounded-lg px-3 py-1.5 hover:border-ink hover:bg-app transition-colors"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
