import { QuestionnaireWizard } from "@/components/QuestionnaireWizard";

export default function QuestionnairePage() {
  return (
    <>
      <p className="eyebrow">Questionnaire</p>
      <h1>Your assessment</h1>
      <p className="lead">Complete the applicable steps for your service route. All fields follow the approved field dictionary.</p>
      <QuestionnaireWizard />
    </>
  );
}
