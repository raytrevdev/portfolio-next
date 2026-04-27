import TopNav from '@/components/TopNav';
import Hero from '@/components/Hero';
import CapabilityLayers from '@/components/CapabilityLayers';
import SystemDiagrams from '@/components/SystemDiagrams';
import OwnershipTimeline from '@/components/OwnershipTimeline';
import SelectedProjects from '@/components/SelectedProjects';
import Reflection from '@/components/Reflection';
import Contact from '@/components/Contact';

export default function HomePage() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <TopNav />
      <main id="main-content-wrap">
        <Hero />
        <CapabilityLayers />
        <SystemDiagrams />
        <OwnershipTimeline />
        <SelectedProjects />
        <Reflection />
        <Contact />
      </main>
    </>
  );
}
