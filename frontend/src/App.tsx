import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Zap, Shield, BarChart3, Globe, Play, Code, Bug, Terminal, Settings, AlertCircle, AlertTriangle, Info, Clock, Cpu, FileText, Database } from 'lucide-react';

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [code, setCode] = useState(`// Example vulnerable code
const query = "SELECT * FROM users WHERE id = " + userId;
db.query(query);`);
  const [issues, setIssues] = useState<Array<{line: number, severity: string, message: string, type: string}>>([]);
  const [score, setScore] = useState(0);

  const analyzeCode = async () => {
    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIssues([
      { line: 2, severity: 'error', message: 'SQL injection vulnerability', type: 'Security' },
      { line: 2, severity: 'warning', message: 'Unsanitized user input', type: 'Security' }
    ]);
    setScore(45);
    setIsAnalyzing(false);
  };

  return (
    <main className="min-h-screen bg-[#0A0E27] text-white overflow-hidden relative selection:bg-blue-500/30 font-sans">
      
      {/* 1. ATMOSPHERE (The "Enterprise" Glow) */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      {/* 2. NAVBAR (Floating Glass) */}
      <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-8 py-3 flex items-center gap-12 shadow-2xl">
          <div className="font-bold text-xl tracking-tighter bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            CodeScan AI
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
            {['Product', 'Solutions', 'Enterprise', 'Pricing'].map((item) => (
              <a key={item} href="#" className="hover:text-white transition-colors">{item}</a>
            ))}
          </div>
          <button className="bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-full text-sm font-medium transition-all border border-white/5">
            Sign In
          </button>
        </div>
      </nav>

      {/* 3. HERO SECTION (The Big Structure) */}
      <div className="relative pt-40 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Security V2.0 Live
        </div>

        {/* HEADLINE */}
        <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-8 bg-gradient-to-b from-white via-white/90 to-white/50 bg-clip-text text-transparent max-w-5xl">
          Intelligent Code Security
        </h1>

        {/* SUBTITLE */}
        <p className="text-xl text-gray-400 max-w-2xl mb-12 leading-relaxed">
          Enterprise-grade static analysis with real-time vulnerability detection and automated refactoring pipelines.
        </p>

        {/* CTA BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-6 mb-20">
          <button 
            onClick={analyzeCode}
            disabled={isAnalyzing}
            className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-semibold text-lg transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] flex items-center gap-2 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Settings className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Terminal className="w-5 h-5" />
                Analyze Code
              </>
            )}
          </button>
          <button className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-semibold text-lg backdrop-blur-md transition-all flex items-center gap-2">
            <Play className="w-5 h-5 fill-current" />
            Watch Demo
          </button>
        </div>

        {/* 4. THE METRIC GLASS BAR (The EnterpriseRAG Signature) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-white/10">
            <div className="text-5xl font-bold text-white mb-2 tracking-tight">250ms</div>
            <div className="text-sm font-medium text-blue-200/60 uppercase tracking-widest">Latency</div>
          </div>
          
          <div className="relative flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-white/10">
            <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-2 tracking-tight">0</div>
            <div className="text-sm font-medium text-blue-200/60 uppercase tracking-widest">False Positives</div>
          </div>
          
          <div className="relative flex flex-col items-center justify-center p-4">
            <div className="text-5xl font-bold text-white mb-2 tracking-tight">50+</div>
            <div className="text-sm font-medium text-blue-200/60 uppercase tracking-widest">Languages</div>
          </div>
        </div>

      </div>

      {/* 5. INTERACTIVE CODE ANALYSIS SECTION */}
      <div className="max-w-7xl mx-auto px-6 pb-32">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
            Try Live Analysis
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Experience real-time vulnerability detection with our interactive code analyzer.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Code Editor */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="ml-3 text-sm text-gray-400">main.js</span>
              </div>
              <button 
                onClick={analyzeCode}
                disabled={isAnalyzing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Settings className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Terminal className="w-4 h-4" />
                    Analyze Code
                  </>
                )}
              </button>
            </div>
            <div className="bg-black/50 rounded-lg p-4 font-mono text-sm">
              <pre className="text-green-400">{code}</pre>
            </div>
          </div>

          {/* Results Panel */}
          <div className="space-y-6">
            {/* Score Card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Security Score</h3>
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-center">
                <div className={`text-6xl font-bold mb-2 ${score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {score || '--'}
                </div>
                <div className="text-sm text-gray-400">
                  {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Improvement'}
                </div>
              </div>
            </div>

            {/* Issues Found */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Issues Found</h3>
                <AlertCircle className="w-6 h-6 text-orange-400" />
              </div>
              <div className="space-y-3">
                {issues.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No issues detected</p>
                ) : (
                  issues.map((issue, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                      {issue.severity === 'error' && <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />}
                      {issue.severity === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />}
                      {issue.severity === 'info' && <Info className="w-5 h-5 text-blue-400 mt-0.5" />}
                      <div className="flex-1">
                        <div className="font-medium text-white">{issue.message}</div>
                        <div className="text-sm text-gray-400">Line {issue.line} • {issue.type}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. FEATURE GRID (Glassmorphism) */}
      <div className="max-w-7xl mx-auto px-6 pb-32">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Bug className="w-7 h-7 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Real-time Detection</h3>
            <p className="text-gray-400 leading-relaxed">
              Instant vulnerability scanning as you code with contextual security recommendations.
            </p>
          </div>

          <div className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Shield className="w-7 h-7 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">OWASP Compliance</h3>
            <p className="text-gray-400 leading-relaxed">
              Comprehensive security scanning with automated compliance checking and reporting.
            </p>
          </div>

          <div className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-7 h-7 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Auto-Remediation</h3>
            <p className="text-gray-400 leading-relaxed">
              AI-powered code fixes with one-click remediation for common security issues.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
