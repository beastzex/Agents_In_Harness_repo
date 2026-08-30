import React, { useState } from 'react';
import { RoomSpec } from '../../types/studio';
import { SetupScreen } from './SetupScreen';
import { StudioWorkspace } from './StudioWorkspace';

interface StudioPageProps {
  onBackToLanding: () => void;
}

export const StudioPage: React.FC<StudioPageProps> = ({ onBackToLanding }) => {
  const [currentStep, setCurrentStep] = useState<'setup' | 'workspace'>('setup');
  const [activeSpec, setActiveSpec] = useState<RoomSpec>({
    lengthFeet: 14,
    widthFeet: 18,
    heightFeet: 9,
    budgetLimit: 4000,
    style: 'warm-minimalist',
    roomType: 'living-room',
    beforePhotoUrl: '/images/anchor_image.png',
  });

  const handleStartDesign = (spec: RoomSpec) => {
    setActiveSpec(spec);
    setCurrentStep('workspace');
  };

  const handleBackToSetup = () => {
    setCurrentStep('setup');
  };

  return (
    <div className="studio-root-container">
      {currentStep === 'setup' ? (
        <SetupScreen
          onStartDesign={handleStartDesign}
          onBackToLanding={onBackToLanding}
        />
      ) : (
        <StudioWorkspace
          roomSpec={activeSpec}
          onBackToSetup={handleBackToSetup}
        />
      )}
    </div>
  );
};
