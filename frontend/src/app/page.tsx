'use client'

import { useState } from 'react'
import Editor from '@monaco-editor/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, CheckCircle2, Zap, Clock, TrendingUp } from 'lucide-react'

interface Issue {
  type: string
  severity: string
  line: number | null
  message: string
  suggestion: string | null
}

interface AnalysisResult {
  metrics: Record<string, any>
  issues: Issue[]
  summary: string
  score: number
  analysis_time_ms: number
}

export default function Home() {
  const [code, setCode] = useState(SAMPLE_CODE)
  const [language, setLanguage] = useState('python')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600'
      case 'high': return 'bg-orange-600'
      case 'medium': return 'bg-yellow-600'
      case 'low': return 'bg-blue-600'
      default: return 'bg-gray-600'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">CodeScan AI</h1>
              <p className="text-sm text-gray-400">
                Intelligent code analysis powered by Claude Sonnet 4
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-blue-400 border-blue-400">
                <Zap className="w-3 h-3 mr-1" />
                &lt;3s Analysis
              </Badge>
              <Badge variant="outline" className="text-green-400 border-green-400">
                ⭐ 1.2K Stars
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Editor */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Code Editor</CardTitle>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-[180px] bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="typescript">TypeScript</SelectItem>
                    <SelectItem value="rust">Rust</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Editor
                height="500px"
                language={language}
                value={code}
                onChange={(value) => setCode(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                }}
              />
              
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700"
              >
                {isAnalyzing ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Analyze Code
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Right: Results */}
          <div className="space-y-6">
            {result && (
              <>
                {/* Score Card */}
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Analysis Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-4">
                      <div className={`text-6xl font-bold ${getScoreColor(result.score)}`}>
                        {result.score}
                      </div>
                      <div className="text-gray-400 text-sm">Quality Score</div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-white">
                          {result.issues.length}
                        </div>
                        <div className="text-xs text-gray-400">Issues Found</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">
                          {result.metrics.loc || 0}
                        </div>
                        <div className="text-xs text-gray-400">Lines of Code</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">
                          {result.analysis_time_ms.toFixed(0)}ms
                        </div>
                        <div className="text-xs text-gray-400">Analysis Time</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Summary */}
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      AI Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300">{result.summary}</p>
                  </CardContent>
                </Card>

                {/* Issues */}
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Issues Detected</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {result.issues.length === 0 ? (
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>No issues found! Clean code.</span>
                      </div>
                    ) : (
                      result.issues.map((issue, i) => (
                        <div key={i} className="border border-gray-700 rounded p-3">
                          <div className="flex items-start gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 text-orange-400" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={getSeverityColor(issue.severity)}>
                                  {issue.severity}
                                </Badge>
                                <Badge variant="outline" className="text-gray-400">
                                  {issue.type}
                                </Badge>
                                {issue.line && (
                                  <span className="text-xs text-gray-500">
                                    Line {issue.line}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-white">{issue.message}</p>
                              {issue.suggestion && (
                                <p className="text-xs text-gray-400 mt-1">
                                  💡 {issue.suggestion}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const SAMPLE_CODE = `def calculate_fibonacci(n):
    if n <= 1:
        return n
    return calculate_fibonacci(n-1) + calculate_fibonacci(n-2)

# This has performance issues - exponential time complexity!
result = calculate_fibonacci(35)
print(result)`
