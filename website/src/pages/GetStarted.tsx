import IntroSection from './getstarted/IntroSection';
import InstallSection from './getstarted/InstallSection';
import SetupSection from './getstarted/SetupSection';
import FenceSection from './getstarted/FenceSection';
import BlockTypesSection from './getstarted/BlockTypesSection';
import InlineSection from './getstarted/InlineSection';
import EditorDemoSection from './getstarted/EditorDemoSection';
import NextStepsSection from './getstarted/NextStepsSection';

export default function GetStarted() {
  return (
    <>
      <IntroSection />
      <InstallSection />
      <SetupSection />
      <FenceSection />
      <BlockTypesSection />
      <InlineSection />
      <EditorDemoSection />
      <NextStepsSection />
    </>
  );
}
