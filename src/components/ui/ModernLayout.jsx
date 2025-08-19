/**
 * Modern Layout with Mesh Gradients and Animations
 * Main application layout with advanced UI components
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MeshGradientBackground from './MeshGradientBackground.jsx';
import { 
  AnimatedCard, 
  AnimatedButton, 
  AnimatedInput,
  AnimatedModal,
  AnimatedList,
  AnimatedProgress 
} from './AnimatedComponents.jsx';
import { 
  AnimationProvider, 
  PerformantAnimation,
  ScrollReveal,
  MouseFollower 
} from './AnimationSystem.jsx';
import { ColorSystem } from '../../styles/ColorSystem.js';

const ModernLayout = ({ children, currentView = 'dashboard' }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'AI Generated Content', message: 'New social media post ready for review', type: 'success' },
    { id: 2, title: 'Platform Connected', message: 'Instagram account successfully linked', type: 'info' },
    { id: 3, title: 'Campaign Performance', message: '25% increase in engagement this week', type: 'success' },
  ]);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', route: '/' },
    { id: 'ai-hub', label: 'AI Hub', icon: '🤖', route: '/ai-hub' },
    { id: 'content', label: 'Content', icon: '📝', route: '/content' },
    { id: 'analytics', label: 'Analytics', icon: '📈', route: '/analytics' },
    { id: 'campaigns', label: 'Campaigns', icon: '📢', route: '/campaigns' },
    { id: 'platforms', label: 'Platforms', icon: '🔗', route: '/platforms' },
    { id: 'automation', label: 'Automation', icon: '⚡', route: '/automation' },
    { id: 'settings', label: 'Settings', icon: '⚙️', route: '/settings' },
  ];

  const stats = [
    { label: 'Total Reach', value: '2.4M', change: '+12%', trend: 'up' },
    { label: 'Engagement', value: '156K', change: '+8%', trend: 'up' },
    { label: 'Campaigns', value: '24', change: '+3', trend: 'up' },
    { label: 'AI Generated', value: '847', change: '+156', trend: 'up' },
  ];

  return (
    <AnimationProvider>
      <MeshGradientBackground className="min-h-screen" intensity={1.0} interactive={true}>
        <div className="flex h-screen overflow-hidden">
          {/* Animated Sidebar */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.aside
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="sidebar"
                style={{
                  width: '280px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(20px)',
                  borderRight: '1px solid rgba(114, 9, 183, 0.3)',
                  padding: '24px',
                  overflowY: 'auto',
                }}
              >
                {/* Logo */}
                <ScrollReveal variant="slideInLeft">
                  <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                    <motion.h1
                      style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        background: ColorSystem.gradients.primary,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        color: 'transparent',
                        margin: 0,
                      }}
                      whileHover={{ scale: 1.05 }}
                    >
                      BrainSAIT
                    </motion.h1>
                    <p style={{ 
                      color: ColorSystem.purple.light, 
                      fontSize: '12px', 
                      margin: '4px 0 0 0',
                      opacity: 0.8 
                    }}>
                      Marketing Platform v2.0
                    </p>
                  </div>
                </ScrollReveal>

                {/* Navigation */}
                <nav>
                  <motion.div
                    variants={{
                      animate: {
                        transition: {
                          staggerChildren: 0.05,
                        }
                      }
                    }}
                    initial="hidden"
                    animate="animate"
                  >
                    {navigationItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        variants={{
                          hidden: { opacity: 0, x: -20 },
                          animate: { opacity: 1, x: 0 }
                        }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <motion.button
                          onClick={() => {/* Handle navigation */}}
                          className="nav-item"
                          whileHover={{ 
                            x: 10,
                            backgroundColor: 'rgba(114, 9, 183, 0.1)',
                          }}
                          whileTap={{ scale: 0.95 }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            marginBottom: '8px',
                            background: currentView === item.id ? 'rgba(114, 9, 183, 0.2)' : 'transparent',
                            border: 'none',
                            borderRadius: '12px',
                            color: currentView === item.id ? ColorSystem.white.pure : ColorSystem.purple.light,
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <span style={{ fontSize: '18px' }}>{item.icon}</span>
                          {item.label}
                        </motion.button>
                      </motion.div>
                    ))}
                  </motion.div>
                </nav>

                {/* User Profile */}
                <ScrollReveal variant="slideInUp" className="mt-auto">
                  <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
                    <AnimatedCard hover={true} glowEffect={true}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: ColorSystem.gradients.primary,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: ColorSystem.white.pure,
                            fontWeight: '600',
                          }}
                        >
                          JS
                        </div>
                        <div>
                          <p style={{ 
                            color: ColorSystem.white.pure, 
                            margin: 0, 
                            fontSize: '14px', 
                            fontWeight: '500' 
                          }}>
                            John Smith
                          </p>
                          <p style={{ 
                            color: ColorSystem.purple.light, 
                            margin: 0, 
                            fontSize: '12px' 
                          }}>
                            Pro Plan
                          </p>
                        </div>
                      </div>
                    </AnimatedCard>
                  </div>
                </ScrollReveal>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <PerformantAnimation variant="slideInDown">
              <header
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 24px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  backdropFilter: 'blur(20px)',
                  borderBottom: '1px solid rgba(114, 9, 183, 0.2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <AnimatedButton
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    variant="outline"
                    size="small"
                  >
                    ☰
                  </AnimatedButton>
                  
                  <h2 style={{
                    color: ColorSystem.white.pure,
                    fontSize: '20px',
                    fontWeight: '600',
                    margin: 0,
                    textTransform: 'capitalize',
                  }}>
                    {currentView.replace('-', ' ')}
                  </h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {/* Search */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <AnimatedInput
                      placeholder="Search..."
                      icon="🔍"
                      className="search-input"
                      style={{ width: '250px' }}
                    />
                  </motion.div>

                  {/* Notifications */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setModalOpen(true)}
                    style={{
                      position: 'relative',
                      background: 'rgba(114, 9, 183, 0.1)',
                      border: '1px solid rgba(114, 9, 183, 0.3)',
                      borderRadius: '12px',
                      padding: '8px',
                      color: ColorSystem.purple.light,
                      cursor: 'pointer',
                    }}
                  >
                    🔔
                    {notifications.length > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          background: '#ff4757',
                          color: ColorSystem.white.pure,
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          fontSize: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '600',
                        }}
                      >
                        {notifications.length}
                      </motion.span>
                    )}
                  </motion.button>
                </div>
              </header>
            </PerformantAnimation>

            {/* Stats Dashboard */}
            <PerformantAnimation variant="slideInUp" delay={0.1}>
              <div style={{
                padding: '24px',
                borderBottom: '1px solid rgba(114, 9, 183, 0.1)',
              }}>
                <motion.div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '20px',
                  }}
                  variants={{
                    animate: {
                      transition: {
                        staggerChildren: 0.1,
                      }
                    }
                  }}
                  initial="hidden"
                  animate="animate"
                >
                  {stats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      variants={{
                        hidden: { opacity: 0, y: 20, scale: 0.9 },
                        animate: { opacity: 1, y: 0, scale: 1 }
                      }}
                    >
                      <AnimatedCard hover={true} glowEffect={true}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <p style={{ 
                              color: ColorSystem.purple.light, 
                              fontSize: '14px', 
                              margin: '0 0 8px 0' 
                            }}>
                              {stat.label}
                            </p>
                            <p style={{ 
                              color: ColorSystem.white.pure, 
                              fontSize: '24px', 
                              fontWeight: '700', 
                              margin: '0 0 4px 0' 
                            }}>
                              {stat.value}
                            </p>
                            <p style={{ 
                              color: stat.trend === 'up' ? '#10b981' : '#ef4444', 
                              fontSize: '12px', 
                              margin: 0,
                              fontWeight: '500' 
                            }}>
                              {stat.change}
                            </p>
                          </div>
                          <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{
                              fontSize: '24px',
                              opacity: 0.7,
                            }}
                          >
                            {stat.trend === 'up' ? '📈' : '📉'}
                          </motion.div>
                        </div>
                        
                        {/* Progress indicator */}
                        <div style={{ marginTop: '12px' }}>
                          <AnimatedProgress 
                            progress={Math.random() * 100} 
                            color={ColorSystem.purple.rich}
                            height={4}
                          />
                        </div>
                      </AnimatedCard>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </PerformantAnimation>

            {/* Content Area */}
            <div 
              style={{ 
                flex: 1, 
                overflow: 'auto', 
                padding: '24px',
              }}
            >
              <MouseFollower intensity={0.02}>
                <PerformantAnimation variant="fadeIn" delay={0.3}>
                  {children}
                </PerformantAnimation>
              </MouseFollower>
            </div>
          </main>
        </div>

        {/* Notifications Modal */}
        <AnimatedModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Notifications"
        >
          <AnimatedList
            items={notifications}
            renderItem={(notification) => (
              <AnimatedCard key={notification.id} className="mb-4">
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: notification.type === 'success' ? '#10b981' : '#3b82f6',
                      marginTop: '6px',
                    }}
                  />
                  <div>
                    <h4 style={{ 
                      color: ColorSystem.white.pure, 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      margin: '0 0 4px 0' 
                    }}>
                      {notification.title}
                    </h4>
                    <p style={{ 
                      color: ColorSystem.purple.light, 
                      fontSize: '12px', 
                      margin: 0 
                    }}>
                      {notification.message}
                    </p>
                  </div>
                </div>
              </AnimatedCard>
            )}
          />
        </AnimatedModal>
      </MeshGradientBackground>
    </AnimationProvider>
  );
};

export default ModernLayout;