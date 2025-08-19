/**
 * Advanced Animation System
 * 60fps smooth transitions and effects
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, useReducedMotion, useSpring, useTransform, useMotionValue } from 'framer-motion';

// Animation Context
const AnimationContext = createContext();

export const useAnimation = () => {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimation must be used within AnimationProvider');
  }
  return context;
};

// Animation Provider
export const AnimationProvider = ({ children }) => {
  const [globalAnimationState, setGlobalAnimationState] = useState({
    isPlaying: true,
    speed: 1,
    quality: 'high', // high, medium, low
  });

  const prefersReducedMotion = useReducedMotion();

  const value = {
    ...globalAnimationState,
    setAnimationState: setGlobalAnimationState,
    prefersReducedMotion,
  };

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
};

// High-performance animation variants
export const animationVariants = {
  // Page transitions
  pageTransition: {
    initial: { 
      opacity: 0, 
      y: 20, 
      scale: 0.95,
    },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94], // Custom easing
        staggerChildren: 0.1,
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      scale: 1.05,
      transition: {
        duration: 0.4,
        ease: [0.55, 0.06, 0.68, 0.19],
      }
    }
  },

  // Stagger animation for lists
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      }
    }
  },

  staggerItem: {
    initial: { 
      opacity: 0, 
      y: 30,
      scale: 0.9,
    },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      }
    }
  },

  // Floating animation
  floating: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    }
  },

  // Pulse animation
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    }
  },

  // Glow animation
  glow: {
    boxShadow: [
      "0 0 20px rgba(114, 9, 183, 0.3)",
      "0 0 40px rgba(114, 9, 183, 0.6)",
      "0 0 20px rgba(114, 9, 183, 0.3)",
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    }
  },

  // Slide animations
  slideInLeft: {
    initial: { x: -100, opacity: 0 },
    animate: { 
      x: 0, 
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  },

  slideInRight: {
    initial: { x: 100, opacity: 0 },
    animate: { 
      x: 0, 
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  },

  slideInUp: {
    initial: { y: 100, opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  },

  slideInDown: {
    initial: { y: -100, opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  },

  // Scale animations
  scaleIn: {
    initial: { scale: 0, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        duration: 0.5, 
        ease: [0.25, 0.46, 0.45, 0.94] 
      }
    }
  },

  scaleInCenter: {
    initial: { scale: 0.5, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  },

  // Rotation animations
  rotateIn: {
    initial: { rotate: -180, opacity: 0 },
    animate: { 
      rotate: 0, 
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  },

  // Magnetic effect
  magnetic: {
    scale: [1, 1.02, 1],
    rotate: [0, 1, -1, 0],
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    }
  },

  // Morphing effect
  morph: {
    borderRadius: ["20px", "50px", "20px"],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    }
  },
};

// High-performance hover animations
export const hoverVariants = {
  default: {
    scale: 1.05,
    y: -5,
    transition: { duration: 0.2, ease: "easeOut" }
  },
  
  subtle: {
    scale: 1.02,
    transition: { duration: 0.2, ease: "easeOut" }
  },
  
  lift: {
    y: -8,
    boxShadow: "0 20px 40px rgba(114, 9, 183, 0.3)",
    transition: { duration: 0.3, ease: "easeOut" }
  },
  
  glow: {
    boxShadow: "0 0 30px rgba(114, 9, 183, 0.6)",
    transition: { duration: 0.2, ease: "easeOut" }
  },
  
  rotate: {
    rotate: 5,
    scale: 1.05,
    transition: { duration: 0.2, ease: "easeOut" }
  },
  
  bounce: {
    scale: [1, 1.1, 1.05],
    transition: { duration: 0.3, ease: "easeOut" }
  },
};

// Performance-optimized animation component
export const PerformantAnimation = ({ 
  children, 
  variant = 'fadeIn',
  hover = false,
  hoverVariant = 'default',
  trigger = true,
  delay = 0,
  className = '',
  style = {},
  ...props 
}) => {
  const { prefersReducedMotion, quality } = useAnimation();
  
  // Adjust animation quality based on performance settings
  const getAnimationConfig = () => {
    if (prefersReducedMotion) {
      return { duration: 0.01 }; // Nearly instant for accessibility
    }
    
    switch (quality) {
      case 'low':
        return { duration: 0.3 };
      case 'medium':
        return { duration: 0.5 };
      case 'high':
      default:
        return {}; // Use default durations
    }
  };

  const animationConfig = getAnimationConfig();
  
  return (
    <motion.div
      className={className}
      style={style}
      initial={trigger ? animationVariants[variant]?.initial : false}
      animate={trigger ? animationVariants[variant]?.animate : false}
      whileHover={hover ? hoverVariants[hoverVariant] : false}
      transition={{
        ...animationVariants[variant]?.animate?.transition,
        ...animationConfig,
        delay,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Parallax scrolling component
export const ParallaxElement = ({ 
  children, 
  speed = 0.5, 
  className = '',
  style = {} 
}) => {
  const y = useMotionValue(0);
  const yParallax = useTransform(y, [0, 1], [0, speed * 100]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const progress = scrollY / windowHeight;
      y.set(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [y]);

  return (
    <motion.div
      className={className}
      style={{ 
        y: yParallax,
        ...style 
      }}
    >
      {children}
    </motion.div>
  );
};

// Mouse-following animation
export const MouseFollower = ({ 
  children, 
  intensity = 0.1, 
  className = '',
  style = {} 
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const xSmooth = useSpring(x, { damping: 50, stiffness: 300 });
  const ySmooth = useSpring(y, { damping: 50, stiffness: 300 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const rect = document.documentElement.getBoundingClientRect();
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      x.set((e.clientX - centerX) * intensity);
      y.set((e.clientY - centerY) * intensity);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [x, y, intensity]);

  return (
    <motion.div
      className={className}
      style={{ 
        x: xSmooth,
        y: ySmooth,
        ...style 
      }}
    >
      {children}
    </motion.div>
  );
};

// Intersection observer animation
export const ScrollReveal = ({ 
  children, 
  threshold = 0.1, 
  once = true,
  variant = 'slideInUp',
  className = '',
  style = {} 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [element, setElement] = useState(null);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.unobserve(element);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [element, threshold, once]);

  return (
    <motion.div
      ref={setElement}
      className={className}
      style={style}
      initial={animationVariants[variant]?.initial}
      animate={isVisible ? animationVariants[variant]?.animate : animationVariants[variant]?.initial}
    >
      {children}
    </motion.div>
  );
};

// Physics-based animation
export const PhysicsAnimation = ({ 
  children, 
  trigger = false,
  className = '',
  style = {} 
}) => {
  return (
    <motion.div
      className={className}
      style={style}
      animate={trigger ? {
        y: [0, -20, 0],
        transition: {
          type: "spring",
          damping: 10,
          stiffness: 100,
          mass: 1,
        }
      } : {}}
    >
      {children}
    </motion.div>
  );
};

// Performance monitor for animations
export const useAnimationPerformance = () => {
  const [frameRate, setFrameRate] = useState(60);
  const [quality, setQuality] = useState('high');

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId;

    const measureFPS = (currentTime) => {
      frameCount++;
      
      if (currentTime - lastTime >= 1000) {
        const fps = frameCount;
        setFrameRate(fps);
        
        // Adjust quality based on FPS
        if (fps < 30) {
          setQuality('low');
        } else if (fps < 50) {
          setQuality('medium');
        } else {
          setQuality('high');
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return { frameRate, quality };
};

export default {
  AnimationProvider,
  useAnimation,
  PerformantAnimation,
  ParallaxElement,
  MouseFollower,
  ScrollReveal,
  PhysicsAnimation,
  useAnimationPerformance,
  animationVariants,
  hoverVariants,
};