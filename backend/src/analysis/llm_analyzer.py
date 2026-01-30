from typing import List, Dict, Any
from anthropic import AsyncAnthropic
import json

from src.core.config import get_settings

class LLMAnalyzer:
    """
    Deep code analysis using Claude
    
    Finds issues that static analysis misses:
    - Architectural problems
    - Logic bugs
    - Performance anti-patterns
    - Security vulnerabilities
    - Best practice violations
    """
    
    def __init__(self):
        settings = get_settings()
        self.client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = "claude-sonnet-4-20250514"
    
    async def analyze(
        self,
        code: str,
        language: str,
        static_results: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Analyze code with LLM"""
        
        prompt = self._build_analysis_prompt(code, language, static_results)
        
        response = await self.client.messages.create(
            model=self.model,
            max_tokens=2000,
            temperature=0.0,
            messages=[{"role": "user", "content": prompt}],
        )
        
        # Parse JSON response
        analysis_text = response.content[0].text
        
        # Extract JSON from response
        try:
            # Claude might wrap JSON in markdown
            if "```json" in analysis_text:
                json_str = analysis_text.split("```json")[1].split("```")[0]
            else:
                json_str = analysis_text
            
            analysis = json.loads(json_str)
            
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            analysis = {
                "issues": [],
                "summary": "Analysis failed - invalid response format",
            }
        
        return analysis
    
    def _build_analysis_prompt(
        self,
        code: str,
        language: str,
        static_results: Dict,
    ) -> str:
        """Build prompt for code analysis"""
        
        prompt = f"""You are an expert code reviewer. Analyze this {language} code and identify issues.

STATIC ANALYSIS RESULTS:
- Lines of code: {static_results['metrics'].get('loc', 0)}
- Cyclomatic complexity: {static_results['metrics'].get('cyclomatic_complexity', 0)}
- Maintainability index: {static_results['metrics'].get('maintainability_index', 0)}

CODE TO ANALYZE:
```{language}
{code}
```

ANALYSIS INSTRUCTIONS:
1. Identify bugs, security issues, and performance problems
2. Focus on issues static analysis might miss (logic bugs, architectural problems)
3. Suggest specific improvements
4. Be concise but actionable

REQUIRED OUTPUT FORMAT (JSON only, no markdown):
{{
  "issues": [
    {{
      "type": "bug|security|performance|style",
      "severity": "critical|high|medium|low",
      "line": 42,
      "message": "Brief description of the issue",
      "suggestion": "How to fix it"
    }}
  ],
  "summary": "Overall assessment in 2-3 sentences",
  "recommendations": [
    "Top 3 recommendations for improvement"
  ]
}}

Respond with ONLY the JSON object, no other text."""
        
        return prompt
