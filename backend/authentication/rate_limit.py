import django_redis
from django.conf import settings


class RateLimitExceeded(Exception):
    """Raised when a client exceeds the allowed login attempt threshold."""
    pass


def check_login_rate_limit(identifier: str, max_attempts: int = 5, window_seconds: int = 300):
    """
    Enforces a login rate limit per identifier (email address).

    - Allows up to `max_attempts` login attempts within a `window_seconds` rolling window.
    - Uses email rather than IP to avoid false positives on shared corporate/ISP IPs.
    - Redis INCR is atomic: no SELECT-then-UPDATE race condition like a DB counter would have.

    Args:
        identifier:     Usually the email submitted in the login form.
        max_attempts:   Max allowed attempts before locking out (default 5).
        window_seconds: Sliding window in seconds (default 300 = 5 minutes).

    Raises:
        RateLimitExceeded: If the attempt count has reached max_attempts.
                           The exception message includes seconds remaining.
    """
    cache = django_redis.get_redis_connection("default")
    key = f"login_attempts:{identifier}"

    current = cache.get(key)

    if current is None:
        # First attempt in this window: create counter with TTL
        cache.setex(key, window_seconds, 1)
        return

    if int(current) >= max_attempts:
        ttl = cache.ttl(key)
        raise RateLimitExceeded(
            f"Too many login attempts. Please try again in {ttl} seconds."
        )

    cache.incr(key)  # atomic increment — safe under high concurrency

def check_refresh_rate_limit(ip_address: str, max_attempts: int = 5, window_seconds: int = 300):
    """
    Enforces a rate limit for the Opaque Refresh Token endpoint to prevent brute-forcing
    the 8-character transaction IDs.
    """
    cache = django_redis.get_redis_connection("default")
    key = f"refresh_attempts:{ip_address}"

    current = cache.get(key)

    if current is None:
        cache.setex(key, window_seconds, 1)
        return

    if int(current) >= max_attempts:
        ttl = cache.ttl(key)
        raise RateLimitExceeded(
            f"Too many invalid refresh attempts. Please try again in {ttl} seconds."
        )

    cache.incr(key)

def check_captcha_rate_limit(ip_address: str, max_attempts: int = 20, window_seconds: int = 60):
    """
    Enforces a rate limit for the Captcha endpoint to prevent CPU exhaustion attacks.
    """
    cache = django_redis.get_redis_connection("default")
    key = f"captcha_attempts:{ip_address}"

    current = cache.get(key)

    if current is None:
        cache.setex(key, window_seconds, 1)
        return

    if int(current) >= max_attempts:
        ttl = cache.ttl(key)
        raise RateLimitExceeded(
            f"Too many captcha requests. Please wait {ttl} seconds."
        )

    cache.incr(key)
