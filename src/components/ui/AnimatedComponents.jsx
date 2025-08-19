/**
 * Animated UI Components
 * Smooth 60fps animations with framer-motion
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation, useInView } from 'framer-motion';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 60, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

const slideInLeft = {
  hidden: { opacity: 0, x: -100 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

// Animated Card Component
export const AnimatedCard = ({ 
  children, 
  className = '', 
  delay = 0, 
  hover = true,
  glowEffect = true 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      className={`animated-card ${className}`}
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      transition={{ delay }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={hover ? { 
        scale: 1.02, 
        y: -5,
        transition: { duration: 0.3 }
      } : {}}
      style={{
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(114, 9, 183, 0.3)',
        borderRadius: '16px',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow effect */}
      {glowEffect && (
        <motion.div
          className="card-glow"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(114, 9, 183, 0.1), rgba(86, 11, 173, 0.1))',
            borderRadius: '16px',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none',
          }}
        />
      )}
      
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </motion.div>
  );
};

// Animated Button Component
export const AnimatedButton = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'medium',
  loading = false,
  disabled = false,
  className = ''
}) => {
  const variants = {
    primary: {
      background: 'linear-gradient(135deg, #7209b7, #560bad)',
      color: '#ffffff',
      border: 'none'
    },
    secondary: {
      background: 'rgba(114, 9, 183, 0.1)',
      color: '#c77dff',
      border: '1px solid rgba(114, 9, 183, 0.5)'
    },
    outline: {
      background: 'transparent',
      color: '#e0aaff',
      border: '1px solid rgba(224, 170, 255, 0.5)'
    }
  };

  const sizes = {
    small: { padding: '8px 16px', fontSize: '14px' },
    medium: { padding: '12px 24px', fontSize: '16px' },
    large: { padding: '16px 32px', fontSize: '18px' }
  };

  return (
    <motion.button
      className={`animated-button ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ 
        scale: disabled ? 1 : 1.05,
        boxShadow: disabled ? 'none' : '0 10px 30px rgba(114, 9, 183, 0.3)'
      }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      transition={{ duration: 0.2 }}
      style={{
        ...variants[variant],
        ...sizes[size],
        borderRadius: '12px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: '600',
        opacity: disabled ? 0.5 : 1,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Loading spinner */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{
                width: '20px',
                height: '20px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderTop: '2px solid #ffffff',
                borderRadius: '50%',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Button content */}
      <motion.span
        style={{ 
          opacity: loading ? 0 : 1,
          transition: 'opacity 0.2s ease'
        }}
      >
        {children}
      </motion.span>
    </motion.button>
  );
};

// Animated Input Component
export const AnimatedInput = ({ 
  label, 
  type = 'text', 
  placeholder, 
  value, 
  onChange,
  error,
  icon,
  className = ''
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  useEffect(() => {
    setHasValue(value && value.length > 0);
  }, [value]);

  return (
    <motion.div
      className={`animated-input-container ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        position: 'relative',
        marginBottom: '24px',
      }}
    >
      {/* Input field */}
      <motion.div
        style={{
          position: 'relative',
          background: 'rgba(0, 0, 0, 0.3)',
          border: `1px solid ${error ? '#ff4757' : isFocused ? '#7209b7' : 'rgba(224, 170, 255, 0.3)'}`,
          borderRadius: '12px',
          overflow: 'hidden',
        }}
        animate={{
          borderColor: error ? '#ff4757' : isFocused ? '#7209b7' : 'rgba(224, 170, 255, 0.3)',
          boxShadow: isFocused ? '0 0 20px rgba(114, 9, 183, 0.2)' : 'none'
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Icon */}
        {icon && (
          <div
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: isFocused ? '#7209b7' : '#9d4edd',
              zIndex: 1,
            }}
          >
            {icon}
          </div>
        )}

        {/* Input */}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            width: '100%',
            padding: icon ? '16px 16px 16px 48px' : '16px',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#ffffff',
            fontSize: '16px',
            fontFamily: 'inherit',
          }}
        />

        {/* Floating label */}
        {label && (
          <motion.label
            style={{
              position: 'absolute',
              left: icon ? '48px' : '16px',
              pointerEvents: 'none',
              color: error ? '#ff4757' : isFocused ? '#7209b7' : '#9d4edd',
              fontWeight: '500',
            }}
            animate={{
              top: isFocused || hasValue ? '8px' : '50%',
              transform: isFocused || hasValue ? 'translateY(0)' : 'translateY(-50%)',
              fontSize: isFocused || hasValue ? '12px' : '16px',
            }}
            transition={{ duration: 0.2 }}
          >
            {label}
          </motion.label>
        )}
      </motion.div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              color: '#ff4757',
              fontSize: '12px',
              marginTop: '6px',
              paddingLeft: '4px',
            }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Animated Modal Component
export const AnimatedModal = ({ 
  isOpen, 
  onClose, 
  children, 
  title,
  className = ''
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          />

          {/* Modal */}
          <motion.div
            className={`animated-modal ${className}`}
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(0, 0, 0, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(114, 9, 183, 0.3)',
              borderRadius: '20px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              zIndex: 1001,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {title && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                borderBottom: '1px solid rgba(114, 9, 183, 0.2)',
                paddingBottom: '16px',
              }}>
                <h3 style={{
                  color: '#ffffff',
                  fontSize: '20px',
                  fontWeight: '600',
                  margin: 0,
                }}>
                  {title}
                </h3>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#9d4edd',
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  ×
                </motion.button>
              </div>
            )}

            {/* Content */}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Animated List Component
export const AnimatedList = ({ 
  items, 
  renderItem, 
  className = '',
  stagger = true 
}) => {
  return (
    <motion.div
      className={`animated-list ${className}`}
      variants={stagger ? staggerContainer : {}}
      initial="hidden"
      animate="visible"
    >
      {items.map((item, index) => (
        <motion.div
          key={item.id || index}
          variants={stagger ? scaleIn : {}}
          layout
        >
          {renderItem(item, index)}
        </motion.div>
      ))}
    </motion.div>
  );
};

// Scroll-triggered Animation Hook
export const useScrollAnimation = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { 
    once: true, 
    margin: "-100px" 
  });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  return { ref, controls, isInView };
};

// Animated Progress Bar
export const AnimatedProgress = ({ 
  progress, 
  color = '#7209b7', 
  height = 8,
  className = ''
}) => {
  return (
    <div
      className={`animated-progress ${className}`}
      style={{
        width: '100%',
        height: `${height}px`,
        background: 'rgba(224, 170, 255, 0.1)',
        borderRadius: `${height / 2}px`,
        overflow: 'hidden',
      }}
    >
      <motion.div
        style={{
          height: '100%',
          background: `linear-gradient(90deg, ${color}, #c77dff)`,
          borderRadius: `${height / 2}px`,
        }}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </div>
  );
};

export default {
  AnimatedCard,
  AnimatedButton,
  AnimatedInput,
  AnimatedModal,
  AnimatedList,
  AnimatedProgress,
  useScrollAnimation,
};