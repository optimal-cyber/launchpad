"""
Optimal Platform - Agent Offline Queue
SQLite-backed queue for offline operation and hybrid environments.

Provides:
- Persistent queue for scan results when platform is unreachable
- Automatic sync when connection is restored
- Batch upload for efficiency
- Queue depth monitoring
"""

import asyncio
import json
import logging
import os
import sqlite3
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional

import aiohttp

logger = logging.getLogger("optimal.agent.offline_queue")


class QueueItemStatus(str, Enum):
    """Status of items in the offline queue"""
    PENDING = "pending"
    SYNCING = "syncing"
    SYNCED = "synced"
    FAILED = "failed"


@dataclass
class QueueItem:
    """Represents an item in the offline queue"""
    id: int
    endpoint: str
    method: str
    payload: Dict[str, Any]
    status: QueueItemStatus
    created_at: str
    attempts: int
    last_attempt: Optional[str]
    error_message: Optional[str]


class OfflineQueue:
    """
    SQLite-backed queue for offline operation.

    Stores scan results and other data when the platform is unreachable,
    then syncs when connection is restored.
    """

    def __init__(
        self,
        db_path: str = "/var/lib/optimal/queue.db",
        max_retries: int = 3,
        batch_size: int = 50
    ):
        self.db_path = db_path
        self.max_retries = max_retries
        self.batch_size = batch_size
        self._lock = asyncio.Lock()

        # Ensure directory exists
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)

        # Initialize database
        self._init_schema()

        logger.info(f"Offline queue initialized: {db_path}")

    def _get_connection(self) -> sqlite3.Connection:
        """Get a database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_schema(self):
        """Initialize the database schema"""
        with self._get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS queue_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    endpoint TEXT NOT NULL,
                    method TEXT NOT NULL DEFAULT 'POST',
                    payload TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'pending',
                    created_at TEXT NOT NULL,
                    attempts INTEGER DEFAULT 0,
                    last_attempt TEXT,
                    error_message TEXT
                )
            """)

            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_queue_status
                ON queue_items(status)
            """)

            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_queue_created
                ON queue_items(created_at)
            """)

            conn.commit()

    async def enqueue(
        self,
        endpoint: str,
        payload: Dict[str, Any],
        method: str = "POST"
    ) -> int:
        """
        Add an item to the offline queue.

        Args:
            endpoint: API endpoint path
            payload: Request payload
            method: HTTP method

        Returns:
            Queue item ID
        """
        async with self._lock:
            with self._get_connection() as conn:
                cursor = conn.execute(
                    """
                    INSERT INTO queue_items (endpoint, method, payload, status, created_at)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (
                        endpoint,
                        method,
                        json.dumps(payload),
                        QueueItemStatus.PENDING.value,
                        datetime.utcnow().isoformat()
                    )
                )
                conn.commit()
                item_id = cursor.lastrowid

            logger.info(f"Enqueued item {item_id}: {method} {endpoint}")
            return item_id

    async def get_pending(self, limit: int = None) -> List[QueueItem]:
        """
        Get pending items from the queue.

        Args:
            limit: Maximum number of items to return

        Returns:
            List of pending queue items
        """
        limit = limit or self.batch_size

        with self._get_connection() as conn:
            rows = conn.execute(
                """
                SELECT * FROM queue_items
                WHERE status = ? AND attempts < ?
                ORDER BY created_at ASC
                LIMIT ?
                """,
                (QueueItemStatus.PENDING.value, self.max_retries, limit)
            ).fetchall()

        return [
            QueueItem(
                id=row["id"],
                endpoint=row["endpoint"],
                method=row["method"],
                payload=json.loads(row["payload"]),
                status=QueueItemStatus(row["status"]),
                created_at=row["created_at"],
                attempts=row["attempts"],
                last_attempt=row["last_attempt"],
                error_message=row["error_message"]
            )
            for row in rows
        ]

    async def mark_syncing(self, item_ids: List[int]):
        """Mark items as currently syncing"""
        async with self._lock:
            with self._get_connection() as conn:
                conn.execute(
                    f"""
                    UPDATE queue_items
                    SET status = ?, last_attempt = ?
                    WHERE id IN ({','.join('?' * len(item_ids))})
                    """,
                    (
                        QueueItemStatus.SYNCING.value,
                        datetime.utcnow().isoformat(),
                        *item_ids
                    )
                )
                conn.commit()

    async def mark_synced(self, item_ids: List[int]):
        """Mark items as successfully synced"""
        async with self._lock:
            with self._get_connection() as conn:
                conn.execute(
                    f"""
                    UPDATE queue_items
                    SET status = ?
                    WHERE id IN ({','.join('?' * len(item_ids))})
                    """,
                    (QueueItemStatus.SYNCED.value, *item_ids)
                )
                conn.commit()

        logger.info(f"Marked {len(item_ids)} items as synced")

    async def mark_failed(self, item_id: int, error: str):
        """Mark an item as failed"""
        async with self._lock:
            with self._get_connection() as conn:
                conn.execute(
                    """
                    UPDATE queue_items
                    SET status = ?, attempts = attempts + 1, error_message = ?
                    WHERE id = ?
                    """,
                    (QueueItemStatus.PENDING.value, error, item_id)
                )
                conn.commit()

        logger.warning(f"Item {item_id} failed: {error}")

    async def mark_permanently_failed(self, item_ids: List[int]):
        """Mark items as permanently failed (exceeded retries)"""
        async with self._lock:
            with self._get_connection() as conn:
                conn.execute(
                    f"""
                    UPDATE queue_items
                    SET status = ?
                    WHERE id IN ({','.join('?' * len(item_ids))})
                    """,
                    (QueueItemStatus.FAILED.value, *item_ids)
                )
                conn.commit()

    async def get_pending_count(self) -> int:
        """Get count of pending items in the queue"""
        with self._get_connection() as conn:
            result = conn.execute(
                """
                SELECT COUNT(*) as count FROM queue_items
                WHERE status = ? AND attempts < ?
                """,
                (QueueItemStatus.PENDING.value, self.max_retries)
            ).fetchone()
            return result["count"] if result else 0

    async def get_stats(self) -> Dict[str, int]:
        """Get queue statistics"""
        with self._get_connection() as conn:
            rows = conn.execute(
                """
                SELECT status, COUNT(*) as count
                FROM queue_items
                GROUP BY status
                """
            ).fetchall()

        stats = {status.value: 0 for status in QueueItemStatus}
        for row in rows:
            stats[row["status"]] = row["count"]

        return stats

    async def cleanup_synced(self, max_age_hours: int = 24):
        """Remove synced items older than max_age_hours"""
        async with self._lock:
            cutoff = datetime.utcnow().isoformat()

            with self._get_connection() as conn:
                result = conn.execute(
                    """
                    DELETE FROM queue_items
                    WHERE status = ?
                    AND datetime(created_at) < datetime(?, '-' || ? || ' hours')
                    """,
                    (QueueItemStatus.SYNCED.value, cutoff, max_age_hours)
                )
                conn.commit()
                deleted = result.rowcount

            if deleted > 0:
                logger.info(f"Cleaned up {deleted} synced items")

            return deleted

    async def sync_all(
        self,
        session: aiohttp.ClientSession,
        base_url: str
    ) -> Dict[str, int]:
        """
        Sync all pending items to the platform.

        Args:
            session: aiohttp session with authentication
            base_url: Platform API base URL

        Returns:
            Dict with sync statistics
        """
        stats = {"synced": 0, "failed": 0, "skipped": 0}

        pending_items = await self.get_pending()

        if not pending_items:
            logger.debug("No pending items to sync")
            return stats

        logger.info(f"Syncing {len(pending_items)} pending items...")

        # Mark as syncing
        item_ids = [item.id for item in pending_items]
        await self.mark_syncing(item_ids)

        synced_ids = []
        for item in pending_items:
            try:
                url = f"{base_url.rstrip('/')}{item.endpoint}"

                async with session.request(
                    item.method,
                    url,
                    json=item.payload,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as resp:
                    if resp.status in [200, 201, 202]:
                        synced_ids.append(item.id)
                        stats["synced"] += 1
                    elif resp.status == 401:
                        # Auth error - don't retry immediately
                        await self.mark_failed(item.id, "Authentication failed")
                        stats["failed"] += 1
                    else:
                        text = await resp.text()
                        await self.mark_failed(item.id, f"HTTP {resp.status}: {text[:200]}")
                        stats["failed"] += 1

            except aiohttp.ClientError as e:
                await self.mark_failed(item.id, f"Connection error: {str(e)}")
                stats["failed"] += 1
            except Exception as e:
                await self.mark_failed(item.id, f"Error: {str(e)}")
                stats["failed"] += 1

        # Mark successfully synced items
        if synced_ids:
            await self.mark_synced(synced_ids)

        # Check for items that exceeded retry limit
        with self._get_connection() as conn:
            rows = conn.execute(
                """
                SELECT id FROM queue_items
                WHERE status = ? AND attempts >= ?
                """,
                (QueueItemStatus.PENDING.value, self.max_retries)
            ).fetchall()

            if rows:
                failed_ids = [row["id"] for row in rows]
                await self.mark_permanently_failed(failed_ids)
                stats["skipped"] = len(failed_ids)
                logger.warning(f"{len(failed_ids)} items exceeded max retries")

        logger.info(f"Sync complete: {stats}")
        return stats


class OfflineQueueMixin:
    """
    Mixin for BaseAgent to add offline queue support.

    Usage:
        class MyAgent(BaseAgent, OfflineQueueMixin):
            async def setup(self):
                self.init_offline_queue()

            async def send_results(self, results):
                if not await self._try_send(results):
                    await self.queue_for_later("/api/v1/scans/ingest", results)
    """

    _offline_queue: Optional[OfflineQueue] = None
    _sync_task: Optional[asyncio.Task] = None

    def init_offline_queue(
        self,
        db_path: str = None,
        sync_interval: int = 300
    ):
        """Initialize the offline queue"""
        if db_path is None:
            db_path = os.getenv("OPTIMAL_OFFLINE_QUEUE_PATH", "/var/lib/optimal/queue.db")

        self._offline_queue = OfflineQueue(db_path)
        self._sync_interval = sync_interval

        logger.info("Offline queue initialized for agent")

    async def start_sync_loop(self):
        """Start background sync loop"""
        if self._sync_task is None:
            self._sync_task = asyncio.create_task(self._sync_loop())

    async def _sync_loop(self):
        """Background loop to sync queued items"""
        while getattr(self, "_running", True):
            try:
                if self._offline_queue:
                    pending = await self._offline_queue.get_pending_count()
                    if pending > 0:
                        logger.info(f"Attempting to sync {pending} queued items...")
                        session = await self._get_session()
                        await self._offline_queue.sync_all(
                            session,
                            self.config.api_url
                        )

                    # Cleanup old synced items
                    await self._offline_queue.cleanup_synced()

            except Exception as e:
                logger.error(f"Sync loop error: {e}")

            await asyncio.sleep(self._sync_interval)

    async def queue_for_later(
        self,
        endpoint: str,
        payload: Dict[str, Any],
        method: str = "POST"
    ):
        """Queue a request for later sync"""
        if self._offline_queue:
            await self._offline_queue.enqueue(endpoint, payload, method)
        else:
            logger.warning("Offline queue not initialized, request dropped")

    async def get_queue_stats(self) -> Dict[str, int]:
        """Get offline queue statistics"""
        if self._offline_queue:
            return await self._offline_queue.get_stats()
        return {}
