'use client';

import { NavHeader } from './NavHeader';
import { HeroSection } from './HeroSection';
import { FeaturesSection } from './FeaturesSection';
import { TechnicalSection } from './TechnicalSection';
import { DemoSection } from './DemoSection';
import { FooterSection } from './FooterSection';

export function LandingPage() {
  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 dark:from-blue-950/20 dark:via-transparent dark:to-purple-950/20"></div>
      <NavHeader />
      <HeroSection />
      <FeaturesSection />
      <TechnicalSection />
      <DemoSection />
      <FooterSection />
    </div>
  );
}