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
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-sm font-medium text-ink-soft uppercase tracking-wide">
          Payment history
        </h2>
        <span className="text-[11px] text-border-strong">All time</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[560px]">
          <thead>
            <tr>
              {["Transaction", "Note", "Type", "Amount", "Date"].map((h) => (
                <th
                  key={h}
                  className="text-left font-medium text-ink-soft text-xs pb-2 border-b border-border-strong whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="text-ink-soft py-4 text-sm">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && entries.length === 0 && (
              <tr>
                <td colSpan={5} className="text-ink-soft py-4 text-sm">
                  No transactions yet.
                </td>
              </tr>
            )}
            {entries.map((entry) => {
              const isDebit = entry.entry_type === "DEBIT";
              return (
                <tr key={entry.id} className="border-b border-border">
                  <td className="py-2.5 font-mono text-[11px] text-border-strong whitespace-nowrap">
                    {shortId(entry.transaction_id)}…
                  </td>
                  <td className="py-2.5">{entry.description || "—"}</td>
                  <td className="py-2.5">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        isDebit ? "bg-debit-soft text-debit" : "bg-credit-soft text-credit"
                      }`}
                    >
                      {isDebit ? "Sent" : "Received"}
                    </span>
                  </td>
                  <td
                    className={`py-2.5 font-mono tabular whitespace-nowrap ${
                      isDebit ? "text-debit" : "text-credit"
                    }`}
                  >
                    {isDebit ? "−" : "+"}₹{formatMoney(entry.amount)}
                  </td>
                  <td className="py-2.5 font-mono text-[11px] text-border-strong whitespace-nowrap">
                    {formatDate(entry.created_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
