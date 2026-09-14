import { useState } from "react";

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
    <aside className="w-full md:w-72 border-b md:border-b-0 md:border-r border-border px-4 sm:px-6 py-6 shrink-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-ink-soft uppercase tracking-wide">Accounts</h2>
        <button
          onClick={() => setShowModal(true)}
          className="text-xs text-credit hover:underline"
        >
          + New
        </button>
      </div>

      {loading && <p className="text-sm text-ink-soft">Loading…</p>}

      {!loading && accounts.length === 0 && (
        <p className="text-sm text-ink-soft py-4">No accounts yet. Create one to get started.</p>
      )}

      <div className="flex flex-col">
        {accounts.map((acc) => (
          <div key={acc.id} className="py-3 border-b border-border first:border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm capitalize">{acc.account_type.replace("_", " ")}</p>
                <p className="text-[11px] text-border-strong font-mono">{shortId(acc.id)}…</p>
              </div>
              <span className="tabular font-mono text-sm font-medium">
                ₹{formatMoney(acc.balance_cache)}
              </span>
            </div>
            <button
              onClick={() => setDepositTarget(acc)}
              className="text-[11px] text-credit hover:underline mt-1.5"
            >
              + Add money
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-ink/30 flex items-center justify-center z-10 px-4">
          <div className="bg-surface border border-border rounded-lg p-6 w-full max-w-xs">
            <h3 className="text-base font-semibold mb-4">New account</h3>
            <p className="text-sm text-ink-soft mb-6">
              Creates a new user wallet account under your profile.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="text-sm border border-border-strong rounded px-3 py-1.5 hover:border-ink transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="text-sm bg-ink text-white rounded px-3 py-1.5 hover:bg-ink/90 transition-colors disabled:opacity-60"
              >
                {creating ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {depositTarget && (
        <div className="fixed inset-0 bg-ink/30 flex items-center justify-center z-10 px-4">
          <div className="bg-surface border border-border rounded-lg p-6 w-full max-w-xs">
            <h3 className="text-base font-semibold mb-1">Add money</h3>
            <p className="text-[11px] text-border-strong font-mono mb-4">
              {shortId(depositTarget.id)}…
            </p>
            <label className="flex flex-col gap-1.5 text-xs text-ink-soft mb-4">
              Amount
              <input
                type="number"
                min="0.01"
                step="0.01"
                autoFocus
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0.00"
                className="text-sm text-ink bg-surface border border-border-strong rounded px-3 py-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-credit/20 focus:border-credit"
              />
            </label>
            {depositError && <p className="text-debit text-xs mb-3">{depositError}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setDepositTarget(null);
                  setDepositError("");
                }}
                className="text-sm border border-border-strong rounded px-3 py-1.5 hover:border-ink transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeposit}
                disabled={depositing || !depositAmount}
                className="text-sm bg-ink text-white rounded px-3 py-1.5 hover:bg-ink/90 transition-colors disabled:opacity-60"
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
