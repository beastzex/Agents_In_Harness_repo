import React, { useState } from 'react';
import { LandingPage } from './components/landing/LandingPage';
import { StudioPage } from './components/studio/StudioPage';
import { ViewTransition } from './components/transition/ViewTransition';
import { useLenis } from './hooks/useLenis';
import './styles/tokens.css';
import './styles/landing.css';
import './styles/studio.css';

export const App: React.FC = () => {
  useLenis();
  const [currentView, setCurrentView] = useState<'landing' | 'studio'>('landing');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const handleLaunchStudio = () => {
    setIsTransitioning(true);
  };

  const handleBackToLanding = () => {
    setIsTransitioning(true);
  };

  const handleTransitionMidpoint = React.useCallback(() => {
    setCurrentView((prev) => (prev === 'landing' ? 'studio' : 'landing'));
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleTransitionComplete = React.useCallback(() => {
    setIsTransitioning(false);
  }, []);

  return (
    <div className="app-root">
      {/* Step 8: Full-Screen Terracotta Wipe Transition Overlay */}
      <ViewTransition
        isTransitioning={isTransitioning}
        onMidpoint={handleTransitionMidpoint}
        onComplete={handleTransitionComplete}
      />

      {currentView === 'landing' ? (
        <LandingPage onLaunchStudio={handleLaunchStudio} />
      ) : (
        <StudioPage onBackToLanding={handleBackToLanding} />
      )}
    </div>
  );
};

export default App;

