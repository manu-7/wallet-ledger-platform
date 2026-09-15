from celery import Celery
from celery.schedules import crontab

from app.config import settings

celery_app = Celery(
    "wallet_ledger",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.reconciliation_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

celery_app.conf.beat_schedule = {
    "run-ledger-reconciliation": {
        "task": "app.tasks.reconciliation_tasks.run_reconciliation",
        "schedule": crontab(minute="*/5"),
    },
}
