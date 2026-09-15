import logging
import sys

from app.config import settings


def configure_logging() -> None:
    level = logging.DEBUG if not settings.is_production else logging.INFO
    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)
    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    root_logger.handlers = [handler]
    if settings.is_production:
        logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
