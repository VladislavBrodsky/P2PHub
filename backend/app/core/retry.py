import asyncio
import logging
import functools
from typing import TypeVar, Callable, Any, Awaitable

logger = logging.getLogger(__name__)

T = TypeVar("T")

def async_retry(
    max_attempts: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 10.0,
    exponential_base: float = 2.0,
    exceptions: tuple = (Exception,)
):
    """
    Decorator for async functions with exponential backoff retry.
    
    #comment: This prevents transient failures (network blips, DB locks) from causing data loss.
    Exponential backoff prevents overwhelming a struggling service.
    """
    def decorator(func: Callable[..., Awaitable[T]]) -> Callable[..., Awaitable[T]]:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> T:
            last_exception = None
            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    if attempt == max_attempts - 1:
                        logger.error(f"❌ Final attempt {attempt + 1}/{max_attempts} failed for {func.__name__}: {e}")
                        raise
                    
                    delay = min(base_delay * (exponential_base ** attempt), max_delay)
                    logger.warning(
                        f"⚠️ Retry {attempt + 1}/{max_attempts} for {func.__name__} in {delay:.2f}s due to: {e}"
                    )
                    await asyncio.sleep(delay)
            # This line should theoretically never be reached because of the raise in the loop
            if last_exception:
                raise last_exception
            raise Exception(f"Failed {func.__name__} after {max_attempts} attempts")
        return wrapper
    return decorator
