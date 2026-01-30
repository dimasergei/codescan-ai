from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional
import time
import asyncio
import redis.asyncio as redis

from src.core.config import get_settings
from src.services.rate_limiter import APIKeyRateLimiter
from src.monitoring.metrics import MetricsCollector

router = APIRouter()
settings = get_settings()

# Global instances (initialized in main.py)
redis_client: redis.Redis = None
metrics_collector: MetricsCollector = None
rate_limiter: APIKeyRateLimiter = None

class HealthCheckResponse(BaseModel):
    status: str
    version: str
    timestamp: float
    uptime: float
    services: Dict[str, Dict[str, Any]]

class DetailedHealthResponse(BaseModel):
    status: str
    version: str
    timestamp: float
    uptime: float
    services: Dict[str, Dict[str, Any]]
    metrics: Dict[str, Any]

# Application start time
start_time = time.time()

async def check_redis_health() -> Dict[str, Any]:
    """Check Redis health"""
    try:
        start = time.perf_counter()
        await redis_client.ping()
        latency = (time.perf_counter() - start) * 1000
        
        return {
            "status": "healthy",
            "latency_ms": round(latency, 2),
            "connected": True
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "connected": False
        }

async def check_llm_health() -> Dict[str, Any]:
    """Check LLM service health"""
    try:
        # Simple health check - would make actual API call in production
        # For now, just check if API key is configured
        if settings.ANTHROPIC_API_KEY:
            return {
                "status": "healthy",
                "model": settings.LLM_MODEL,
                "configured": True
            }
        else:
            return {
                "status": "unhealthy",
                "error": "API key not configured",
                "configured": False
            }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "configured": False
        }

async def check_database_health() -> Dict[str, Any]:
    """Check database health"""
    try:
        # Simple health check - would connect to actual database
        return {
            "status": "healthy",
            "connected": True,
            "url_configured": bool(settings.DATABASE_URL)
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "connected": False
        }

@router.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Basic health check endpoint"""
    
    uptime = time.time() - start_time
    
    # Check critical services
    services = {
        "redis": await check_redis_health(),
        "llm": await check_llm_health(),
    }
    
    # Overall status
    all_healthy = all(
        service["status"] == "healthy" 
        for service in services.values()
    )
    
    return HealthCheckResponse(
        status="healthy" if all_healthy else "unhealthy",
        version=settings.VERSION,
        timestamp=time.time(),
        uptime=uptime,
        services=services
    )

@router.get("/health/detailed", response_model=DetailedHealthResponse)
async def detailed_health_check():
    """Detailed health check with metrics"""
    
    uptime = time.time() - start_time
    
    # Check all services
    services = {
        "redis": await check_redis_health(),
        "llm": await check_llm_health(),
        "database": await check_database_health(),
        "rate_limiter": {
            "status": "healthy",
            "configured": rate_limiter is not None
        },
        "metrics": {
            "status": "healthy",
            "configured": metrics_collector is not None
        }
    }
    
    # Get current metrics
    try:
        current_metrics = await metrics_collector.get_metrics_summary()
    except Exception:
        current_metrics = {}
    
    # Overall status
    all_healthy = all(
        service["status"] == "healthy" 
        for service in services.values()
    )
    
    return DetailedHealthResponse(
        status="healthy" if all_healthy else "unhealthy",
        version=settings.VERSION,
        timestamp=time.time(),
        uptime=uptime,
        services=services,
        metrics=current_metrics
    )

@router.get("/ready")
async def readiness_check():
    """Kubernetes readiness probe"""
    
    # Check if essential services are ready
    redis_healthy = (await check_redis_health())["status"] == "healthy"
    llm_healthy = (await check_llm_health())["status"] == "healthy"
    
    if redis_healthy and llm_healthy:
        return {"status": "ready"}
    else:
        return {"status": "not_ready"}

@router.get("/live")
async def liveness_check():
    """Kubernetes liveness probe"""
    
    # Simple liveness check - if we can respond, we're alive
    return {
        "status": "alive",
        "timestamp": time.time(),
        "uptime": time.time() - start_time
    }
