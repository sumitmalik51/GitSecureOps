import React, { forwardRef } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { animationVariants, microInteractions } from '../../utils/animations'

// Enhanced Card variants with accessibility considerations
export type CardVariant = 'default' | 'glass' | 'solid' | 'elevated' | 'feature' | 'stats' | 'interactive' | 'gradient'
export type CardSize = 'sm' | 'md' | 'lg' | 'xl'

interface CardProps extends Omit<HTMLMotionProps<"div">, 'variants'> {
  variant?: CardVariant
  size?: CardSize
  hover?: boolean
  interactive?: boolean
  focused?: boolean
  loading?: boolean
  error?: boolean
  children: React.ReactNode
  className?: string
  // Accessibility props
  'aria-label'?: string
  'aria-describedby'?: string
  role?: string
  tabIndex?: number
}

const EnhancedCard = forwardRef<HTMLDivElement, CardProps>(
  ({ 
    variant = 'default',
    size = 'md',
    hover = false,
    interactive = false,
    focused = false,
    loading = false,
    error = false,
    children,
    className = '',
    role,
    tabIndex,
    ...props 
  }, ref) => {
    // Base styles for all cards
    const baseStyles = 'rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-dark-bg'
    
    // Size-based styles
    const sizeStyles = {
      sm: 'p-3 text-sm',
      md: 'p-4',
      lg: 'p-6 text-lg',
      xl: 'p-8 text-xl'
    }
    
    // Variant-based styles
    const variantStyles = {
      default: 'bg-dark-card border-dark-border text-dark-text shadow-sm hover:shadow-md',
      glass: 'bg-dark-card/50 backdrop-blur-md border-dark-border/50 text-dark-text shadow-lg hover:shadow-xl hover:bg-dark-card/60',
      solid: 'bg-dark-card border-dark-border text-dark-text shadow-md hover:shadow-lg',
      elevated: 'bg-dark-card border-dark-border text-dark-text shadow-lg hover:shadow-xl hover:-translate-y-1',
      feature: 'bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 border-brand-primary/20 text-dark-text shadow-md hover:shadow-lg hover:from-brand-primary/15 hover:to-brand-secondary/15',
      stats: 'bg-dark-card border-l-4 border-l-brand-primary border-r-0 border-t-0 border-b-0 text-dark-text shadow-sm hover:shadow-md hover:border-l-brand-secondary',
      interactive: 'bg-dark-card border-dark-border text-dark-text shadow-md hover:shadow-lg cursor-pointer hover:border-brand-primary/50 active:scale-98',
      gradient: 'bg-gradient-to-br from-brand-primary/20 via-brand-secondary/10 to-brand-accent/20 border-brand-primary/30 text-dark-text shadow-lg hover:shadow-xl'
    }
    
    // State-based styles
    const stateStyles = {
      loading: 'animate-pulse pointer-events-none',
      error: 'border-red-500/50 bg-red-500/5 text-red-400',
      focused: 'ring-2 ring-brand-primary ring-offset-2 ring-offset-dark-bg',
    }
    
    // Animation variants based on interactivity
    const getAnimationProps = () => {
      if (loading) {
        return {
          variants: animationVariants.pulse,
          animate: "animate"
        }
      }
      
      if (interactive || hover) {
        return {
          whileHover: microInteractions.subtle.hover,
          whileTap: microInteractions.subtle.tap,
          variants: animationVariants.cardEntry,
          initial: "initial",
          animate: "animate",
          exit: "exit"
        }
      }
      
      return {
        variants: animationVariants.cardEntry,
        initial: "initial",
        animate: "animate",
        exit: "exit"
      }
    }
    
    // Combine all styles
    const combinedStyles = [
      baseStyles,
      sizeStyles[size],
      variantStyles[variant],
      loading && stateStyles.loading,
      error && stateStyles.error,
      focused && stateStyles.focused,
      className
    ].filter(Boolean).join(' ')
    
    // Accessibility props
    const accessibilityProps = {
      role: role || (interactive ? 'button' : undefined),
      tabIndex: interactive ? (tabIndex ?? 0) : tabIndex,
      'aria-disabled': loading,
      'aria-invalid': error,
      ...props
    }
    
    return (
      <motion.div
        ref={ref}
        className={combinedStyles}
        {...getAnimationProps()}
        {...accessibilityProps}
        onKeyDown={(e) => {
          // Handle Enter and Space for interactive cards
          if (interactive && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            props.onClick?.(e as any)
          }
          props.onKeyDown?.(e as any)
        }}
      >
        {loading ? (
          <div className="space-y-3">
            <div className="h-4 bg-dark-border rounded animate-pulse"></div>
            <div className="h-4 bg-dark-border rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-dark-border rounded w-1/2 animate-pulse"></div>
          </div>
        ) : (
          children
        )}
      </motion.div>
    )
  }
)

