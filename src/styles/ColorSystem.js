/**
 * Advanced Color System
 * Black + Violet/Purple + Selective White theme
 */

export const ColorSystem = {
  // Primary palette - Black base
  black: {
    pure: '#000000',
    rich: '#0a0a0a',
    deep: '#1a1a1a',
    medium: '#2a2a2a',
    light: '#3a3a3a',
  },

  // Purple/Violet spectrum
  purple: {
    darkest: '#1a0a2e',    // Deep purple-black
    darker: '#16213e',     // Deep navy-purple
    dark: '#0f3460',       // Dark blue-purple
    deepViolet: '#533483', // Deep violet
    rich: '#7209b7',       // Rich purple (primary)
    primary: '#560bad',    // Deep magenta (brand)
    royal: '#480ca8',      // Royal purple
    deep: '#3c096c',       // Dark violet
    medium: '#9d4edd',     // Medium purple
    light: '#c77dff',      // Light purple
    lighter: '#e0aaff',    // Light lavender
    lightest: '#f3e8ff',   // Very light lavender
  },

  // White spectrum (selective usage)
  white: {
    pure: '#ffffff',
    off: '#fafafa',
    warm: '#f8f9fa',
    cool: '#f1f3f4',
    gray: '#e9ecef',
  },

  // Accent colors
  accent: {
    electric: '#8b5cf6',   // Electric purple
    neon: '#a855f7',       // Neon purple
    cyan: '#06ffa5',       // Cyan accent
    pink: '#f72585',       // Pink accent
    gold: '#ffd60a',       // Gold accent
  },

  // State colors
  state: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },

  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #7209b7 0%, #560bad 50%, #3c096c 100%)',
    secondary: 'linear-gradient(135deg, #9d4edd 0%, #c77dff 50%, #e0aaff 100%)',
    accent: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
    dark: 'linear-gradient(135deg, #000000 0%, #1a0a2e 50%, #533483 100%)',
    mesh: 'linear-gradient(135deg, #000000 0%, #1a0a2e 25%, #533483 50%, #7209b7 75%, #000000 100%)',
    glow: 'radial-gradient(circle, rgba(114, 9, 183, 0.3) 0%, transparent 70%)',
    
    // Animated gradients
    animated: {
      primary: `
        background: linear-gradient(-45deg, #000000, #1a0a2e, #7209b7, #560bad);
        background-size: 400% 400%;
        animation: gradientShift 15s ease infinite;
      `,
      secondary: `
        background: linear-gradient(-45deg, #3c096c, #9d4edd, #c77dff, #e0aaff);
        background-size: 400% 400%;
        animation: gradientShift 20s ease infinite;
      `,
    }
  },

  // Opacity levels
  opacity: {
    transparent: '0',
    subtle: '0.05',
    light: '0.1',
    medium: '0.2',
    strong: '0.4',
    overlay: '0.6',
    dominant: '0.8',
    opaque: '1',
  },

  // Blur effects
  blur: {
    none: '0px',
    subtle: '4px',
    light: '8px',
    medium: '16px',
    strong: '24px',
    heavy: '32px',
    extreme: '64px',
  },

  // Shadow system
  shadows: {
    none: 'none',
    subtle: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    medium: '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
    strong: '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)',
    heavy: '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)',
    extreme: '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)',
    
    // Colored shadows
    purple: '0 10px 30px rgba(114, 9, 183, 0.3)',
    purpleLight: '0 5px 15px rgba(157, 78, 221, 0.2)',
    purpleHeavy: '0 20px 60px rgba(114, 9, 183, 0.4)',
    
    // Glow effects
    glow: '0 0 20px rgba(114, 9, 183, 0.5)',
    glowSoft: '0 0 40px rgba(114, 9, 183, 0.3)',
    glowHard: '0 0 60px rgba(114, 9, 183, 0.7)',
    
    // Inset shadows
    inset: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
    insetDeep: 'inset 0 4px 8px rgba(0, 0, 0, 0.12)',
  },

  // Border system
  borders: {
    none: 'none',
    thin: '1px solid',
    medium: '2px solid',
    thick: '3px solid',
    
    // Colored borders
    primary: '1px solid rgba(114, 9, 183, 0.3)',
    primaryStrong: '2px solid rgba(114, 9, 183, 0.6)',
    secondary: '1px solid rgba(157, 78, 221, 0.3)',
    accent: '1px solid rgba(224, 170, 255, 0.3)',
    white: '1px solid rgba(255, 255, 255, 0.1)',
    
    // Gradient borders
    gradientPrimary: '1px solid transparent',
    gradientSecondary: '2px solid transparent',
  },

  // Glass morphism effects
  glass: {
    light: {
      background: 'rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    medium: {
      background: 'rgba(0, 0, 0, 0.2)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(114, 9, 183, 0.2)',
    },
    heavy: {
      background: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(24px)',
      border: '1px solid rgba(114, 9, 183, 0.3)',
    },
    purple: {
      background: 'rgba(114, 9, 183, 0.1)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(114, 9, 183, 0.3)',
    }
  },

  // Utilities
  utils: {
    // Get color with opacity
    withOpacity: (color, opacity) => {
      if (color.startsWith('rgba')) {
        return color.replace(/[\d\.]+\)$/g, `${opacity})`);
      }
      if (color.startsWith('#')) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      }
      return color;
    },

    // Get random color from palette
    randomPurple: () => {
      const purples = Object.values(ColorSystem.purple);
      return purples[Math.floor(Math.random() * purples.length)];
    },

    // Generate mesh gradient colors
    meshColors: (count = 10) => {
      const baseColors = [
        ColorSystem.black.pure,
        ColorSystem.black.deep,
        ColorSystem.purple.darkest,
        ColorSystem.purple.dark,
        ColorSystem.purple.rich,
        ColorSystem.purple.primary,
        ColorSystem.purple.medium,
        ColorSystem.purple.light,
        ColorSystem.white.pure,
        ColorSystem.accent.electric,
      ];
      
      return baseColors.slice(0, count);
    },
  }
};

