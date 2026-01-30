import radon.complexity as radon_cc
import radon.metrics as radon_metrics
import bandit
from bandit.core import manager
from typing import Dict, List, Any
import ast
import re

class CodeAnalyzer:
    """
    Static code analysis using multiple tools
    
    - Complexity analysis with Radon
    - Security analysis with Bandit
    - Basic linting rules
    - Language-specific checks
    """
    
    def __init__(self):
        self.bandit_manager = manager.BanditManager(bandit.config.BanditConfig(), 'file')
    
    async def analyze(self, code: str, language: str) -> Dict[str, Any]:
        """
        Perform static analysis
        
        Returns:
            {
                "metrics": {...},
                "issues": [...]
            }
        """
        issues = []
        metrics = {}
        
        if language == "python":
            metrics, issues = self._analyze_python(code)
        elif language in ["javascript", "typescript"]:
            metrics, issues = self._analyze_javascript(code)
        elif language == "rust":
            metrics, issues = self._analyze_rust(code)
        else:
            metrics, issues = self._analyze_generic(code)
        
        return {
            "metrics": metrics,
            "issues": issues,
        }
    
    def _analyze_python(self, code: str) -> tuple[Dict, List]:
        """Python-specific analysis"""
        issues = []
        
        try:
            # Complexity metrics
            complexity = radon_cc.cc_visit(code)
            metrics = {
                "loc": len(code.splitlines()),
                "cyclomatic_complexity": max([c.complexity for c in complexity]) if complexity else 1,
                "maintainability_index": radon_metrics.mi_visit(code),
                "functions": len([c for c in complexity if isinstance(c, radon_cc.Function)]),
                "classes": len([c for c in complexity if isinstance(c, radon_cc.Class)]),
            }
            
            # Security issues with Bandit
            try:
                self.bandit_manager.discover_files([code], False)
                results = self.bandit_manager.run_tests()
                
                for issue in results.get_issues():
                    issues.append({
                        "type": "security",
                        "severity": self._map_bandit_severity(issue.severity),
                        "line": issue.lineno,
                        "message": issue.text,
                        "suggestion": f"Fix: {issue.test_id}",
                    })
            except:
                pass  # Bandit might fail on invalid code
            
            # Python-specific checks
            issues.extend(self._check_python_patterns(code))
            
        except SyntaxError:
            metrics = {"loc": len(code.splitlines()), "error": "syntax_error"}
            issues.append({
                "type": "syntax",
                "severity": "critical",
                "line": None,
                "message": "Syntax error in code",
                "suggestion": "Fix syntax errors before analysis",
            })
        
        return metrics, issues
    
    def _analyze_javascript(self, code: str) -> tuple[Dict, List]:
        """JavaScript/TypeScript analysis"""
        issues = []
        
        # Basic metrics
        lines = code.splitlines()
        metrics = {
            "loc": len(lines),
            "functions": len(re.findall(r'function\s+\w+|=>\s*{|\w+\s*:\s*function', code)),
            "classes": len(re.findall(r'class\s+\w+', code)),
        }
        
        # JavaScript-specific checks
        issues.extend(self._check_javascript_patterns(code))
        
        return metrics, issues
    
    def _analyze_rust(self, code: str) -> tuple[Dict, List]:
        """Rust analysis"""
        issues = []
        
        lines = code.splitlines()
        metrics = {
            "loc": len(lines),
            "functions": len(re.findall(r'fn\s+\w+', code)),
            "structs": len(re.findall(r'struct\s+\w+', code)),
        }
        
        # Rust-specific checks
        issues.extend(self._check_rust_patterns(code))
        
        return metrics, issues
    
    def _analyze_generic(self, code: str) -> tuple[Dict, List]:
        """Generic analysis for unsupported languages"""
        lines = code.splitlines()
        metrics = {
            "loc": len(lines),
        }
        
        issues = []
        
        return metrics, issues
    
    def _check_python_patterns(self, code: str) -> List[Dict]:
        """Python-specific pattern checks"""
        issues = []
        lines = code.splitlines()
        
        for i, line in enumerate(lines, 1):
            line = line.strip()
            
            # Check for hardcoded passwords
            if re.search(r'password\s*=\s*["\'][^"\']+["\']', line, re.IGNORECASE):
                issues.append({
                    "type": "security",
                    "severity": "high",
                    "line": i,
                    "message": "Hardcoded password detected",
                    "suggestion": "Use environment variables or config files",
                })
            
            # Check for TODO comments
            if "TODO" in line or "FIXME" in line:
                issues.append({
                    "type": "style",
                    "severity": "low",
                    "line": i,
                    "message": "TODO/FIXME comment found",
                    "suggestion": "Complete the task or remove the comment",
                })
            
            # Check for print statements in production code
            if line.startswith("print(") and not "debug" in line.lower():
                issues.append({
                    "type": "style",
                    "severity": "medium",
                    "line": i,
                    "message": "Print statement in production code",
                    "suggestion": "Use proper logging instead",
                })
        
        return issues
    
    def _check_javascript_patterns(self, code: str) -> List[Dict]:
        """JavaScript-specific pattern checks"""
        issues = []
        lines = code.splitlines()
        
        for i, line in enumerate(lines, 1):
            line = line.strip()
            
            # Check for console.log in production
            if "console.log" in line:
                issues.append({
                    "type": "style",
                    "severity": "medium",
                    "line": i,
                    "message": "Console.log statement",
                    "suggestion": "Remove or replace with proper logging",
                })
            
            # Check for var usage
            if re.match(r'^\s*var\s+', line):
                issues.append({
                    "type": "style",
                    "severity": "low",
                    "line": i,
                    "message": "Using 'var' instead of 'let' or 'const'",
                    "suggestion": "Use 'let' or 'const' for better scoping",
                })
        
        return issues
    
    def _check_rust_patterns(self, code: str) -> List[Dict]:
        """Rust-specific pattern checks"""
        issues = []
        lines = code.splitlines()
        
        for i, line in enumerate(lines, 1):
            line = line.strip()
            
            # Check for .unwrap() usage
            if ".unwrap()" in line and not line.strip().startswith("//"):
                issues.append({
                    "type": "bug",
                    "severity": "medium",
                    "line": i,
                    "message": "Unsafe .unwrap() usage",
                    "suggestion": "Use proper error handling with ? or match",
                })
            
            # Check for TODO comments
            if "TODO" in line or "FIXME" in line:
                issues.append({
                    "type": "style",
                    "severity": "low",
                    "line": i,
                    "message": "TODO/FIXME comment found",
                    "suggestion": "Complete the task or remove the comment",
                })
        
        return issues
    
    def _map_bandit_severity(self, bandit_severity: str) -> str:
        """Map Bandit severity to our severity levels"""
        mapping = {
            "LOW": "low",
            "MEDIUM": "medium", 
            "HIGH": "high",
        }
        return mapping.get(bandit_severity, "medium")
