"""
common/logging/formatters.py — Custom Log Formatters
=====================================================
Registered in settings.LOGGING['formatters']['json'].
"""

import json
import logging
import traceback
from datetime import datetime, timezone


class JSONFormatter(logging.Formatter):
    """
    Formats log records as single-line JSON objects.

    Output example:
        {
            "timestamp": "2026-08-01T08:00:00+05:30",
            "level":     "ERROR",
            "logger":    "bricklytics.api",
            "module":    "views",
            "line":      42,
            "message":   "Something went wrong",
            "exc_info":  "Traceback ..."
        }
    """

    def format(self, record: logging.LogRecord) -> str:
        log_entry: dict = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'level':     record.levelname,
            'logger':    record.name,
            'module':    record.module,
            'func':      record.funcName,
            'line':      record.lineno,
            'message':   record.getMessage(),
        }

        # Attach structured `extra` fields if provided
        for key, value in record.__dict__.items():
            if key not in (
                'name', 'msg', 'args', 'levelname', 'levelno', 'pathname',
                'filename', 'module', 'exc_info', 'exc_text', 'stack_info',
                'lineno', 'funcName', 'created', 'msecs', 'relativeCreated',
                'thread', 'threadName', 'processName', 'process', 'message',
                'taskName',
            ):
                log_entry[key] = value

        # Attach exception traceback if present
        if record.exc_info:
            log_entry['exc_info'] = self.formatException(record.exc_info)

        return json.dumps(log_entry, default=str, ensure_ascii=False)
