import asyncio
import hashlib
import json
import time
from typing import Dict, List, Any, Optional
import redis.asyncio as redis
import structlog
from tree_sitter import Language, Parser

from src.analysis.analyzer import CodeAnalyzer
from src.analysis.llm_analyzer import LLMAnalyzer
from src.core.config import get_settings
from src.core.security import generate_content_hash
from src.monitoring.metrics import MetricsCollector

logger = structlog.get_logger()
settings = get_settings()

class IncrementalScanner:
    """
    Enterprise-grade scanner with incremental analysis and Redis caching
    
    - Preserves existing AST parsing logic
    - Adds Redis-based content hashing for incremental scans
    - Tracks file changes and only reanalyzes modified content
    - Maintains analysis history for trend tracking
    """
    
    def __init__(self, redis_client: redis.Redis, metrics_collector: MetricsCollector):
        self.redis = redis_client
        self.metrics = metrics_collector
        self.static_analyzer = CodeAnalyzer()
        self.llm_analyzer = LLMAnalyzer()
        self.parsers = {}
        self._init_parsers()
    
    def _init_parsers(self):
        """Initialize tree-sitter parsers for supported languages"""
        try:
            # Initialize parsers for supported languages
            # Note: In production, you'd need to build language libraries
            self.parsers = {
                "python": None,  # Language(tree_sitter_python.language())
                "javascript": None,
                "typescript": None,
                "rust": None,
            }
        except Exception as e:
            logger.warning("parser_initialization_failed", error=str(e))
    
    async def analyze_incremental(
        self,
        content: str,
        language: str,
        file_path: str = "unknown"
    ) -> Dict[str, Any]:
        """
        Perform incremental analysis with caching
        
        Returns:
            Analysis result with cache status and metrics
        """
        start_time = self.metrics.record_analysis_start()
        
        try:
            # Generate content hash for cache lookup
            content_hash = generate_content_hash(content)
            cache_key = f"analysis:{language}:{content_hash}"
            
            # Check cache first
            cached_result = await self._get_cached_analysis(cache_key)
            if cached_result:
                self.metrics.record_analysis_end(start_time, cache_hit=True)
                logger.info("cache_hit", file_path=file_path, content_hash=content_hash[:8])
                return {
                    **cached_result,
                    "cache_status": "hit",
                    "analysis_time_ms": (time.perf_counter() - start_time) * 1000
                }
            
            # Perform full analysis
            result = await self._perform_analysis(content, language, file_path)
            
            # Cache the result
            await self._cache_analysis(cache_key, result)
            
            # Track file analysis
            await self._track_file_analysis(file_path, content_hash, result)
            
            self.metrics.record_analysis_end(start_time, cache_hit=False)
            
            return {
                **result,
                "cache_status": "miss",
                "analysis_time_ms": (time.perf_counter() - start_time) * 1000
            }
            
        except Exception as e:
            logger.error("incremental_analysis_failed", file_path=file_path, error=str(e))
            raise
    
    async def _get_cached_analysis(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Get cached analysis result"""
        try:
            cached = await self.redis.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception as e:
            logger.warning("cache_retrieval_failed", cache_key=cache_key, error=str(e))
        return None
    
    async def _cache_analysis(self, cache_key: str, result: Dict[str, Any]):
        """Cache analysis result"""
        try:
            await self.redis.setex(
                cache_key,
                settings.CACHE_TTL,
                json.dumps(result)
            )
        except Exception as e:
            logger.warning("cache_storage_failed", cache_key=cache_key, error=str(e))
    
    async def _perform_analysis(
        self,
        content: str,
        language: str,
        file_path: str
    ) -> Dict[str, Any]:
        """Perform full static + LLM analysis"""
        
        # Static analysis (preserving existing logic)
        static_start = time.perf_counter()
        static_results = await self.static_analyzer.analyze(content, language)
        static_time = time.perf_counter() - static_start
        self.metrics.record_static_analysis_time(static_time)
        
        # LLM analysis (preserving existing logic)
        llm_start = time.perf_counter()
        llm_results = await self.llm_analyzer.analyze(
            content, language, static_results
        )
        llm_time = time.perf_counter() - llm_start
        self.metrics.record_llm_time(llm_time)
        
        # Record token usage (mock for now)
        self.metrics.record_token_usage(
            settings.LLM_MODEL,
            input_tokens=len(content.split()) * 1.3,  # Rough estimate
            output_tokens=200  # Typical LLM response length
        )
        
        # Combine results
        all_issues = static_results["issues"] + llm_results.get("issues", [])
        
        # Calculate score
        score = self._calculate_code_score(all_issues, static_results["metrics"])
        
        # Record metrics
        bugs_count = len([i for i in all_issues if i["type"] == "bug"])
        security_count = len([i for i in all_issues if i["type"] == "security"])
        self.metrics.record_bugs_found(bugs_count)
        self.metrics.record_security_issues_found(security_count)
        
        return {
            "metrics": static_results["metrics"],
            "issues": all_issues,
            "summary": llm_results.get("summary", ""),
            "score": score,
            "static_analysis_time_ms": static_time * 1000,
            "llm_analysis_time_ms": llm_time * 1000,
        }
    
    def _calculate_code_score(self, issues: List[Dict], metrics: Dict) -> int:
        """Calculate code quality score (0-100)"""
        score = 100
        
        for issue in issues:
            if issue["severity"] == "critical":
                score -= 20
            elif issue["severity"] == "high":
                score -= 10
            elif issue["severity"] == "medium":
                score -= 5
        
        # Penalize high complexity
        complexity = metrics.get("cyclomatic_complexity", 0)
        if complexity > 10:
            score -= min(20, (complexity - 10) * 2)
        
        return max(0, score)
    
    async def _track_file_analysis(
        self,
        file_path: str,
        content_hash: str,
        result: Dict[str, Any]
    ):
        """Track file analysis history"""
        try:
            # Store analysis history
            history_key = f"file_history:{file_path}"
            analysis_record = {
                "timestamp": time.time(),
                "content_hash": content_hash,
                "score": result["score"],
                "issues_count": len(result["issues"]),
                "bugs_count": len([i for i in result["issues"] if i["type"] == "bug"]),
                "security_count": len([i for i in result["issues"] if i["type"] == "security"]),
            }
            
            # Add to history (keep last 10 analyses)
            await self.redis.lpush(history_key, json.dumps(analysis_record))
            await self.redis.ltrim(history_key, 0, 9)
            await self.redis.expire(history_key, 86400 * 30)  # 30 days
            
        except Exception as e:
            logger.warning("history_tracking_failed", file_path=file_path, error=str(e))
    
    async def get_file_history(self, file_path: str) -> List[Dict[str, Any]]:
        """Get analysis history for a file"""
        try:
            history_key = f"file_history:{file_path}"
            history_data = await self.redis.lrange(history_key, 0, -1)
            return [json.loads(record) for record in history_data]
        except Exception as e:
            logger.warning("history_retrieval_failed", file_path=file_path, error=str(e))
            return []
    
    async def get_analysis_trends(self, days: int = 7) -> Dict[str, Any]:
        """Get analysis trends for dashboard"""
        try:
            # Get daily stats from Redis
            trends = {}
            for i in range(days):
                date = time.time() - (i * 86400)
                date_key = f"daily_stats:{int(date)}"
                daily_data = await self.redis.get(date_key)
                
                if daily_data:
                    trends[f"day_{i}"] = json.loads(daily_data)
                else:
                    trends[f"day_{i}"] = {
                        "analyses": 0,
                        "bugs_found": 0,
                        "security_issues": 0,
                        "avg_score": 0
                    }
            
            return trends
            
        except Exception as e:
            logger.error("trends_retrieval_failed", error=str(e))
            return {}
    
    async def clear_cache(self, pattern: str = "analysis:*"):
        """Clear analysis cache"""
        try:
            keys = await self.redis.keys(pattern)
            if keys:
                await self.redis.delete(*keys)
                logger.info("cache_cleared", keys_deleted=len(keys))
        except Exception as e:
            logger.error("cache_clear_failed", error=str(e))