EnhancedCard.displayName = 'EnhancedCard'

// Additional Card components for specific use cases

// Card Header with enhanced typography
export const CardHeader: React.FC<{ 
  title: string
  subtitle?: string
  icon?: React.ReactNode
  className?: string
  actions?: React.ReactNode
}> = ({ title, subtitle, icon, className = '', actions }) => (
  <motion.div 
    className={`flex items-center justify-between mb-4 ${className}`}
    variants={animationVariants.staggerItem}
  >
    <div className="flex items-center space-x-3">
      {icon && (
        <motion.div
          className="flex-shrink-0"
          whileHover={microInteractions.icon.hover}
          whileTap={microInteractions.icon.tap}
        >
          {icon}
        </motion.div>
      )}
      <div>
        <h3 className="text-lg font-semibold text-dark-text">{title}</h3>
        {subtitle && <p className="text-sm text-dark-text-muted">{subtitle}</p>}
      </div>
    </div>
    {actions && <div className="flex items-center space-x-2">{actions}</div>}
  </motion.div>
)

// Card Content with proper spacing
export const CardContent: React.FC<{ 
  children: React.ReactNode
  className?: string
}> = ({ children, className = '' }) => (
  <motion.div 
    className={`text-dark-text ${className}`}
    variants={animationVariants.staggerItem}
  >
    {children}
  </motion.div>
)

// Card Footer with actions
export const CardFooter: React.FC<{ 
  children: React.ReactNode
  className?: string
}> = ({ children, className = '' }) => (
  <motion.div 
    className={`mt-4 pt-4 border-t border-dark-border flex items-center justify-end space-x-2 ${className}`}
    variants={animationVariants.staggerItem}
  >
    {children}
  </motion.div>
)

// Stat Card for metrics
export const StatCard: React.FC<{
  title: string
  value: string | number
  change?: { value: number; trend: 'up' | 'down' | 'neutral' }
  icon?: React.ReactNode
  description?: string
  className?: string
}> = ({ title, value, change, icon, description, className = '' }) => (
  <EnhancedCard variant="stats" className={className} interactive>
    <motion.div 
      className="flex items-center justify-between"
      variants={animationVariants.staggerContainer}
      initial="initial"
      animate="animate"
    >
      <div className="flex-1">
        <motion.p 
          className="text-dark-text-muted text-sm font-medium"
          variants={animationVariants.staggerItem}
        >
          {title}
        </motion.p>
        <motion.p 
          className="text-2xl font-bold text-dark-text mt-1"
          variants={animationVariants.countUp}
        >
          {value}
        </motion.p>
        {description && (
          <motion.p 
            className="text-dark-text-muted text-xs mt-1"
            variants={animationVariants.staggerItem}
          >
            {description}
          </motion.p>
        )}
        {change && (
          <motion.div 
            className={`flex items-center mt-2 text-xs ${
              change.trend === 'up' ? 'text-green-500' : 
              change.trend === 'down' ? 'text-red-500' : 
              'text-gray-500'
            }`}
            variants={animationVariants.staggerItem}
          >
            <span className="mr-1">
              {change.trend === 'up' ? '↗' : change.trend === 'down' ? '↘' : '→'}
            </span>
            {Math.abs(change.value)}%
          </motion.div>
        )}
      </div>
      {icon && (
        <motion.div 
          className="ml-4 flex-shrink-0"
          variants={animationVariants.staggerItem}
          whileHover={microInteractions.icon.hover}
        >
          {icon}
        </motion.div>
      )}
    </motion.div>
  </EnhancedCard>
)

export default EnhancedCard
