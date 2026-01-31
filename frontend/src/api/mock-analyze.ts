export interface AnalysisResult {
  score: number;
  issues: Array<{
    line: number;
    severity: 'error' | 'warning' | 'info';
    message: string;
    type: string;
    suggestion?: string;
  }>;
  metrics: {
    complexity: 'Low' | 'Medium' | 'High';
    maintainability: 'Poor' | 'Fair' | 'Good' | 'Excellent';
    security: 'Critical' | 'Poor' | 'Fair' | 'Good' | 'Excellent';
    performance: 'Poor' | 'Fair' | 'Good' | 'Excellent';
  };
  summary: string;
  analysisTime: number;
}

// Mock analysis function for Vite SPA (will be replaced with real API)
export async function analyzeCode(code: string, language: string = 'javascript'): Promise<AnalysisResult> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Mock analysis based on code content
  const issues = [];
  let score = 85;

  if (code.includes('SELECT') && code.includes('+')) {
    issues.push({
      line: code.split('\n').findIndex(line => line.includes('SELECT') && line.includes('+')) + 1,
      severity: 'error' as const,
      message: 'SQL injection vulnerability detected',
      type: 'Security',
      suggestion: 'Use parameterized queries or prepared statements'
    });
    score -= 25;
  }

  if (code.includes('eval(')) {
    issues.push({
      line: code.split('\n').findIndex(line => line.includes('eval')) + 1,
      severity: 'error' as const,
      message: 'Use of eval() function is dangerous',
      type: 'Security',
      suggestion: 'Avoid eval() and use safer alternatives'
    });
    score -= 20;
  }

  if (code.includes('console.log')) {
    issues.push({
      line: code.split('\n').findIndex(line => line.includes('console.log')) + 1,
      severity: 'warning' as const,
      message: 'Console.log statements should be removed in production',
      type: 'Best Practice',
      suggestion: 'Remove or replace with proper logging'
    });
    score -= 5;
  }

  return {
    score: Math.max(0, score),
    issues,
    metrics: {
      complexity: code.length > 500 ? 'High' : code.length > 200 ? 'Medium' : 'Low',
      maintainability: score > 70 ? 'Good' : score > 50 ? 'Fair' : 'Poor',
      security: issues.filter(i => i.type === 'Security').length > 0 ? 'Poor' : 'Good',
      performance: 'Good'
    },
    summary: `Analysis complete. Found ${issues.length} issues requiring attention.`,
    analysisTime: 1.5
  };
}
