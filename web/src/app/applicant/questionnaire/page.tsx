import { QuestionnaireWizard } from "@/components/QuestionnaireWizard";

export default function QuestionnairePage() {
  return (
    <>
      <p className="eyebrow">Questionnaire</p>
      <h1>Tell us about your needs</h1>
      <p className="lead">
        Complete the applicable steps for your service route. All fields follow the approved field dictionary.
      </p>
      <QuestionnaireWizard />
    </>
  );
}
