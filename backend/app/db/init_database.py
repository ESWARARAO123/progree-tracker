"""Database bootstrap helpers.

Ensures the target application database exists before Alembic runs, so the
application can bootstrap itself on a fresh server (Postgres only creates the
database automatically when launched via Docker with POSTGRES_DB).
"""
import logging
import time

import psycopg2

from app.core.config import settings

logger = logging.getLogger(__name__)


def ensure_database_exists(max_retries: int = 30, retry_delay: float = 2.0) -> None:
    """Create the target database if it does not yet exist.

    Connects to the ``postgres`` maintenance database, waits for the server to
    become reachable, and issues a CREATE DATABASE for ``settings.POSTGRES_DB``
    when missing. Safe to call on every startup.
    """
    attempt = 0
    while True:
        try:
            conn = psycopg2.connect(
                host=settings.POSTGRES_SERVER,
                port=settings.POSTGRES_PORT,
                user=settings.POSTGRES_USER,
                password=settings.POSTGRES_PASSWORD,
                dbname="postgres",
                connect_timeout=5,
            )
            conn.autocommit = True
            try:
                with conn.cursor() as cur:
                    cur.execute(
                        "SELECT 1 FROM pg_database WHERE datname = %s",
                        (settings.POSTGRES_DB,),
                    )
                    if cur.fetchone():
                        logger.info("Database '%s' already exists", settings.POSTGRES_DB)
                        return
                    cur.execute(
                        'CREATE DATABASE "{}"'.format(settings.POSTGRES_DB)
                    )
                    logger.info("Created database '%s'", settings.POSTGRES_DB)
                    return
            finally:
                conn.close()
        except psycopg2.OperationalError as exc:
            attempt += 1
            if attempt >= max_retries:
                logger.error(
                    "Could not connect to Postgres at %s:%s after %d attempts: %s",
                    settings.POSTGRES_SERVER,
                    settings.POSTGRES_PORT,
                    max_retries,
                    exc,
                )
                raise
            logger.warning(
                "Postgres not ready (%s/%s), retrying in %.1fs...",
                attempt,
                max_retries,
                retry_delay,
            )
            time.sleep(retry_delay)
