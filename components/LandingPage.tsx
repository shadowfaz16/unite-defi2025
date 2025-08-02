'use client';

import { NavHeader } from './NavHeader';
import { HeroSection } from './HeroSection';
import { FeaturesSection } from './FeaturesSection';
import { TechnicalSection } from './TechnicalSection';
import { DemoSection } from './DemoSection';
import { FooterSection } from './FooterSection';

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <NavHeader />
      <HeroSection />
      <FeaturesSection />
      <TechnicalSection />
      <DemoSection />
      <FooterSection />
    </div>
  );
}