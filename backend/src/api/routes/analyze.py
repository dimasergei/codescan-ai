from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import time
import asyncio
import redis.asyncio as redis

from src.core.config import get_settings
from src.core.exceptions import create_http_exception, AnalysisException, ValidationException
from src.core.security import verify_api_key
from src.services.scanner import IncrementalScanner
from src.services.rate_limiter import APIKeyRateLimiter
from src.monitoring.metrics import MetricsCollector

settings = get_settings()
router = APIRouter()

# Global instances (initialized in main.py)
redis_client: redis.Redis = None
metrics_collector: MetricsCollector = None
scanner: IncrementalScanner = None
rate_limiter: APIKeyRateLimiter = None

class AnalysisRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=100000, description="Code to analyze")
    language: str = Field(..., regex="^(python|javascript|typescript|rust)$", description="Programming language")
    filename: str = Field(default="untitled", description="Filename for context")
    
    class Config:
        schema_extra = {
            "example": {
                "code": "def hello():\n    print('Hello, World!')",
                "language": "python",
                "filename": "hello.py"
            }
        }

class Issue(BaseModel):
    type: str = Field(..., description="Issue type (bug, security, performance, style)")
    severity: str = Field(..., description="Severity level (critical, high, medium, low)")
    line: Optional[int] = Field(None, description="Line number")
    message: str = Field(..., description="Issue description")
    suggestion: Optional[str] = Field(None, description="Suggested fix")

class AnalysisResponse(BaseModel):
    success: bool = Field(..., description="Analysis success status")
    metrics: Dict[str, Any] = Field(..., description="Code metrics")
    issues: List[Issue] = Field(..., description="Found issues")
    summary: str = Field(..., description="AI-generated summary")
    score: int = Field(..., ge=0, le=100, description="Code quality score")
    cache_status: str = Field(..., description="Cache hit/miss status")
    analysis_time_ms: float = Field(..., description="Total analysis time")
    static_analysis_time_ms: float = Field(..., description="Static analysis time")
    llm_analysis_time_ms: float = Field(..., description="LLM analysis time")

class BatchAnalysisRequest(BaseModel):
    files: List[AnalysisRequest] = Field(..., min_items=1, max_items=10, description="Files to analyze")
    
class BatchAnalysisResponse(BaseModel):
    success: bool
    results: List[AnalysisResponse]
    total_files: int
    total_issues: int
    avg_score: float
    total_time_ms: float

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
            status.HTTP_401_UNAUTHORIZED,
            "API key required"
        )
    
    # Check rate limit
    rate_result = await rate_limiter.check_api_key(api_key, "free")
    if not rate_result["allowed"]:
        raise create_http_exception(
            status.HTTP_429_TOO_MANY_REQUESTS,
            f"Rate limit exceeded. Try again in {rate_result['retry_after']} seconds.",
            headers={"Retry-After": str(rate_result["retry_after"])}
        )
    
    return api_key

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_code(
    request: AnalysisRequest,
    background_tasks: BackgroundTasks,
    api_key: str = Depends(verify_api_key_dependency)
):
    """
    Analyze code with static analysis + LLM insights
    
    - Preserves existing AST parsing and LLM analysis logic
    - Adds enterprise-grade rate limiting and caching
    - Tracks metrics for monitoring
    """
    try:
        # Validate input
        if len(request.code) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
            raise ValidationException(
                f"Code exceeds maximum size of {settings.MAX_FILE_SIZE_MB}MB"
            )
        
        # Perform analysis with incremental scanner
        result = await scanner.analyze_incremental(
            content=request.code,
            language=request.language,
            file_path=request.filename
        )
        
        # Convert to response format
        response = AnalysisResponse(
            success=True,
            metrics=result["metrics"],
            issues=[Issue(**issue) for issue in result["issues"]],
            summary=result["summary"],
            score=result["score"],
            cache_status=result["cache_status"],
            analysis_time_ms=result["analysis_time_ms"],
            static_analysis_time_ms=result["static_analysis_time_ms"],
            llm_analysis_time_ms=result["llm_analysis_time_ms"]
        )
        
        # Background task: Update daily stats
        background_tasks.add_task(update_daily_stats, response)
        
        return response
        
    except ValidationException as e:
        raise create_http_exception(
            status.HTTP_400_BAD_REQUEST,
            e.message
        )
    except AnalysisException as e:
        raise create_http_exception(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            f"Analysis failed: {e.message}"
        )
    except Exception as e:
        raise create_http_exception(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "Internal server error during analysis"
        )

@router.post("/analyze/file", response_model=AnalysisResponse)
async def analyze_file(
    file: UploadFile = File(...),
    api_key: str = Depends(verify_api_key_dependency)
):
    """Analyze uploaded file"""
    
    # Detect language from filename
    language = detect_language(file.filename)
    
    # Read file
    try:
        content = await file.read()
        code = content.decode("utf-8")
    except UnicodeDecodeError:
        raise create_http_exception(
            status.HTTP_400_BAD_REQUEST,
            "File encoding not supported. Please use UTF-8."
        )
    
    # Create analysis request
    request = AnalysisRequest(
        code=code,
        language=language,
        filename=file.filename or "uploaded_file"
    )
    
    return await analyze_code(request, BackgroundTasks(), api_key)

