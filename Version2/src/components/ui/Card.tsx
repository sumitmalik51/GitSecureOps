import React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'glass' | 'solid' | 'elevated'
  children: React.ReactNode
  hover?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'glass', hover = true, children, ...props }, ref) => {
    const baseClasses = 'rounded-2xl overflow-hidden no-blur-hover'
    
    const variants = {
      glass: 'glass-card',
      solid: 'bg-dark-card border border-dark-border shadow-lg',
      elevated: 'bg-dark-card border border-dark-border shadow-2xl'
    }

    const motionProps = hover ? {
      whileHover: { 
        scale: 1.02, 
        y: -4,
        rotateY: 1,
        rotateX: 0.5,
      },
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 20,
        duration: 0.3 
      }
    } : {}

    return (
      <motion.div
        ref={ref}
        className={cn(
          baseClasses, 
          variants[variant], 
          hover && 'card-hover-lift container-hover',
          className
        )}
        style={{
          transformStyle: 'preserve-3d',
        }}
        {...motionProps}
        {...props}
      >
        <div className="container-content card-text">
          {children}
        </div>
      </motion.div>
    )
  }
)

Card.displayName = 'Card'

export default Card
