// Advanced Animation Utilities for Enhanced User Experience

export const springConfig = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30
}

export const easings = {
  easeOut: [0.23, 1, 0.32, 1],
  easeIn: [0.755, 0.05, 0.855, 0.06],
  easeInOut: [0.645, 0.045, 0.355, 1],
  backOut: [0.175, 0.885, 0.32, 1.275],
  anticipate: [0.0, 0.0, 0.2, 1],
} as const

// Animation variants for different components
export const animationVariants = {
  // Card animations
  cardHover: {
    scale: 1.02,
    y: -4,
    transition: {
      ...springConfig,
      duration: 0.2
    }
  },
  cardTap: {
    scale: 0.98,
    transition: {
      ...springConfig,
      duration: 0.1
    }
  },
  cardEntry: {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        ...springConfig,
        duration: 0.4
      }
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    }
  },

  // Page transitions
  pageTransition: {
    initial: { opacity: 0, x: 20 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.4,
        ease: easings.easeOut
      }
    },
    exit: { 
      opacity: 0, 
      x: -20,
      transition: {
        duration: 0.3
      }
    }
  },

  // Stagger animations for lists
  staggerContainer: {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  },

  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        ...springConfig,
        duration: 0.3
      }
    }
  },

  // Button animations
  buttonHover: {
    scale: 1.05,
    transition: {
      ...springConfig,
      duration: 0.2
    }
  },
  buttonTap: {
    scale: 0.95,
    transition: {
      ...springConfig,
      duration: 0.1
    }
  },

  // Modal animations
  modalBackdrop: {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { duration: 0.2 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  },

  modal: {
    initial: { 
      opacity: 0, 
      scale: 0.9,
      y: 20
    },
    animate: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        ...springConfig,
        duration: 0.3
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      y: 20,
      transition: {
        duration: 0.2
      }
    }
  },

  modalContent: {
    initial: { 
      opacity: 0, 
      scale: 0.9,
      y: 20
    },
    animate: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        ...springConfig,
        duration: 0.3
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      y: 20,
      transition: {
        duration: 0.2
      }
    }
  },

  // Loading animations
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },

  bounce: {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },

  // Number counting animation
  countUp: {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        ...springConfig,
        duration: 0.5
      }
    }
  },

  // Chart animations
  chartEntry: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        ...springConfig,
        duration: 0.6,
        delay: 0.2
      }
    }
  },

  // Notification animations
  slideInRight: {
    initial: { x: 400, opacity: 0 },
    animate: { 
      x: 0, 
      opacity: 1,
      transition: {
        ...springConfig,
        duration: 0.4
      }
    },
    exit: { 
      x: 400, 
      opacity: 0,
      transition: {
        duration: 0.2
      }
    }
  }
}

// Micro-interaction helpers
export const microInteractions = {
  // Subtle hover effects for interactive elements
  subtle: {
    hover: { scale: 1.02 },
    tap: { scale: 0.98 }
  },
  
  // More pronounced interactions for buttons
  button: {
    hover: { scale: 1.05, y: -2 },
    tap: { scale: 0.95 }
  },
  
  // Icon animations
  icon: {
    hover: { rotate: 10, scale: 1.1 },
    tap: { rotate: -10, scale: 0.9 }
  }
}

// Accessibility-friendly reduced motion variants
export const reducedMotionVariants = {
  // Simple opacity transitions for users who prefer reduced motion
  simple: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  }
}

// Custom hook for respecting user's motion preferences
export const useMotionPreference = () => {
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false
    
  return prefersReducedMotion ? reducedMotionVariants.simple : animationVariants
}
