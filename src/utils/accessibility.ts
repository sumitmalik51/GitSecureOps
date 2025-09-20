// Accessibility utilities for WCAG compliance

import { useEffect, useState } from 'react'

// Screen reader utilities
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.setAttribute('class', 'sr-only')
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// Focus management
export const trapFocus = (containerElement: HTMLElement) => {
  const focusableElements = containerElement.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>
  
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]
  
  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }
    
    if (e.key === 'Escape') {
      // Allow escape to close modals/menus
      containerElement.dispatchEvent(new CustomEvent('escape-pressed'))
    }
  }
  
  containerElement.addEventListener('keydown', handleTabKey)
  
  // Focus first element
  firstElement?.focus()
  
  return () => {
    containerElement.removeEventListener('keydown', handleTabKey)
  }
}

// Color contrast utilities
export const getContrastRatio = (color1: string, color2: string): number => {
  const getRGB = (color: string) => {
    const hex = color.replace('#', '')
    return {
      r: parseInt(hex.substr(0, 2), 16),
      g: parseInt(hex.substr(2, 2), 16),
      b: parseInt(hex.substr(4, 2), 16)
    }
  }
  
  const getLuminance = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }
  
  const rgb1 = getRGB(color1)
  const rgb2 = getRGB(color2)
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b)
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b)
  
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)
  
  return (brightest + 0.05) / (darkest + 0.05)
}

export const meetsWCAGContrast = (color1: string, color2: string, level: 'AA' | 'AAA' = 'AA'): boolean => {
  const ratio = getContrastRatio(color1, color2)
  return level === 'AA' ? ratio >= 4.5 : ratio >= 7
}

// Reduced motion detection
export const useReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    
    const handler = () => setPrefersReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener('change', handler)
    
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])
  
  return prefersReducedMotion
}

// Keyboard navigation utilities
export const useKeyboardNavigation = (onEscape?: () => void) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onEscape?.()
          break
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onEscape])
}

// ARIA utilities
export const generateId = (prefix: string = 'id'): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

export const setAriaExpanded = (element: HTMLElement, expanded: boolean) => {
  element.setAttribute('aria-expanded', expanded.toString())
}

export const setAriaSelected = (element: HTMLElement, selected: boolean) => {
  element.setAttribute('aria-selected', selected.toString())
}

// Screen reader only text utility
export const createScreenReaderText = (text: string): string => {
  return `<span class="sr-only">${text}</span>`
}

// Focus management hook
export const useFocusManagement = (isOpen: boolean, containerRef: React.RefObject<HTMLElement>) => {
  const [previouslyFocusedElement, setPreviouslyFocusedElement] = useState<HTMLElement | null>(null)
  
  useEffect(() => {
    if (isOpen && containerRef.current) {
      // Store currently focused element
      setPreviouslyFocusedElement(document.activeElement as HTMLElement)
      
      // Trap focus within container
      const cleanup = trapFocus(containerRef.current)
      
      return cleanup
    } else if (!isOpen && previouslyFocusedElement) {
      // Restore focus to previously focused element
      previouslyFocusedElement.focus()
      setPreviouslyFocusedElement(null)
    }
  }, [isOpen, containerRef, previouslyFocusedElement])
}

// High contrast mode detection
export const useHighContrastMode = (): boolean => {
  const [isHighContrast, setIsHighContrast] = useState(false)
  
  useEffect(() => {
    const checkHighContrast = () => {
      // Check for Windows high contrast mode
      const testElement = document.createElement('div')
      testElement.style.border = '1px solid'
      testElement.style.borderColor = 'rgb(31, 41, 55)' // bg-gray-800
      testElement.style.position = 'absolute'
      testElement.style.top = '-9999px'
      document.body.appendChild(testElement)
      
      const computedStyle = window.getComputedStyle(testElement)
      const isHighContrastDetected = computedStyle.borderColor !== 'rgb(31, 41, 55)'
      
      document.body.removeChild(testElement)
      setIsHighContrast(isHighContrastDetected)
    }
    
    checkHighContrast()
    
    // Also check for media query support
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    if (mediaQuery.matches) {
      setIsHighContrast(true)
    }
    
    const handler = () => setIsHighContrast(mediaQuery.matches)
    mediaQuery.addEventListener('change', handler)
    
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])
  
  return isHighContrast
}

// Touch/pointer utilities
export const useTouchDevice = (): boolean => {
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  
  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
    }
    
    checkTouchDevice()
    window.addEventListener('resize', checkTouchDevice)
    
    return () => window.removeEventListener('resize', checkTouchDevice)
  }, [])
  
  return isTouchDevice
}

// Accessibility testing utilities (development only)
export const validateAccessibility = (element: HTMLElement): string[] => {
  const issues: string[] = []
  
  // Check for missing alt text on images
  const images = element.querySelectorAll('img:not([alt])')
  if (images.length > 0) {
    issues.push(`${images.length} images missing alt text`)
  }
  
  // Check for buttons without accessible names
  const buttons = element.querySelectorAll('button:not([aria-label]):not([aria-labelledby])')
  buttons.forEach((button, index) => {
    if (!button.textContent?.trim()) {
      issues.push(`Button ${index + 1} missing accessible name`)
    }
  })
  
  // Check for form inputs without labels
  const inputs = element.querySelectorAll('input:not([aria-label]):not([aria-labelledby])')
  inputs.forEach((input, index) => {
    const id = input.getAttribute('id')
    if (!id || !element.querySelector(`label[for="${id}"]`)) {
      issues.push(`Input ${index + 1} missing associated label`)
    }
  })
  
  // Check for sufficient color contrast
  const textElements = element.querySelectorAll('*')
  textElements.forEach((el) => {
    if (el.textContent?.trim()) {
      const styles = window.getComputedStyle(el)
      const textColor = styles.color
      const bgColor = styles.backgroundColor
      
      if (textColor && bgColor && textColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'rgba(0, 0, 0, 0)') {
        // Convert RGB to hex and check contrast
        // This is a simplified check - in production, use a proper contrast library
        const hasGoodContrast = getContrastRatio(textColor, bgColor) >= 4.5
        if (!hasGoodContrast) {
          issues.push(`Element with insufficient color contrast detected`)
        }
      }
    }
  })
  
  return issues
}

export default {
  announceToScreenReader,
  trapFocus,
  getContrastRatio,
  meetsWCAGContrast,
  useReducedMotion,
  useKeyboardNavigation,
  generateId,
  setAriaExpanded,
  setAriaSelected,
  createScreenReaderText,
  useFocusManagement,
  useHighContrastMode,
  useTouchDevice,
  validateAccessibility
}
