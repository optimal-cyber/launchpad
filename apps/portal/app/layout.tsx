'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon, Monitor, User, Settings, HelpCircle, Home, FolderOpen, Shield, BarChart3, Target, FileText } from 'lucide-react';
import SmartLink from '../components/SmartLink';
import './globals.css';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';

type Theme = 'dark' | 'light' | 'system';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Check if we're on the login page
  const isLoginPage = pathname === '/' || pathname === '/login';

  useEffect(() => {
    // Get theme from localStorage or default to light
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system';
    if (savedTheme) {
      setTheme(savedTheme);
    }
    // setMounted(true); // Set mounted to true after initial setup
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
  };

  // if (!mounted) {
  //   return null;
  // }

  // If it's the login page, render without navigation
  if (isLoginPage) {
    return (
      <html lang="en" className={theme}>
        <body className="min-h-screen bg-background text-foreground transition-colors duration-200">
          {children}
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className={theme}>
      <body className="min-h-screen bg-background text-foreground transition-colors duration-200">
        {/* Main Header */}
        <header className="bg-card border-b border-border shadow-sm">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center py-4 px-6">
              {/* Left Side - Logo & Brand */}
              <div className="flex items-center space-x-8">
                <SmartLink href="/launchpad" className="flex items-center hover:opacity-80 transition-opacity">
                  <img src="/optimal-logo.png" alt="Optimal Platform" className="h-10 w-auto" />
                </SmartLink>
                
                {/* Main Navigation */}
                <nav className="hidden lg:flex space-x-8">
                  <SmartLink href="/launchpad" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                    DASHBOARD
                  </SmartLink>
                  <SmartLink href="/vulnerabilities" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                    VULNERABILITIES
                  </SmartLink>
                  <SmartLink href="/sbom" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                    SBOM
                  </SmartLink>
                  <SmartLink href="/poam" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                    POA&M
                  </SmartLink>
                  <SmartLink href="/oscal" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                    OSCAL SSP
                  </SmartLink>
                </nav>
              </div>

              {/* Right Side - User & Theme */}
              <div className="flex items-center space-x-4">
                {/* Theme Toggle */}
                <div className="flex items-center bg-muted border border-border rounded-lg p-1">
                  <button
                    onClick={() => toggleTheme('light')}
                    className={`p-2 rounded-md transition-colors ${
                      theme === 'light' 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="Light theme"
                  >
                    <Sun className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => toggleTheme('dark')}
                    className={`p-2 rounded-md transition-colors ${
                      theme === 'dark' 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="Dark theme"
                  >
                    <Moon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => toggleTheme('system')}
                    className={`p-2 rounded-md transition-colors ${
                      theme === 'system' 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="System theme"
                  >
                    <Monitor className="h-5 w-5" />
                  </button>
                </div>

                <div className="h-6 w-px bg-border"></div>

                {/* GitLab Status */}
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">GitLab Connected</span>
                </div>

                <div className="h-6 w-px bg-border"></div>

                {/* User Menu */}
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => router.push('/settings')}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    title="Settings"
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => router.push('/help')}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    title="Help"
                  >
                    <HelpCircle className="h-5 w-5" />
                  </button>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => router.push('/profile')}
                      className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer"
                      title="Edit Profile"
                    >
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm font-medium text-foreground">Ryan Gutwein</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex min-h-screen">
          {/* Sidebar Navigation */}
          <aside className="w-64 bg-card border-r border-border">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">NAVIGATION</h2>
              <nav className="space-y-2">
                <SmartLink 
                  href="/launchpad" 
                  className="flex items-center space-x-3 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  <Home className="h-5 w-5" />
                  <span>Home</span>
                </SmartLink>
                
                <div className="space-y-1">
                  <div className="flex items-center space-x-3 px-3 py-2 text-muted-foreground">
                    <Settings className="h-5 w-5" />
                    <span>Management</span>
                  </div>
                  <div className="ml-6 space-y-1">
                    <SmartLink 
                      href="/vulnerabilities" 
                      className="flex items-center space-x-3 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                    >
                      <Target className="h-5 w-5" />
                      <span>Vulnerability Management</span>
                    </SmartLink>
                    <SmartLink 
                      href="/poam" 
                      className="flex items-center space-x-3 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                    >
                      <BarChart3 className="h-5 w-5" />
                      <span>Cyber POA&M</span>
                    </SmartLink>
                    <SmartLink 
                      href="/oscal" 
                      className="flex items-center space-x-3 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                    >
                      <FileText className="h-5 w-5" />
                      <span>OSCAL SSP</span>
                    </SmartLink>
                  </div>
                </div>
                
                <SmartLink 
                  href="/profile" 
                  className="flex items-center space-x-3 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span>Profile</span>
                </SmartLink>
                
                <SmartLink 
                  href="/help" 
                  className="flex items-center space-x-3 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  <HelpCircle className="h-5 w-5" />
                  <span>Help</span>
                </SmartLink>
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 bg-background">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

