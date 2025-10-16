'use client';

import Header from './Header';
import Navigation from './Navigation';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <div className="flex">
        <Navigation />
        
        <main className="apollo-main">
          {children}
        </main>
      </div>
    </div>
  );
}
