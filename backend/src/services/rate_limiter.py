import asyncio
import time
from typing import Dict, Optional
import redis.asyncio as redis
import structlog

from src.core.config import get_settings

logger = structlog.get_logger()
settings = get_settings()

class RateLimiter:
    """
    Redis-based rate limiter for API endpoints
    
    Uses sliding window algorithm with Redis for distributed rate limiting
    """
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.window_size = 60  # 1 minute window
        self.max_requests = settings.RATE_LIMIT_PER_MINUTE
    
    async def is_allowed(
        self,
        identifier: str,
        limit: Optional[int] = None,
        window: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Check if request is allowed
        
        Args:
            identifier: Unique identifier (IP, API key, user ID)
            limit: Custom limit (overrides default)
            window: Custom window in seconds (overrides default)
            
        Returns:
            Dict with allowed status and remaining requests
        """
        limit = limit or self.max_requests
        window = window or self.window_size
        
        current_time = time.time()
        window_start = current_time - window
        
        # Redis key for this identifier
        key = f"rate_limit:{identifier}"
        
        try:
            # Remove expired entries
            await self.redis.zremrangebyscore(key, 0, window_start)
            
            # Count current requests
            current_requests = await self.redis.zcard(key)
            
            if current_requests >= limit:
                # Rate limit exceeded
                ttl = await self.redis.ttl(key)
                return {
                    "allowed": False,
                    "remaining": 0,
                    "reset_time": current_time + ttl,
                    "retry_after": ttl
                }
            
            # Add current request
            await self.redis.zadd(key, {str(current_time): current_time})
            await self.redis.expire(key, window)
            
            remaining = limit - current_requests - 1
            
            return {
                "allowed": True,
                "remaining": remaining,
                "reset_time": current_time + window,
                "retry_after": 0
            }
            
        except Exception as e:
            logger.error("rate_limit_check_failed", identifier=identifier, error=str(e))
            # Fail open - allow request if Redis is down
            return {
                "allowed": True,
                "remaining": limit - 1,
                "reset_time": current_time + window,
                "retry_after": 0
            }
    
    async def get_usage_stats(self, identifier: str) -> Dict[str, Any]:
        """Get current usage statistics for identifier"""
        key = f"rate_limit:{identifier}"
        
        try:
            current_time = time.time()
            window_start = current_time - self.window_size
            
            # Remove expired entries
            await self.redis.zremrangebyscore(key, 0, window_start)
            
            # Get current requests
            current_requests = await self.redis.zcard(key)
            
            # Get oldest request time
            oldest = await self.redis.zrange(key, 0, 0, withscores=True)
            oldest_time = oldest[0][1] if oldest else current_time
            
            return {
                "current_requests": current_requests,
                "max_requests": self.max_requests,
                "remaining": max(0, self.max_requests - current_requests),
                "window_start": oldest_time,
                "window_end": oldest_time + self.window_size,
                "reset_in": max(0, oldest_time + self.window_size - current_time)
            }
            
        except Exception as e:
            logger.error("usage_stats_failed", identifier=identifier, error=str(e))
            return {
                "current_requests": 0,
                "max_requests": self.max_requests,
                "remaining": self.max_requests,
                "window_start": 0,
                "window_end": 0,
                "reset_in": 0
            }
    
    async def reset(self, identifier: str):
        """Reset rate limit for identifier"""
        key = f"rate_limit:{identifier}"
        try:
            await self.redis.delete(key)
            logger.info("rate_limit_reset", identifier=identifier)
        except Exception as e:
            logger.error("rate_limit_reset_failed", identifier=identifier, error=str(e))

class APIKeyRateLimiter(RateLimiter):
    """Rate limiter for API keys with higher limits"""
    
    def __init__(self, redis_client: redis.Redis):
        super().__init__(redis_client)
        self.api_key_limits = {
            "free": 60,  # 60 requests per minute
            "pro": 1000,  # 1000 requests per minute
            "enterprise": 5000,  # 5000 requests per minute
        }
    
    async def check_api_key(
        self,
        api_key: str,
        tier: str = "free"
    ) -> Dict[str, Any]:
        """Check rate limit for API key"""
        limit = self.api_key_limits.get(tier, self.api_key_limits["free"])
        return await self.is_allowed(f"api_key:{api_key}", limit=limit)
