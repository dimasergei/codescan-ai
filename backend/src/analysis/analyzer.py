import radon.complexity as radon_cc
import radon.metrics as radon_metrics
import bandit
from bandit.core import manager
from typing import Dict, List, Any
import ast
import re
import tree_sitter
from tree_sitter import Language, Parser

class CodeAnalyzer:
    """
    Static code analysis using Tree-sitter AST parsing
    
    - AST parsing with Tree-sitter for multi-language support
    - Complexity analysis with Radon
    - Security analysis with Bandit
    - Advanced structural analysis
    - Language-specific checks
    """
    
    def __init__(self):
        self.bandit_manager = manager.BanditManager(bandit.config.BanditConfig(), 'file')
        self.parsers = {
            'python': self._init_parser('python'),
            'javascript': self._init_parser('javascript'),
            'typescript': self._init_parser('typescript'),
            'rust': self._init_parser('rust'),
        }
    
    def _init_parser(self, language: str) -> Parser:
        """Initialize Tree-sitter parser for language"""
        try:
            parser = Parser()
            parser.set_language(Language(f'tree-sitter-{language}', language))
            return parser
        except:
            return None
    
    async def analyze(self, code: str, language: str) -> Dict[str, Any]:
        """
        Perform static analysis with Tree-sitter AST parsing
        
        Returns:
            {
                "metrics": {...},
                "issues": [...],
                "ast_info": {...}
            }
        """
        issues = []
        metrics = {}
        ast_info = {}
        
        # Tree-sitter AST analysis
        if language in self.parsers and self.parsers[language]:
            ast_info = self._analyze_ast(code, language)
        
        # Traditional analysis
        if language == "python":
            traditional_metrics, traditional_issues = self._analyze_python(code)
        elif language in ["javascript", "typescript"]:
            traditional_metrics, traditional_issues = self._analyze_javascript(code)
        elif language == "rust":
            traditional_metrics, traditional_issues = self._analyze_rust(code)
        else:
            traditional_metrics, traditional_issues = self._analyze_generic(code)
        
        # Merge results
        metrics = {**traditional_metrics, **ast_info.get('metrics', {})}
        issues.extend(traditional_issues)
        issues.extend(ast_info.get('issues', []))
        
        return {
            "metrics": metrics,
            "issues": issues,
            "ast_info": ast_info,
        }
    
    def _analyze_ast(self, code: str, language: str) -> Dict[str, Any]:
        """Analyze code using Tree-sitter AST"""
        parser = self.parsers[language]
        if not parser:
            return {}
        
        try:
            tree = parser.parse(bytes(code, 'utf8'))
            root = tree.root_node
            
            metrics = {}
            issues = []
            
            # Count different node types
            node_counts = {}
            self._count_nodes(root, node_counts)
            
            # Language-specific analysis
            if language == 'python':
                metrics, issues = self._analyze_python_ast(root, node_counts)
            elif language in ['javascript', 'typescript']:
                metrics, issues = self._analyze_js_ast(root, node_counts)
            elif language == 'rust':
                metrics, issues = self._analyze_rust_ast(root, node_counts)
            
            return {
                'metrics': metrics,
                'issues': issues,
                'node_counts': node_counts,
                'tree_size': len(root.children),
                'parse_success': True
            }
            
        except Exception as e:
            return {
                'parse_success': False,
                'error': str(e)
            }
    
    def _count_nodes(self, node, counts: Dict[str, int]):
        """Recursively count node types"""
        node_type = node.type
        counts[node_type] = counts.get(node_type, 0) + 1
        
        for child in node.children:
            self._count_nodes(child, counts)
    
    def _analyze_python_ast(self, root, node_counts: Dict[str, int]) -> tuple[Dict, List]:
        """Python-specific AST analysis"""
        issues = []
        metrics = {}
        
        # Function count
        function_count = node_counts.get('function_definition', 0)
        metrics['functions'] = function_count
        
        # Class count
        class_count = node_counts.get('class_definition', 0)
        metrics['classes'] = class_count
        
        # Import analysis
        import_count = node_counts.get('import_statement', 0) + node_counts.get('import_from_statement', 0)
        metrics['imports'] = import_count
        
        # Complexity indicators
        loop_count = node_counts.get('for_statement', 0) + node_counts.get('while_statement', 0)
        if_count = node_counts.get('if_statement', 0)
        metrics['control_flow'] = loop_count + if_count
        
        # Issues
        if function_count > 20:
            issues.append({
                'type': 'complexity',
                'severity': 'medium',
                'message': f'Too many functions ({function_count}). Consider splitting into modules.',
                'line': None
            })
        
        if class_count > 10:
            issues.append({
                'type': 'complexity',
                'severity': 'medium',
                'message': f'Too many classes ({class_count}). Consider splitting into modules.',
                'line': None
            })
        
        return metrics, issues
    
    def _analyze_js_ast(self, root, node_counts: Dict[str, int]) -> tuple[Dict, List]:
        """JavaScript/TypeScript AST analysis"""
        issues = []
        metrics = {}
        
        # Function count
        function_count = node_counts.get('function_declaration', 0) + node_counts.get('arrow_function', 0)
        metrics['functions'] = function_count
        
        # Class count
        class_count = node_counts.get('class_declaration', 0)
        metrics['classes'] = class_count
        
        # Import analysis
        import_count = node_counts.get('import_statement', 0)
        metrics['imports'] = import_count
        
        # Complexity indicators
        loop_count = node_counts.get('for_statement', 0) + node_counts.get('while_statement', 0)
        if_count = node_counts.get('if_statement', 0)
        metrics['control_flow'] = loop_count + if_count
        
        return metrics, issues
    
    def _analyze_rust_ast(self, root, node_counts: Dict[str, int]) -> tuple[Dict, List]:
        """Rust AST analysis"""
        issues = []
        metrics = {}
        
        # Function count
        function_count = node_counts.get('function_item', 0)
        metrics['functions'] = function_count
        
        # Struct count
        struct_count = node_counts.get('struct_item', 0)
        metrics['structs'] = struct_count
        
        # Impl count
        impl_count = node_counts.get('impl_item', 0)
        metrics['impls'] = impl_count
        
        return metrics, issues
    
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
