import { useState } from "react";
import { Send } from "lucide-react";

function shortId(id) {
  return id ? id.slice(0, 8) : "";
}

function formatMoney(value) {
  return Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function TransferForm({ accounts, onTransfer, onLookupRecipient }) {
  const [fromAccount, setFromAccount] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!fromAccount) {
      setError("Create an account first.");
      return;
    }
    setSending(true);
    try {
      const recipient = await onLookupRecipient(recipientEmail.trim());
      await onTransfer({
        from_account_id: fromAccount,
        to_account_id: recipient.account_id,
        amount: Number(amount),
        description: note.trim() || null,
      });
      setRecipientEmail("");
      setAmount("");
      setNote("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-lg bg-credit-soft text-credit flex items-center justify-center">
          <Send size={13} />
        </div>
        <h2 className="text-sm font-semibold">Send a transfer</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-xl">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-soft">
          From account
          <select
            required
            value={fromAccount}
            onChange={(e) => setFromAccount(e.target.value)}
            className="text-sm text-ink bg-surface border border-border-strong rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-4 focus:ring-credit/10 focus:border-credit transition-shadow"
          >
            <option value="" disabled>
              Select account
            </option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.account_type} — {shortId(acc.id)}… (₹{formatMoney(acc.balance_cache)})
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-soft">
          Recipient email
          <input
            type="email"
            required
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="someone@example.com"
            className="text-sm text-ink bg-surface border border-border-strong rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-4 focus:ring-credit/10 focus:border-credit transition-shadow"
          />
        </label>

        <div className="flex flex-col sm:flex-row gap-4">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-soft flex-1">
            Amount
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="text-sm text-ink bg-surface border border-border-strong rounded-lg px-3.5 py-2.5 font-mono focus:outline-none focus:ring-4 focus:ring-credit/10 focus:border-credit transition-shadow"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-soft flex-[2]">
            Note <span className="text-ink-faint font-normal">(optional)</span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What's this for?"
              className="text-sm text-ink bg-surface border border-border-strong rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-4 focus:ring-credit/10 focus:border-credit transition-shadow"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={sending}
          className="self-start flex items-center gap-2 bg-accent text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-accent/90 active:scale-[0.99] transition-all disabled:opacity-60"
        >
          <Send size={14} />
          {sending ? "Sending…" : "Send transfer"}
        </button>

        {error && <p className="text-debit text-xs">{error}</p>}
      </form>
    </div>
  );
}
