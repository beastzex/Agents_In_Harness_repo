import React from 'react';
import { Navbar } from './Navbar';
import { Hero } from './Hero';
import { Marquee } from './Marquee';
import { ProjectsSplit } from './ProjectsSplit';
import { ExperienceGrid } from './ExperienceGrid';
import { FourMoves } from './FourMoves';
import { StatSection } from './StatSection';
import { Pillars } from './Pillars';
import { DemoVideo } from './DemoVideo';
import { Partners } from './Partners';
import { FinalCTA } from './FinalCTA';
import { Footer } from './Footer';

interface LandingPageProps {
  onLaunchStudio: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchStudio }) => {
  return (
    <div className="landing-page-root">
      {/* A1: Sticky Minimalist Nav */}
      <Navbar onLaunchStudio={onLaunchStudio} />

      <main className="landing-main">
        {/* A2: 100vh Hero with Interactive Mouse Parallax Floating Blocks */}
        <Hero onLaunchStudio={onLaunchStudio} />

        {/* Continuous Scrolling Partner & Tech-Stack Marquee */}
        <Marquee />

        {/* 50/50 Split-Screen Projects (Sticky Left 01 / Deployed Solutions, Scrolling Right Galaxy_PowerAI, VyaparAI, FinnanceAI) */}
        <ProjectsSplit onLaunchStudio={onLaunchStudio} />

        {/* Asymmetrical Masonry Experience & Milestones Grid */}
        <ExperienceGrid />

        {/* The Four Moves Section */}
        <FourMoves />

        {/* Stat Section: Split Color Blocks */}
        <StatSection />

        {/* Three-Pillar Chapters */}
        <Pillars onLaunchStudio={onLaunchStudio} />

        {/* Demo Video Section */}
        <DemoVideo />

        {/* Ecosystem & Inflection Point */}
        <Partners />

        {/* Final CTA Section */}
        <FinalCTA onLaunchStudio={onLaunchStudio} />
      </main>

      {/* Footer */}
      <Footer onLaunchStudio={onLaunchStudio} />
    </div>
  );
};
