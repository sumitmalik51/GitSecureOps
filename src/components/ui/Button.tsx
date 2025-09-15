import React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false, 
    children, 
    disabled,
    ...props 
  }, ref) => {
    const baseClasses = 'no-blur-hover relative inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed'
    
    const variants = {
      primary: 'bg-brand-primary hover:bg-brand-primary/90 text-white focus:ring-brand-primary/50 hover:shadow-lg disabled:bg-brand-primary/60 disabled:hover:bg-brand-primary/60',
      secondary: 'bg-brand-secondary hover:bg-brand-secondary/90 text-white focus:ring-brand-secondary/50 hover:shadow-lg disabled:bg-brand-secondary/60 disabled:hover:bg-brand-secondary/60',
      ghost: 'bg-transparent hover:bg-white/10 text-dark-text border border-dark-border focus:ring-brand-primary/50 hover:text-dark-text hover:border-brand-primary/50 disabled:text-dark-text/50 disabled:hover:bg-transparent disabled:hover:text-dark-text/50',
      outline: 'bg-transparent hover:bg-brand-primary hover:text-white text-brand-primary border border-brand-primary focus:ring-brand-primary/50 hover:border-brand-primary disabled:text-brand-primary/50 disabled:border-brand-primary/50 disabled:hover:bg-transparent disabled:hover:text-brand-primary/50'
    }
    
    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg'
    }

    const motionProps = {
      whileHover: { scale: 1.02, y: -1 },
      whileTap: { scale: 0.98 },
      transition: { type: "spring", stiffness: 400, damping: 25, duration: 0.15 }
    }

    return (
      <motion.button
        ref={ref}
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...motionProps}
        {...props}
      >
        {loading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {children}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export default Button
