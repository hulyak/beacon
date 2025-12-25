'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ModernNavigation } from '@/components/layout/modern-navigation';
import { UnifiedVoiceAssistant } from '@/components/voice/unified-voice-assistant';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Don't show navigation on landing page
  const showNavigation = pathname !== '/';

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  if (!showNavigation) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernNavigation
        currentPath={pathname}
        onNavigate={handleNavigate}
      />

      {/* Main content area with proper sidebar spacing */}
      <div className="lg:pl-64">
        <main className="min-h-screen">
          {children}
        </main>
      </div>

      {/* Voice Assistant - shown on all pages */}
      <UnifiedVoiceAssistant currentPage={pathname} />
    </div>
  );
}
