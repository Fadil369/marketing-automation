/**
 * MeshGradient Background System
 * Dual-layer mesh gradients with speed differential and sophisticated color scheme
 */

import React, { useEffect, useState } from 'react';
import { MeshGradient } from '@paper-design/shaders-react';
import { motion } from 'framer-motion';

const MeshGradientBackground = ({ 
  className = '', 
  intensity = 1.0,
  interactive = true,
  children 
}) => {
  const [mounted, setMounted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    setMounted(true);
    
    if (interactive) {
      const handleMouseMove = (e) => {
        const rect = document.documentElement.getBoundingClientRect();
        setMousePosition({
          x: e.clientX / window.innerWidth,
          y: e.clientY / window.innerHeight
        });
      };

      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [interactive]);

  // Primary mesh gradient colors (faster movement)
  const primaryColors = [
    '#000000', // Deep black
    '#1a0a2e', // Dark purple-black
    '#16213e', // Deep navy
    '#0f3460', // Dark blue
    '#533483', // Deep violet
    '#7209b7', // Rich purple
    '#560bad', // Deep magenta
    '#480ca8', // Royal purple
    '#3c096c', // Dark violet
    '#ffffff', // Selective white accents
  ];

  // Wireframe mesh gradient colors (slower movement)
  const wireframeColors = [
    '#000000', // Black base
    '#2d1b69', // Dark purple
    '#3c096c', // Deep violet  
    '#560bad', // Purple
    '#7209b7', // Bright purple
    '#9d4edd', // Light purple
    '#c77dff', // Lavender
    '#e0aaff', // Light lavender
    '#ffffff', // White highlights
    '#1a1a1a', // Dark gray
  ];

  if (!mounted) {
    return (
      <div className={`mesh-gradient-fallback ${className}`}>
        <div className="fallback-gradient" />
        {children}
      </div>
    );
  }

  return (
    <motion.div 
      className={`mesh-gradient-container ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#000000', // Black fallback
      }}
    >
      {/* Primary Mesh Layer */}
      <motion.div 
        className="mesh-layer-primary"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
        }}
        animate={{
          scale: [1, 1.05, 1],
          rotate: [0, 1, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <MeshGradient
          colors={primaryColors}
          speed={0.3 * intensity}
          backgroundColor="#000000"
          wireframe={false}
          colorful={true}
          lights={[
            {
              intensity: 0.8,
              position: [mousePosition.x, mousePosition.y, 0.5],
              color: '#7209b7'
            },
            {
              intensity: 0.6,
              position: [1 - mousePosition.x, 1 - mousePosition.y, 0.3],
              color: '#560bad'
            },
            {
              intensity: 0.4,
              position: [0.5, 0.5, 0.8],
              color: '#ffffff'
            }
          ]}
          environment={0.1}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </motion.div>

      {/* Wireframe Overlay Layer */}
      <motion.div 
        className="mesh-layer-wireframe"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 2,
          opacity: 0.6, // 60% opacity for depth
          mixBlendMode: 'overlay',
        }}
        animate={{
          scale: [1, 0.98, 1],
          rotate: [0, -0.5, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <MeshGradient
          colors={wireframeColors}
          speed={0.2 * intensity}
          backgroundColor="transparent"
          wireframe={true}
          colorful={false}
          lights={[
            {
              intensity: 0.3,
              position: [mousePosition.x * 0.8, mousePosition.y * 0.8, 0.2],
              color: '#c77dff'
            },
            {
              intensity: 0.2,
              position: [0.2, 0.8, 0.4],
              color: '#e0aaff'
            }
          ]}
          environment={0.05}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </motion.div>

      {/* Content Layer */}
      <motion.div 
        className="mesh-content"
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          height: '100%',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 1.2, 
          delay: 0.3,
          ease: "easeOut" 
        }}
      >
        {children}
      </motion.div>

      <style jsx>{`
        .mesh-gradient-fallback {
          position: relative;
          width: 100%;
          height: 100%;
          background: #000000;
          overflow: hidden;
        }

        .fallback-gradient {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            135deg,
            #000000 0%,
            #1a0a2e 25%,
            #533483 50%,
            #7209b7 75%,
            #000000 100%
          );
          opacity: 0.8;
          animation: fallbackPulse 10s ease-in-out infinite;
        }

        @keyframes fallbackPulse {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.02); }
        }

        .mesh-gradient-container {
          will-change: transform;
          transform-style: preserve-3d;
        }

        .mesh-layer-primary,
        .mesh-layer-wireframe {
          will-change: transform, opacity;
          backface-visibility: hidden;
        }

        .mesh-content {
          pointer-events: auto;
        }

        /* Performance optimizations */
        .mesh-gradient-container * {
          transform-style: preserve-3d;
          backface-visibility: hidden;
        }

        /* Smooth animations at 60fps */
        @media (prefers-reduced-motion: no-preference) {
          .mesh-layer-primary,
          .mesh-layer-wireframe {
            animation-fill-mode: both;
          }
        }

        /* Respect reduced motion preferences */
        @media (prefers-reduced-motion: reduce) {
          .mesh-layer-primary,
          .mesh-layer-wireframe {
            animation: none;
            transform: none;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default MeshGradientBackground;