"""
core/base/service.py — BaseService
=====================================
All service classes should inherit from this.

The service layer:
  - Orchestrates business logic
  - Calls repositories (never models directly)
  - Raises domain exceptions
  - Has NO knowledge of HTTP request/response
"""

import logging
from typing import Any


class BaseService:
    """
    Base class for all Bricklytics service classes.

    Convention:
        - Inject the repository in __init__
        - Each public method maps to one business operation
        - Raise domain exceptions (never HTTP exceptions)

    Usage:
        class PropertyService(BaseService):
            def __init__(self, repo: PropertyRepository):
                super().__init__()
                self.repo = repo

            def get_property(self, property_id: str) -> dict:
                return self.repo.find_by_id(property_id)
    """

    def __init__(self) -> None:
        self.logger = logging.getLogger(
            f'bricklytics.{self.__class__.__module__}'
        )

    def _log_operation(self, operation: str, **context: Any) -> None:
        """Log a service operation with structured context."""
        ctx_str = '  '.join(f'{k}={v}' for k, v in context.items())
        self.logger.info('[%s] %s  %s', self.__class__.__name__, operation, ctx_str)
