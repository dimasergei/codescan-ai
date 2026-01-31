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

export async function analyzeCode(code: string, language: string = 'javascript'): Promise<AnalysisResult> {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, language }),
    });

    if (!response.ok) {
      throw new Error('Analysis failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
}
