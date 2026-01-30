'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Code, 
  Zap, 
  Shield, 
  Bug, 
  CheckCircle2, 
  AlertCircle, 
  BarChart3, 
  Terminal, 
  Sparkles, 
  ArrowRight, 
  Play, 
  Settings,
  TrendingUp,
  Clock,
  Target,
  Database,
  Cpu,
  Globe,
  Lock,
  FileText,
  AlertTriangle,
  Info
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { QualityGauge } from '@/components/quality-gauge'
import { CodeExampleGallery, CodeExample } from '@/components/code-example-gallery'
import { EnhancedEditor } from '@/components/enhanced-editor'

interface Issue {
  line: number
  column: number
  severity: 'error' | 'warning' | 'info'
  message: string
  type: string
}

interface AnalysisResult {
  score: number
  issues: Issue[]
  metrics: {
    complexity: string
    maintainability: string
    security: string
    performance: string
  }
  summary: string
  analysisTime: number
}

const EXAMPLE_ANALYSES: Record<string, AnalysisResult> = {
  '1': {
    score: 45,
    issues: [
      { line: 1, column: 1, severity: 'error', message: 'SQL injection vulnerability detected', type: 'Security' },
      { line: 1, column: 1, severity: 'warning', message: 'Unsanitized user input', type: 'Security' },
      { line: 3, column: 1, severity: 'info', message: 'Consider using parameterized queries', type: 'Best Practice' }
    ],
    metrics: {
      complexity: 'Low',
      maintainability: 'Poor',
      security: 'Critical',
      performance: 'Good'
    },
    summary: 'Critical security vulnerabilities found that could lead to data breaches.',
    analysisTime: 0.8
  },
  '2': {
    score: 65,
    issues: [
      { line: 5, column: 1, severity: 'warning', message: 'Missing cleanup in useEffect', type: 'Performance' },
      { line: 5, column: 1, severity: 'info', message: 'Potential memory leak detected', type: 'Performance' }
    ],
    metrics: {
      complexity: 'Medium',
      maintainability: 'Fair',
      security: 'Good',
      performance: 'Poor'
    },
    summary: 'Memory leak issues that could impact application performance over time.',
    analysisTime: 1.2
  },
  '3': {
    score: 72,
    issues: [
      { line: 2, column: 1, severity: 'warning', message: 'O(n²) time complexity detected', type: 'Performance' },
      { line: 2, column: 1, severity: 'info', message: 'Consider using Set for O(1) lookups', type: 'Optimization' }
    ],
    metrics: {
      complexity: 'High',
      maintainability: 'Good',
      security: 'Good',
      performance: 'Poor'
    },
    summary: 'Inefficient algorithm that can be optimized for better performance.',
    analysisTime: 0.6
  }
}