@router.post("/analyze/batch", response_model=BatchAnalysisResponse)
async def analyze_batch(
    request: BatchAnalysisRequest,
    api_key: str = Depends(verify_api_key_dependency)
):
    """Analyze multiple files in batch"""
    
    start_time = time.perf_counter()
    results = []
    total_issues = 0
    total_score = 0
    
    try:
        # Process files concurrently (with rate limiting)
        semaphore = asyncio.Semaphore(5)  # Max 5 concurrent analyses
        
        async def analyze_single(file_request):
            async with semaphore:
                return await scanner.analyze_incremental(
                    content=file_request.code,
                    language=file_request.language,
                    file_path=file_request.filename
                )
        
        # Run analyses
        tasks = [analyze_single(req) for req in request.files]
        analysis_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        for i, result in enumerate(analysis_results):
            if isinstance(result, Exception):
                # Handle failed analysis
                results.append(AnalysisResponse(
                    success=False,
                    metrics={},
                    issues=[],
                    summary=f"Analysis failed: {str(result)}",
                    score=0,
                    cache_status="error",
                    analysis_time_ms=0,
                    static_analysis_time_ms=0,
                    llm_analysis_time_ms=0
                ))
            else:
                response = AnalysisResponse(
                    success=True,
                    metrics=result["metrics"],
                    issues=[Issue(**issue) for issue in result["issues"]],
                    summary=result["summary"],
                    score=result["score"],
                    cache_status=result["cache_status"],
                    analysis_time_ms=result["analysis_time_ms"],
                    static_analysis_time_ms=result["static_analysis_time_ms"],
                    llm_analysis_time_ms=result["llm_analysis_time_ms"]
                )
                results.append(response)
                total_issues += len(result["issues"])
                total_score += result["score"]
        
        total_time = (time.perf_counter() - start_time) * 1000
        avg_score = total_score / len(request.files) if request.files else 0
        
        return BatchAnalysisResponse(
            success=True,
            results=results,
            total_files=len(request.files),
            total_issues=total_issues,
            avg_score=avg_score,
            total_time_ms=total_time
        )
        
    except Exception as e:
        raise create_http_exception(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            f"Batch analysis failed: {str(e)}"
        )

@router.get("/history/{file_path:path}")
async def get_file_history(
    file_path: str,
    api_key: str = Depends(verify_api_key_dependency)
):
    """Get analysis history for a specific file"""
    
    try:
        history = await scanner.get_file_history(file_path)
        return {"file_path": file_path, "history": history}
    except Exception as e:
        raise create_http_exception(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            f"Failed to retrieve history: {str(e)}"
        )

@router.get("/trends")
async def get_analysis_trends(
    days: int = 7,
    api_key: str = Depends(verify_api_key_dependency)
):
    """Get analysis trends for dashboard"""
    
    try:
        trends = await scanner.get_analysis_trends(days)
        return {"trends": trends, "days": days}
    except Exception as e:
        raise create_http_exception(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            f"Failed to retrieve trends: {str(e)}"
        )

@router.delete("/cache")
async def clear_cache(
    pattern: str = "analysis:*",
    api_key: str = Depends(verify_api_key_dependency)
):
    """Clear analysis cache"""
    
    try:
        await scanner.clear_cache(pattern)
        return {"message": f"Cache cleared for pattern: {pattern}"}
    except Exception as e:
        raise create_http_exception(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            f"Failed to clear cache: {str(e)}"
        )

async def update_daily_stats(response: AnalysisResponse):
    """Background task to update daily statistics"""
    try:
        today = int(time.time() // 86400)  # Days since epoch
        stats_key = f"daily_stats:{today}"
        
        # Increment counters
        await redis_client.hincrby(stats_key, "analyses", 1)
        await redis_client.hincrby(stats_key, "bugs_found", len(response.issues))
        await redis_client.hincrby(stats_key, "security_issues", 
            len([i for i in response.issues if i.type == "security"]))
        
        # Update average score
        current_avg = await redis_client.hget(stats_key, "avg_score")
        if current_avg:
            new_avg = (float(current_avg) + response.score) / 2
        else:
            new_avg = response.score
        await redis_client.hset(stats_key, "avg_score", str(new_avg))
        
        # Set expiry (30 days)
        await redis_client.expire(stats_key, 86400 * 30)
        
    except Exception as e:
        logger.error("daily_stats_update_failed", error=str(e))

def detect_language(filename: str) -> str:
    """Detect programming language from filename"""
    if not filename:
        return "python"
    
    ext_map = {
        ".py": "python",
        ".js": "javascript",
        ".ts": "typescript",
        ".tsx": "typescript",
        ".rs": "rust",
        ".go": "go",
        ".java": "java",
    }
    
    for ext, lang in ext_map.items():
        if filename.endswith(ext):
            return lang
    
    return "python"  # Default
