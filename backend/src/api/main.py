from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time
import asyncio
import redis.asyncio as redis
import structlog

from src.core.config import get_settings
from src.core.logging import setup_logging
from src.core.exceptions import CodeScanException
from src.services.scanner import IncrementalScanner
from src.services.rate_limiter import APIKeyRateLimiter
from src.monitoring.metrics import MetricsCollector
from src.api.routes import analyze, metrics, health

# Configure logging
setup_logging()
logger = structlog.get_logger()

settings = get_settings()

# Global instances
redis_client: redis.Redis = None
metrics_collector: MetricsCollector = None
scanner: IncrementalScanner = None
rate_limiter: APIKeyRateLimiter = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("starting_codescan_ai", version=settings.VERSION)
    
    # Initialize Redis
    global redis_client, metrics_collector, scanner, rate_limiter
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    
    # Initialize services
    metrics_collector = MetricsCollector(redis_client)
    scanner = IncrementalScanner(redis_client, metrics_collector)
    rate_limiter = APIKeyRateLimiter(redis_client)
    
    # Set global instances for routes
    analyze.redis_client = redis_client
    analyze.metrics_collector = metrics_collector
    analyze.scanner = scanner
    analyze.rate_limiter = rate_limiter
    
    metrics.metrics_collector = metrics_collector
    metrics.rate_limiter = rate_limiter
    
    health.redis_client = redis_client
    health.metrics_collector = metrics_collector
    health.rate_limiter = rate_limiter
    
    logger.info("codescan_ai_started", services_initialized=True)
    
    yield
    
    # Shutdown
    logger.info("shutting_down_codescan_ai")
    await redis_client.close()

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Intelligent code analysis with LLM insights",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add request timing and logging"""
    start_time = time.perf_counter()
    
    try:
        response = await call_next(request)
        process_time = time.perf_counter() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        
        # Log request
        logger.info(
            "request_completed",
            method=request.method,
            url=str(request.url),
            status_code=response.status_code,
            process_time=process_time
        )
        
        return response
        
    except Exception as e:
        process_time = time.perf_counter() - start_time
        logger.error(
            "request_failed",
            method=request.method,
            url=str(request.url),
            error=str(e),
            process_time=process_time
        )
        raise

@app.exception_handler(CodeScanException)
async def codescan_exception_handler(request: Request, exc: CodeScanException):
    """Handle CodeScan-specific exceptions"""
    logger.error(
        "codescan_exception",
        error=exc.message,
        details=exc.details,
        url=str(request.url)
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": "CodeScan analysis failed",
            "message": exc.message,
            "details": exc.details
        }
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    logger.warning(
        "http_exception",
        status_code=exc.status_code,
        detail=exc.detail,
        url=str(request.url)
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions"""
    logger.error(
        "unexpected_exception",
        error=str(exc),
        url=str(request.url),
        exc_info=True
    )
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"}
    )

# Include routers
app.include_router(
    analyze.router,
    prefix=f"{settings.API_PREFIX}/analyze",
    tags=["analysis"]
)

app.include_router(
    metrics.router,
    prefix=f"{settings.API_PREFIX}/metrics",
    tags=["metrics"]
)

app.include_router(
    health.router,
    tags=["health"]
)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "running",
        "docs": "/docs" if settings.DEBUG else "disabled"
    }

@app.get(f"{settings.API_PREFIX}/info")
async def app_info():
    """Application information"""
    return {
        "name": settings.APP_NAME,
        "version": settings.VERSION,
        "debug": settings.DEBUG,
        "llm_model": settings.LLM_MODEL,
        "incremental_scan_enabled": settings.INCREMENTAL_SCAN_ENABLED,
        "max_file_size_mb": settings.MAX_FILE_SIZE_MB,
        "rate_limit_per_minute": settings.RATE_LIMIT_PER_MINUTE
    }
