import asyncio
import functools
import logging
from typing import Any, Type, TypeVar, Union, cast

from pydantic import BaseModel, ValidationError # type: ignore

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

def shadow_validate(schema: type[T], data: Any, default: Any = None) -> T | Any:
    """
    Validates data against a schema. 
    If validation fails, logs the error and returns the default value (or original data) 
    instead of raising an exception.
    """
    try:
        # Use cast to satisfy linter when calling model_validate on a TypeVar
        return cast(Any, schema).model_validate(data)
    except ValidationError as e:
        logger.error(f"Shadow Validation Failed for {schema.__name__}: {e.errors()}")
        # Here we could also send to Sentry
        # import sentry_sdk
        # sentry_sdk.capture_exception(e)
        return default if default is not None else data

def shadow_mode(schema: type[T]):
    """
    Decorator to wrap a function that returns data intended for a schema.
    If the function's return value fails validation, it returns the raw data 
    and logs the error.
    """
    def decorator(func):
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            result = await func(*args, **kwargs)
            return shadow_validate(schema, result)

        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            result = func(*args, **kwargs)
            return shadow_validate(schema, result)

        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    return decorator
