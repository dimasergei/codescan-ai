'use client'

import { useEffect, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Issue {
  line: number
  column: number
  severity: 'error' | 'warning' | 'info'
  message: string
  type: string
}

interface EnhancedEditorProps {
  code: string
  language: string
  issues: Issue[]
  onCodeChange: (code: string) => void
  theme?: string
}

export function EnhancedEditor({ 
  code, 
  language, 
  issues, 
  onCodeChange, 
  theme = 'vs-dark' 
}: EnhancedEditorProps) {
  const editorRef = useRef<any>(null)
  const [decorations, setDecorations] = useState<string[]>([])
  const [hoveredIssue, setHoveredIssue] = useState<Issue | null>(null)

  useEffect(() => {
    if (!editorRef.current) return

    const editor = editorRef.current
    const monaco = editor.getModel()?.getLanguageConfiguration()

    // Clear existing decorations
    const existingDecorations = editor.deltaDecorations([], [])
    
    // Create new decorations for issues
    const newDecorations = issues.map(issue => {
      const severityColors = {
        error: 'rgba(239, 68, 68, 0.3)',
        warning: 'rgba(245, 158, 11, 0.3)',
        info: 'rgba(59, 130, 246, 0.3)'
      }

      const severityBorders = {
        error: '2px solid rgba(239, 68, 68, 0.8)',
        warning: '2px solid rgba(245, 158, 11, 0.8)',
        info: '2px solid rgba(59, 130, 246, 0.8)'
      }

      return {
        range: new monaco.Range(
          issue.line,
          issue.column,
          issue.line,
          issue.column + 1
        ),
        options: {
          className: `issue-decoration-${issue.severity}`,
          isWholeLine: true,
          minimap: {
            color: severityColors[issue.severity],
            position: 1
          },
          glyphMarginClassName: `issue-glyph-${issue.severity}`,
          hoverMessage: {
            value: `[${issue.severity.toUpperCase()}] ${issue.message}`,
          }
        }
      }
    })

    const decorationIds = editor.deltaDecorations(existingDecorations, newDecorations)
    setDecorations(decorationIds)

    // Add custom styles
    const style = document.createElement('style')
    style.textContent = `
      .issue-decoration-error {
        background-color: rgba(239, 68, 68, 0.1);
        border-left: 3px solid rgba(239, 68, 68, 0.8);
      }
      .issue-decoration-warning {
        background-color: rgba(245, 158, 11, 0.1);
        border-left: 3px solid rgba(245, 158, 11, 0.8);
      }
      .issue-decoration-info {
        background-color: rgba(59, 130, 246, 0.1);
        border-left: 3px solid rgba(59, 130, 246, 0.8);
      }
      .issue-glyph-error::before {
        content: '❌';
        color: rgba(239, 68, 68, 0.8);
      }
      .issue-glyph-warning::before {
        content: '⚠️';
        color: rgba(245, 158, 11, 0.8);
      }
      .issue-glyph-info::before {
        content: 'ℹ️';
        color: rgba(59, 130, 246, 0.8);
      }
    `
    document.head.appendChild(style)

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style)
      }
    }
  }, [issues])

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor
    
    // Configure editor for better issue visualization
    editor.updateOptions({
      glyphMargin: true,
      lineNumbersMinChars: 3,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      fontSize: 13,
      fontFamily: 'JetBrains Mono, monospace',
      renderLineHighlight: 'line',
      renderValidationDecorations: 'on',
    })
  }

  const getIssueIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case 'info': return <Info className="w-4 h-4 text-blue-400" />
      default: return <Info className="w-4 h-4 text-gray-400" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'border-red-500/30 bg-red-500/10'
      case 'warning': return 'border-yellow-500/30 bg-yellow-500/10'
      case 'info': return 'border-blue-500/30 bg-blue-500/10'
      default: return 'border-gray-500/30 bg-gray-500/10'
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Editor */}
      <div className="lg:col-span-3">
        <div className="surface-glass rounded-lg overflow-hidden border border-border">
          <Editor
            height="500px"
            language={language}
            value={code}
            onChange={(value) => onCodeChange(value || '')}
            theme={theme}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: true },
              fontSize: 13,
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              glyphMargin: true,
              lineNumbersMinChars: 3,
              renderLineHighlight: 'line',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          />
        </div>
      </div>

      {/* Issues Panel */}
      <div className="lg:col-span-1">
        <div className="surface-glass rounded-lg p-4 border border-border">
          <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
            Issues Found
            <Badge variant="secondary" className="bg-primary/15 text-primary-foreground border-primary/20">
              {issues.length}
            </Badge>
          </h3>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {issues.map((issue, index) => (
                <motion.div
                  key={`${issue.line}-${issue.column}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all duration-200",
                    getSeverityColor(issue.severity),
                    hoveredIssue?.line === issue.line && hoveredIssue?.column === issue.column && "ring-2 ring-primary/50"
                  )}
                  onMouseEnter={() => setHoveredIssue(issue)}
                  onMouseLeave={() => setHoveredIssue(null)}
                  onClick={() => {
                    // Focus the editor on the issue line
                    if (editorRef.current) {
                      editorRef.current.setPosition({
                        lineNumber: issue.line,
                        column: issue.column
                      })
                      editorRef.current.revealLineInCenter(issue.line)
                      editorRef.current.focus()
                    }
                  }}
                >
                  <div className="flex items-start space-x-2">
                    {getIssueIcon(issue.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          Line {issue.line}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {issue.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-foreground break-words">
                        {issue.message}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {issues.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No issues found!</p>
            </div>
          )}
        </div>

        {/* Issue Summary */}
        <div className="surface-glass rounded-lg p-4 border border-border mt-4">
          <h4 className="text-sm font-semibold mb-3">Issue Summary</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm">Errors</span>
              </div>
              <Badge variant="destructive" className="bg-red-500/15 text-red-200 border-red-500/30">
                {issues.filter(i => i.severity === 'error').length}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span className="text-sm">Warnings</span>
              </div>
              <Badge variant="secondary" className="bg-yellow-500/15 text-yellow-200 border-yellow-500/30">
                {issues.filter(i => i.severity === 'warning').length}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4 text-blue-400" />
                <span className="text-sm">Info</span>
              </div>
              <Badge variant="outline" className="bg-blue-500/15 text-blue-200 border-blue-500/30">
                {issues.filter(i => i.severity === 'info').length}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
