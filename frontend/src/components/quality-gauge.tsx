'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface QualityGaugeProps {
  score: number
  size?: number
  strokeWidth?: number
  className?: string
}

export function QualityGauge({ 
  score, 
  size = 120, 
  strokeWidth = 8, 
  className 
}: QualityGaugeProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (score / 100) * circumference

  const getColor = (score: number) => {
    if (score >= 90) return '#10b981' // emerald
    if (score >= 75) return '#eab308' // yellow
    if (score >= 60) return '#f97316' // orange
    return '#ef4444' // red
  }

  const getLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 75) return 'Good'
    if (score >= 60) return 'Fair'
    return 'Poor'
  }

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(score)}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-2xl font-bold text-white"
        >
          {score}%
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="text-xs text-muted-foreground"
        >
          {getLabel(score)}
        </motion.div>
      </div>
    </div>
  )
}
