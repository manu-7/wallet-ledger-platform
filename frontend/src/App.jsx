import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./context/AuthContext.jsx";
import { apiRequest } from "./api.js";
import AuthScreen from "./components/AuthScreen.jsx";
import TopBar from "./components/TopBar.jsx";
import AccountsPanel from "./components/AccountsPanel.jsx";
import TransferForm from "./components/TransferForm.jsx";
import PaymentHistory from "./components/PaymentHistory.jsx";

export default function App() {
  const { accessToken } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [toast, setToast] = useState(null);

  const loadAccounts = useCallback(async () => {
    if (!accessToken) return;
    setLoadingAccounts(true);
    try {
      setAccounts(await apiRequest("/accounts/", { token: accessToken }));
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setLoadingAccounts(false);
    }
  }, [accessToken]);

  const loadHistory = useCallback(async () => {
    if (!accessToken) return;
    setLoadingHistory(true);
    try {
      setHistory(await apiRequest("/transactions/history", { token: accessToken }));
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setLoadingHistory(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadAccounts();
    loadHistory();
  }, [loadAccounts, loadHistory]);

  function showToast(message, isError = false) {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleCreateAccount(accountType) {
    await apiRequest("/accounts/", {
      method: "POST",
      token: accessToken,
      body: { account_type: accountType },
    });
    showToast("Account created");
    await loadAccounts();
  }

  async function handleDeposit(accountId, amount) {
    const idempotency_key = `deposit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await apiRequest(`/accounts/${accountId}/deposit`, {
      method: "POST",
      token: accessToken,
      body: { amount, idempotency_key, description: "Deposit" },
    });
    showToast("Money added");
    await Promise.all([loadAccounts(), loadHistory()]);
  }

  async function handleLookupRecipient(email) {
    if (!email) throw new Error("Enter the recipient's email.");
    return apiRequest(`/accounts/lookup?email=${encodeURIComponent(email)}`, {
      token: accessToken,
    });
  }

  async function handleTransfer({ from_account_id, to_account_id, amount, description }) {
    const idempotency_key = `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await apiRequest("/transactions/transfer", {
      method: "POST",
      token: accessToken,
      body: { from_account_id, to_account_id, amount, description, idempotency_key },
    });
    showToast("Transfer sent");
    await Promise.all([loadAccounts(), loadHistory()]);
  }

  if (!accessToken) return <AuthScreen />;

  return (
    <div className="min-h-screen flex flex-col bg-app">
      <TopBar />
      <div className="flex flex-col md:flex-row flex-1">
        <AccountsPanel
          accounts={accounts}
          loading={loadingAccounts}
          onCreateAccount={handleCreateAccount}
          onDeposit={handleDeposit}
        />
        <main className="flex-1 px-4 sm:px-6 md:px-8 py-6 flex flex-col gap-6 min-w-0">
          <TransferForm
            accounts={accounts}
            onTransfer={handleTransfer}
            onLookupRecipient={handleLookupRecipient}
          />
          <PaymentHistory entries={history} loading={loadingHistory} />
        </main>
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-lg text-sm text-white shadow-elevated ${
            toast.isError ? "bg-debit" : "bg-accent"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
