'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Code, Database, Shield, Zap, FileText, Cpu, Globe, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CodeExample {
  id: string
  title: string
  description: string
  language: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  issues: number
  code: string
  icon: React.ReactNode
  tags: string[]
}

const CODE_EXAMPLES: CodeExample[] = [
  {
    id: '1',
    title: 'SQL Injection Vulnerability',
    description: 'Common security flaw in database queries',
    language: 'javascript',
    category: 'Security',
    difficulty: 'beginner',
    issues: 3,
    code: `const query = "SELECT * FROM users WHERE id = " + userId;
db.query(query, (err, results) => {
  if (err) throw err;
  console.log(results);
});`,
    icon: <Database className="w-5 h-5" />,
    tags: ['SQL Injection', 'Security', 'Database']
  },
  {
    id: '2',
    title: 'Memory Leak in React',
    description: 'Improper cleanup causing memory issues',
    language: 'javascript',
    category: 'Performance',
    difficulty: 'intermediate',
    issues: 2,
    code: `useEffect(() => {
  const interval = setInterval(() => {
    fetchData();
  }, 1000);
  
  // Missing cleanup!
}, [dependency]);`,
    icon: <Zap className="w-5 h-5" />,
    tags: ['Memory Leak', 'React', 'Performance']
  },
  {
    id: '3',
    title: 'Inefficient Algorithm',
    description: 'O(n²) complexity that can be optimized',
    language: 'python',
    category: 'Performance',
    difficulty: 'intermediate',
    issues: 2,
    code: `def find_duplicates(arr):
    duplicates = []
    for i in range(len(arr)):
        for j in range(i + 1, len(arr)):
            if arr[i] == arr[j] and arr[i] not in duplicates:
                duplicates.append(arr[i])
    return duplicates`,
    icon: <Cpu className="w-5 h-5" />,
    tags: ['Algorithm', 'Optimization', 'Python']
  },
  {
    id: '4',
    title: 'Async/Await Error Handling',
    description: 'Missing error handling in async operations',
    language: 'typescript',
    category: 'Reliability',
    difficulty: 'beginner',
    issues: 2,
    code: `async function getUserData(id: number) {
  const user = await fetchUser(id);
  const posts = await fetchUserPosts(id);
  // No error handling!
  return { user, posts };
}`,
    icon: <FileText className="w-5 h-5" />,
    tags: ['Async', 'Error Handling', 'TypeScript']
  },
  {
    id: '5',
    title: 'Race Condition',
    description: 'Concurrent access causing data inconsistency',
    language: 'javascript',
    category: 'Security',
    difficulty: 'advanced',
    issues: 3,
    code: `let balance = 100;

function withdraw(amount) {
  if (balance >= amount) {
    setTimeout(() => {
      balance -= amount;
      console.log('New balance:', balance);
    }, 100);
  }
}`,
    icon: <Lock className="w-5 h-5" />,
    tags: ['Race Condition', 'Concurrency', 'Security']
  },
  {
    id: '6',
    title: 'API Rate Limiting',
    description: 'Missing rate limiting on external API calls',
    language: 'python',
    category: 'Performance',
    difficulty: 'intermediate',
    issues: 2,
    code: `import requests

def fetch_user_data(user_ids):
    results = []
    for user_id in user_ids:
        response = requests.get(f"/api/users/{user_id}")
        results.append(response.json())
    return results`,
    icon: <Globe className="w-5 h-5" />,
    tags: ['API', 'Rate Limiting', 'Performance']
  }
]

interface CodeExampleGalleryProps {
  onSelectExample: (example: CodeExample | undefined) => void
  selectedExample?: CodeExample
}

export function CodeExampleGallery({ onSelectExample, selectedExample }: CodeExampleGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')

  const categories = ['all', ...Array.from(new Set(CODE_EXAMPLES.map(ex => ex.category)))]
  const difficulties = ['all', 'beginner', 'intermediate', 'advanced']

  const filteredExamples = CODE_EXAMPLES.filter(example => {
    const categoryMatch = selectedCategory === 'all' || example.category === selectedCategory
    const difficultyMatch = selectedDifficulty === 'all' || example.difficulty === selectedDifficulty
    return categoryMatch && difficultyMatch
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/15 text-green-200 border-green-500/30'
      case 'intermediate': return 'bg-yellow-500/15 text-yellow-200 border-yellow-500/30'
      case 'advanced': return 'bg-red-500/15 text-red-200 border-red-500/30'
      default: return 'bg-gray-500/15 text-gray-200 border-gray-500/30'
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex gap-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={cn(
                selectedCategory === category && "bg-primary text-primary-foreground"
              )}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          ))}
        </div>
        
        <div className="flex gap-2">
          {difficulties.map(difficulty => (
            <Button
              key={difficulty}
              variant={selectedDifficulty === difficulty ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDifficulty(difficulty)}
              className={cn(
                selectedDifficulty === difficulty && "bg-primary text-primary-foreground"
              )}
            >
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Examples Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredExamples.map((example, index) => (
            <motion.div
              key={example.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card 
                className={cn(
                  "surface-glass cursor-pointer transition-all duration-300 hover:shadow-glow hover:-translate-y-1",
                  selectedExample?.id === example.id && "ring-2 ring-primary"
                )}
                onClick={() => onSelectExample(example)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                        {example.icon}
                      </div>
                      <div>
                        <CardTitle className="text-sm font-medium">{example.title}</CardTitle>
                        <p className="text-xs text-muted-foreground">{example.category}</p>
                      </div>
                    </div>
                    <Badge className={getDifficultyColor(example.difficulty)}>
                      {example.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground mb-3">
                    {example.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {example.language}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {example.issues} issues
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {example.tags.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredExamples.length === 0 && (
        <div className="text-center py-12">
          <Code className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No examples found for the selected filters.</p>
        </div>
      )}
    </div>
  )
}