// CSS Variables for dynamic theming
export const cssVariables = `
  :root {
    /* Primary colors */
    --color-black: ${ColorSystem.black.pure};
    --color-black-rich: ${ColorSystem.black.rich};
    --color-black-deep: ${ColorSystem.black.deep};
    
    --color-purple-primary: ${ColorSystem.purple.rich};
    --color-purple-brand: ${ColorSystem.purple.primary};
    --color-purple-light: ${ColorSystem.purple.light};
    --color-purple-lighter: ${ColorSystem.purple.lighter};
    
    --color-white: ${ColorSystem.white.pure};
    --color-white-off: ${ColorSystem.white.off};
    
    /* Gradients */
    --gradient-primary: ${ColorSystem.gradients.primary};
    --gradient-secondary: ${ColorSystem.gradients.secondary};
    --gradient-dark: ${ColorSystem.gradients.dark};
    
    /* Shadows */
    --shadow-purple: ${ColorSystem.shadows.purple};
    --shadow-glow: ${ColorSystem.shadows.glow};
    
    /* Glass effects */
    --glass-light: ${ColorSystem.glass.light.background};
    --glass-medium: ${ColorSystem.glass.medium.background};
    --glass-heavy: ${ColorSystem.glass.heavy.background};
    
    /* Blur effects */
    --blur-light: blur(${ColorSystem.blur.light});
    --blur-medium: blur(${ColorSystem.blur.medium});
    --blur-strong: blur(${ColorSystem.blur.strong});
  }
`;

// Animation keyframes
export const animationKeyframes = `
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  @keyframes purpleGlow {
    0%, 100% { 
      box-shadow: 0 0 20px rgba(114, 9, 183, 0.3);
    }
    50% { 
      box-shadow: 0 0 40px rgba(114, 9, 183, 0.6);
    }
  }
  
  @keyframes meshFloat {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33% { transform: translateY(-10px) rotate(1deg); }
    66% { transform: translateY(5px) rotate(-0.5deg); }
  }
  
  @keyframes wireframeShift {
    0%, 100% { opacity: 0.6; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(1.02); }
  }
`;

export default ColorSystem;