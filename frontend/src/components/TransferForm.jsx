import { useState } from "react";

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
      // Resolve the recipient's email to their account id server-side.
      // The UI never handles raw account UUIDs.
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
    <div>
      <h2 className="text-sm font-medium text-ink-soft uppercase tracking-wide mb-4">
        Send a transfer
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-xl">
        <label className="flex flex-col gap-1.5 text-xs text-ink-soft">
          From account
          <select
            required
            value={fromAccount}
            onChange={(e) => setFromAccount(e.target.value)}
            className="text-sm text-ink bg-surface border border-border-strong rounded px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-credit/20 focus:border-credit"
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

        <label className="flex flex-col gap-1.5 text-xs text-ink-soft">
          Recipient email
          <input
            type="email"
            required
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="someone@example.com"
            className="text-sm text-ink bg-surface border border-border-strong rounded px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-credit/20 focus:border-credit"
          />
        </label>

        <div className="flex flex-col sm:flex-row gap-4">
          <label className="flex flex-col gap-1.5 text-xs text-ink-soft flex-1">
            Amount
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="text-sm text-ink bg-surface border border-border-strong rounded px-3 py-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-credit/20 focus:border-credit"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-ink-soft flex-[2]">
            Note <span className="text-border-strong">(optional)</span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What's this for?"
              className="text-sm text-ink bg-surface border border-border-strong rounded px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-credit/20 focus:border-credit"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={sending}
          className="self-start bg-ink text-white rounded px-4 py-2.5 text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-60"
        >
          {sending ? "Sending…" : "Send transfer"}
        </button>

        {error && <p className="text-debit text-xs">{error}</p>}
      </form>
    </div>
  );
}
