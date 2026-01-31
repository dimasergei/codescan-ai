import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { code, language } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const prompt = `You are a senior code security and performance auditor. Analyze the following ${language || 'javascript'} code and provide a comprehensive security and performance audit.

Code to analyze:
\`\`\`${language || 'javascript'}
${code}
\`\`\`

Please respond with a JSON object containing:
1. score: Overall security score (0-100)
2. issues: Array of issues with line number, severity (error/warning/info), message, type, and suggestion
3. metrics: Object with complexity, maintainability, security, and performance ratings
4. summary: Brief analysis summary
5. analysisTime: Estimated analysis time in seconds

Example format:
{
  "score": 75,
  "issues": [
    {
      "line": 2,
      "severity": "error",
      "message": "SQL injection vulnerability",
      "type": "Security",
      "suggestion": "Use parameterized queries instead"
    }
  ],
  "metrics": {
    "complexity": "Medium",
    "maintainability": "Good",
    "security": "Fair",
    "performance": "Good"
  },
  "summary": "Code has potential security vulnerabilities that should be addressed.",
  "analysisTime": 1.5
}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!response.ok) {
      console.error('Gemini API error:', await response.text());
      return NextResponse.json({ error: 'Analysis service unavailable' }, { status: 500 });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json({ error: 'No analysis generated' }, { status: 500 });
    }

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Invalid analysis format' }, { status: 500 });
    }

    const analysisResult = JSON.parse(jsonMatch[0]);
    
    return NextResponse.json(analysisResult);

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
