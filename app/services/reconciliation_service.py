"""
Reconciliation logic: verifies the core double-entry invariant holds across
the ENTIRE ledger — for every transaction, the sum of its DEBIT entries must
equal the sum of its CREDIT entries. If this ever fails, the ledger has been
corrupted (a bug, a manual DB edit, or worse) and money is unaccounted for.

Runs on a plain sync DB connection (via psycopg2) since Celery workers don't
share the FastAPI app's async event loop.
"""

import logging
from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy import create_engine, text

from app.config import settings

logger = logging.getLogger("reconciliation")

_sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg", "postgresql+psycopg2")
_sync_engine = create_engine(_sync_url, future=True)


@dataclass
class ReconciliationMismatch:
    transaction_id: str
    total_debit: Decimal
    total_credit: Decimal


def run_ledger_reconciliation() -> list[ReconciliationMismatch]:
    """Returns a list of transactions where debits and credits don't match.
    An empty list means the ledger is fully balanced — the expected,
    healthy result.
    """
    query = text(
        """
        SELECT
            transaction_id,
            SUM(CASE WHEN entry_type = 'DEBIT' THEN amount ELSE 0 END) AS total_debit,
            SUM(CASE WHEN entry_type = 'CREDIT' THEN amount ELSE 0 END) AS total_credit
        FROM ledger_entries
        GROUP BY transaction_id
        HAVING SUM(CASE WHEN entry_type = 'DEBIT' THEN amount ELSE 0 END)
             != SUM(CASE WHEN entry_type = 'CREDIT' THEN amount ELSE 0 END)
        """
    )

    with _sync_engine.connect() as conn:
        rows = conn.execute(query).fetchall()

    mismatches = [
        ReconciliationMismatch(
            transaction_id=str(row.transaction_id),
            total_debit=row.total_debit,
            total_credit=row.total_credit,
        )
        for row in rows
    ]

    if mismatches:
        logger.error(
            "LEDGER RECONCILIATION FAILED: %d mismatched transaction(s) found: %s",
            len(mismatches),
            mismatches,
        )
    else:
        logger.info("Ledger reconciliation OK — all transactions balanced.")

    return mismatches
