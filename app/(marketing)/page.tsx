import { HeroImpact } from "@/components/landing/HeroImpact";
import { BeforeAfterGallery } from "@/components/landing/BeforeAfterGallery";
import { ProblemSolution } from "@/components/landing/ProblemSolution";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { SecurityTrust } from "@/components/landing/SecurityTrust";
import { SocialProof } from "@/components/landing/SocialProof";
import { Pricing } from "@/components/marketing/Pricing";
import { FinalCTA } from "@/components/landing/FinalCTA";

export default function HomePage() {
  return (
    <>
      <HeroImpact />
      <BeforeAfterGallery />
      <ProblemSolution />
      <HowItWorks />
      <SecurityTrust />
      <SocialProof />
      <Pricing />
      <FinalCTA />
    </>
  );
}
