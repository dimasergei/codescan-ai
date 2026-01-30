from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import redis.asyncio as redis

from src.core.exceptions import create_http_exception
from src.services.rate_limiter import APIKeyRateLimiter
from src.monitoring.metrics import MetricsCollector

router = APIRouter()

# Global instances (initialized in main.py)
metrics_collector: MetricsCollector = None
rate_limiter: APIKeyRateLimiter = None

class MetricsResponse(BaseModel):
    analysis_latency_p50: float
    analysis_latency_p95: float
    cache_hit_rate: float
    cost_per_analysis: float
    files_scanned: int
    analyses_today: int
    bugs_caught: int
    security_issues_found: int
    accuracy_on_security: float
    analysis_speed: str

class LatencyHistoryResponse(BaseModel):
    history: List[Dict[str, Any]]

async def get_rate_limiter() -> APIKeyRateLimiter:
    """Dependency to get rate limiter instance"""
    return rate_limiter

async def verify_api_key_dependency(
    api_key: str = None,
    rate_limiter: APIKeyRateLimiter = Depends(get_rate_limiter)
) -> str:
    """Verify API key and check rate limits"""
    if not api_key:
        raise create_http_exception(
            401,
            "API key required"
        )
    
    # Check rate limit
    rate_result = await rate_limiter.check_api_key(api_key, "free")
    if not rate_result["allowed"]:
        raise create_http_exception(
            429,
            f"Rate limit exceeded. Try again in {rate_result['retry_after']} seconds."
        )
    
    return api_key

@router.get("/current", response_model=MetricsResponse)
async def get_current_metrics(
    api_key: str = Depends(verify_api_key_dependency)
):
    """Get current system metrics"""
    
    try:
        metrics = await metrics_collector.get_metrics_summary()
        return MetricsResponse(**metrics)
    except Exception as e:
        raise create_http_exception(
            500,
            f"Failed to retrieve metrics: {str(e)}"
        )

@router.get("/latency/history", response_model=LatencyHistoryResponse)
async def get_latency_history(
    hours: int = 24,
    api_key: str = Depends(verify_api_key_dependency)
):
    """Get latency history for charts"""
    
    try:
        history = await metrics_collector.get_latency_history(hours)
        return LatencyHistoryResponse(history=history)
    except Exception as e:
        raise create_http_exception(
            500,
            f"Failed to retrieve latency history: {str(e)}"
        )

@router.get("/prometheus")
async def get_prometheus_metrics():
    """Get Prometheus metrics endpoint"""
    from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
    
    try:
        metrics_data = generate_latest()
        return Response(
            content=metrics_data,
            media_type=CONTENT_TYPE_LATEST
        )
    except Exception as e:
        raise create_http_exception(
            500,
            f"Failed to generate Prometheus metrics: {str(e)}"
        )