export default function CodeScanAI() {
  const [selectedExample, setSelectedExample] = useState<CodeExample | undefined>(undefined)
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [showGallery, setShowGallery] = useState(true)
  const [editorTheme, setEditorTheme] = useState('vs-dark')

  useEffect(() => {
    if (selectedExample) {
      setCode(selectedExample.code)
      setLanguage(selectedExample.language)
      setShowGallery(false)
    }
  }, [selectedExample])

  const analyzeCode = async () => {
    if (!code.trim()) return

    setIsAnalyzing(true)
    setResult(null)

    // Simulate analysis with realistic timing
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Use pre-defined analysis for examples or generate random results
    if (selectedExample && EXAMPLE_ANALYSES[selectedExample.id]) {
      setResult(EXAMPLE_ANALYSES[selectedExample.id])
    } else {
      // Generate random analysis for custom code
      const issues: Issue[] = []
      const numIssues = Math.floor(Math.random() * 5) + 1
      
      for (let i = 0; i < numIssues; i++) {
        const severities: ('error' | 'warning' | 'info')[] = ['error', 'warning', 'info']
        const types = ['Security', 'Performance', 'Style', 'Best Practice', 'Maintainability']
        
        issues.push({
          line: Math.floor(Math.random() * 20) + 1,
          column: Math.floor(Math.random() * 30) + 1,
          severity: severities[Math.floor(Math.random() * severities.length)],
          message: `Sample issue ${i + 1}: This needs attention`,
          type: types[Math.floor(Math.random() * types.length)]
        })
      }

      const score = Math.max(20, 100 - (issues.length * 15))
      
      setResult({
        score,
        issues,
        metrics: {
          complexity: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
          maintainability: ['Poor', 'Fair', 'Good', 'Excellent'][Math.floor(Math.random() * 4)],
          security: ['Critical', 'Poor', 'Fair', 'Good', 'Excellent'][Math.floor(Math.random() * 5)],
          performance: ['Poor', 'Fair', 'Good', 'Excellent'][Math.floor(Math.random() * 4)]
        },
        summary: `Analysis complete. Found ${issues.length} issues requiring attention.`,
        analysisTime: Math.random() * 2 + 0.5
      })
    }

    setIsAnalyzing(false)
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400'
    if (score >= 75) return 'text-yellow-400'
    if (score >= 60) return 'text-orange-400'
    return 'text-red-400'
  }

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'complexity': return <Cpu className="w-4 h-4" />
      case 'maintainability': return <FileText className="w-4 h-4" />
      case 'security': return <Shield className="w-4 h-4" />
      case 'performance': return <Zap className="w-4 h-4" />
      default: return <BarChart3 className="w-4 h-4" />
    }
  }

  const getMetricColor = (value: string) => {
    switch (value) {
      case 'Excellent': return 'text-emerald-400'
      case 'Good': return 'text-blue-400'
      case 'Fair': return 'text-yellow-400'
      case 'Poor': return 'text-orange-400'
      case 'Critical': return 'text-red-400'
      case 'High': return 'text-orange-400'
      case 'Medium': return 'text-yellow-400'
      case 'Low': return 'text-green-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full surface-glass-subtle z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-glow">
                <Code className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gradient">CodeScan AI</h1>
                <p className="text-xs text-muted-foreground">Enterprise Code Analysis</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGallery(!showGallery)}
                className="border-border hover:bg-muted/50"
              >
                {showGallery ? 'Hide' : 'Show'} Examples
              </Button>
              <Badge
                variant="secondary"
                className="bg-emerald-500/15 text-emerald-200 border-emerald-500/30"
              >
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400 pulse-glow" />
                Ready
              </Badge>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-muted/30 rounded-full px-4 py-2 mb-8 surface-glass-subtle">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent-foreground">Powered by Advanced AI</span>
            </div>
            
            <h1 className="text-6xl font-bold mb-6 leading-tight text-gradient animate-er-gradient">
              Intelligent
              <br />
              Code Analysis
            </h1>
            
            <p className="text-xl text-muted-foreground mb-12 leading-relaxed max-w-3xl mx-auto">
              Enterprise-grade code analysis with real-time issue detection, security vulnerability scanning, 
              and performance optimization recommendations.
            </p>
            
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center animate-er-float">
                <div className="text-3xl font-bold text-gradient">250ms</div>
                <div className="text-sm text-muted-foreground">Analysis Time</div>
              </div>
              <div className="text-center animate-er-float" style={{ animationDelay: '0.5s' }}>
                <div className="text-3xl font-bold text-gradient">99.9%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
              <div className="text-center animate-er-float" style={{ animationDelay: '1s' }}>
                <div className="text-3xl font-bold text-gradient">50+</div>
                <div className="text-sm text-muted-foreground">Languages</div>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card className="surface-glass hover:shadow-glow transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center mb-4">
                  <Bug className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg font-semibold">Real-time Detection</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Instant code analysis with inline highlighting and detailed issue explanations
                </p>
                <div className="flex items-center text-sm text-primary font-medium">
                  <ArrowRight className="w-4 h-4 mr-1" />
                  Learn more
                </div>
              </CardContent>
            </Card>

            <Card className="surface-glass hover:shadow-glow transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-secondary to-secondary/80 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg font-semibold">Security Scanning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Comprehensive vulnerability detection with OWASP compliance checking
                </p>
                <div className="flex items-center text-sm text-secondary font-medium">
                  <ArrowRight className="w-4 h-4 mr-1" />
                  Learn more
                </div>
              </CardContent>
            </Card>

            <Card className="surface-glass hover:shadow-glow transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent/80 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg font-semibold">Performance Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  AI-powered optimization suggestions with complexity analysis
                </p>
                <div className="flex items-center text-sm text-accent font-medium">
                  <ArrowRight className="w-4 h-4 mr-1" />
                  Learn more
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Code Example Gallery */}
      <AnimatePresence>
        {showGallery && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="py-20 px-6"
          >
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4 text-gradient">Try Example Analyses</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Explore real-world code examples with security vulnerabilities, performance issues, and best practice violations.
                </p>
              </div>
              
              <CodeExampleGallery 
                onSelectExample={setSelectedExample}
                selectedExample={selectedExample}
              />
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Main Analysis Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gradient">Analyze Your Code</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Upload your code or select an example to see enterprise-grade analysis in action.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="typescript">TypeScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="java">Java</SelectItem>
                <SelectItem value="cpp">C++</SelectItem>
                <SelectItem value="csharp">C#</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditorTheme(editorTheme === 'vs-dark' ? 'light' : 'vs-dark')}
              className="border-border hover:bg-muted/50"
            >
              {editorTheme === 'vs-dark' ? 'Light' : 'Dark'} Theme
            </Button>

            <Button
              onClick={analyzeCode}
              disabled={isAnalyzing || !code.trim()}
              className="bg-gradient-to-r from-primary to-accent text-white border-0 hover:opacity-90"
            >
              {isAnalyzing ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="mr-2"
                  >
                    <Settings className="w-4 h-4" />
                  </motion.div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Analyze Code
                </>
              )}
            </Button>
          </div>

          {/* Enhanced Editor */}
          <EnhancedEditor
            code={code}
            language={language}
            issues={result?.issues || []}
            onCodeChange={setCode}
            theme={editorTheme}
          />

          {/* Results Section */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-12"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Quality Score */}
                <Card className="surface-glass">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      Quality Score
                      <Clock className="w-5 h-5 text-muted-foreground" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center space-y-4">
                      <QualityGauge score={result.score} size={150} />
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getScoreColor(result.score)}`}>
                          {result.score}%
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {result.summary}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Analysis completed in {result.analysisTime.toFixed(1)}s
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Metrics */}
                <Card className="surface-glass">
                  <CardHeader>
                    <CardTitle className="text-lg">Code Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(result.metrics).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getMetricIcon(key)}
                            <span className="text-sm font-medium capitalize">{key}</span>
                          </div>
                          <Badge className={getMetricColor(value)}>
                            {value}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Issue Breakdown */}
                <Card className="surface-glass">
                  <CardHeader>
                    <CardTitle className="text-lg">Issue Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-red-400" />
                          <span className="text-sm">Critical</span>
                        </div>
                        <Badge variant="destructive" className="bg-red-500/15 text-red-200 border-red-500/30">
                          {result.issues.filter(i => i.severity === 'error').length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm">Warnings</span>
                        </div>
                        <Badge variant="secondary" className="bg-yellow-500/15 text-yellow-200 border-yellow-500/30">
                          {result.issues.filter(i => i.severity === 'warning').length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Info className="w-4 h-4 text-blue-400" />
                          <span className="text-sm">Suggestions</span>
                        </div>
                        <Badge variant="outline" className="bg-blue-500/15 text-blue-200 border-blue-500/30">
                          {result.issues.filter(i => i.severity === 'info').length}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 surface-glass-subtle">
                <Database className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">50+ Languages</h3>
              <p className="text-muted-foreground">Support for all major programming languages</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4 surface-glass-subtle">
                <BarChart3 className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Real-time Analysis</h3>
              <p className="text-muted-foreground">Instant feedback as you write code</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 surface-glass-subtle">
                <Shield className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Enterprise Security</h3>
              <p className="text-muted-foreground">SOC2 compliant with encryption</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 surface-glass-subtle">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
              <p className="text-muted-foreground">Sub-second analysis at scale</p>
            </div>
          </div>

          <footer className="mt-14 border-t border-border py-10 text-center">
            <p className="text-sm text-muted-foreground">© 2026 CodeScan AI. Enterprise Code Analysis Platform.</p>
          </footer>
        </div>
      </section>
    </div>
  )
}
