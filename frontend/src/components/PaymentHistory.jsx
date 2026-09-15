import { History, ArrowUpRight, ArrowDownLeft } from "lucide-react";

function shortId(id) {
  return id ? id.slice(0, 8) : "";
}

function formatMoney(value) {
  return Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PaymentHistory({ entries, loading }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-lg bg-app text-ink-soft flex items-center justify-center">
          <History size={13} />
        </div>
        <h2 className="text-sm font-semibold">Payment history</h2>
      </div>

      {loading && <p className="text-ink-soft text-sm py-6 text-center">Loading…</p>}

      {!loading && entries.length === 0 && (
        <div className="text-center py-10">
          <p className="text-sm text-ink-soft">No transactions yet.</p>
        </div>
      )}

      {!loading && entries.length > 0 && (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm border-collapse min-w-[540px]">
            <tbody>
              {entries.map((entry) => {
                const isDebit = entry.entry_type === "DEBIT";
                return (
                  <tr key={entry.id} className="border-b border-border last:border-0">
                    <td className="py-3 px-2 w-10">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isDebit ? "bg-debit-soft text-debit" : "bg-credit-soft text-credit"
                        }`}
                      >
                        {isDebit ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <p className="font-medium text-[13px]">
                        {isDebit ? "Sent" : "Received"}
                      </p>
                      <p className="text-[11px] text-ink-faint">
                        {entry.description || "No note"}
                      </p>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <p
                        className={`font-mono tabular text-sm font-medium ${
                          isDebit ? "text-debit" : "text-credit"
                        }`}
                      >
                        {isDebit ? "−" : "+"}₹{formatMoney(entry.amount)}
                      </p>
                      <p className="text-[11px] text-ink-faint font-mono">
                        {formatDate(entry.created_at)}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
