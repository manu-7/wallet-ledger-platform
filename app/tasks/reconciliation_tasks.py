from app.tasks.celery_app import celery_app
from app.services.reconciliation_service import run_ledger_reconciliation


@celery_app.task(name="app.tasks.reconciliation_tasks.run_reconciliation")
def run_reconciliation():
    mismatches = run_ledger_reconciliation()
    return {
        "ok": len(mismatches) == 0,
        "mismatch_count": len(mismatches),
        "mismatches": [
            {"transaction_id": m.transaction_id, "total_debit": str(m.total_debit), "total_credit": str(m.total_credit)}
            for m in mismatches
        ],
    }
