import { useState } from "react";
import { Wallet, Plus, ArrowDownToLine } from "lucide-react";

function formatMoney(value) {
  return Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function shortId(id) {
  return id ? id.slice(0, 8) : "";
}

export default function AccountsPanel({ accounts, onCreateAccount, onDeposit, loading }) {
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [depositTarget, setDepositTarget] = useState(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositing, setDepositing] = useState(false);
  const [depositError, setDepositError] = useState("");

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance_cache), 0);

  async function handleCreate() {
    setCreating(true);
    try {
      await onCreateAccount("user_wallet");
      setShowModal(false);
    } finally {
      setCreating(false);
    }
  }

  async function handleDeposit() {
    setDepositError("");
    setDepositing(true);
    try {
      await onDeposit(depositTarget.id, Number(depositAmount));
      setDepositTarget(null);
      setDepositAmount("");
    } catch (err) {
      setDepositError(err.message);
    } finally {
      setDepositing(false);
    }
  }

  return (
    <aside className="w-full md:w-80 border-b md:border-b-0 md:border-r border-border px-5 sm:px-6 py-6 shrink-0 bg-surface">
      {/* Total balance summary */}
      <div className="bg-accent text-white rounded-xl px-5 py-5 mb-6 shadow-elevated">
        <p className="text-white/60 text-xs font-medium uppercase tracking-wide mb-1.5">
          Total balance
        </p>
        <p className="tabular font-mono text-2xl font-semibold">
          ₹{formatMoney(totalBalance)}
        </p>
        <p className="text-white/50 text-xs mt-1.5">
          Across {accounts.length} account{accounts.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-ink-faint uppercase tracking-wide">
          Accounts
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1 text-xs font-medium text-credit hover:text-accent transition-colors"
        >
          <Plus size={13} /> New
        </button>
      </div>

      {loading && <p className="text-sm text-ink-soft py-4">Loading…</p>}

      {!loading && accounts.length === 0 && (
        <div className="text-center py-10 px-4 border border-dashed border-border-strong rounded-lg">
          <Wallet size={20} className="mx-auto text-ink-faint mb-2" />
          <p className="text-sm text-ink-soft">No accounts yet.</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="bg-surface border border-border rounded-lg px-4 py-3.5 hover:border-border-strong hover:shadow-card transition-all"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-credit-soft text-credit flex items-center justify-center shrink-0">
                  <Wallet size={14} />
                </div>
                <div>
                  <p className="text-sm font-medium capitalize leading-tight">
                    {acc.account_type.replace("_", " ")}
                  </p>
                  <p className="text-[11px] text-ink-faint font-mono">{shortId(acc.id)}…</p>
                </div>
              </div>
              <span className="tabular font-mono text-sm font-semibold">
                ₹{formatMoney(acc.balance_cache)}
              </span>
            </div>
            <button
              onClick={() => setDepositTarget(acc)}
              className="flex items-center gap-1 text-[11px] font-medium text-credit hover:text-accent transition-colors mt-1.5 ml-[42px]"
            >
              <ArrowDownToLine size={11} /> Add money
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-[2px] flex items-center justify-center z-10 px-4">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-xs shadow-elevated">
            <h3 className="text-base font-semibold mb-1.5">New account</h3>
            <p className="text-sm text-ink-soft mb-6">
              Creates a new user wallet account under your profile.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="text-sm border border-border-strong rounded-lg px-3.5 py-2 hover:bg-app transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="text-sm bg-accent text-white rounded-lg px-3.5 py-2 hover:bg-accent/90 transition-colors disabled:opacity-60"
              >
                {creating ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {depositTarget && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-[2px] flex items-center justify-center z-10 px-4">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-xs shadow-elevated">
            <h3 className="text-base font-semibold mb-1">Add money</h3>
            <p className="text-[11px] text-ink-faint font-mono mb-4">
              {shortId(depositTarget.id)}…
            </p>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-soft mb-4">
              Amount
              <input
                type="number"
                min="0.01"
                step="0.01"
                autoFocus
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0.00"
                className="text-sm text-ink bg-surface border border-border-strong rounded-lg px-3.5 py-2.5 font-mono focus:outline-none focus:ring-4 focus:ring-credit/10 focus:border-credit transition-shadow"
              />
            </label>
            {depositError && <p className="text-debit text-xs mb-3">{depositError}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setDepositTarget(null);
                  setDepositError("");
                }}
                className="text-sm border border-border-strong rounded-lg px-3.5 py-2 hover:bg-app transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeposit}
                disabled={depositing || !depositAmount}
                className="text-sm bg-accent text-white rounded-lg px-3.5 py-2 hover:bg-accent/90 transition-colors disabled:opacity-60"
              >
                {depositing ? "Adding…" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
