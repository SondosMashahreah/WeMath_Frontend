import MathText from "../../../shared/exams/MathText.jsx";
import QuestionImage from "../../../shared/exams/QuestionImage.jsx";
import { useState } from "react";

export default function PracticeActivity({ activity }) {
  const [answers, setAnswers] = useState({}), [checked, setChecked] = useState(false);
  const questions = activity.questions || [];
  if (!questions.length) return null;
  return <section className="platform-practice">
    <h3>جرّب النشاط</h3><p>{activity.instructions}</p>
    {questions.map((question, index) => <fieldset key={index}>
      <legend>{index + 1}. <MathText>{question.prompt}</MathText> <small>({question.points || 1} علامة)</small></legend><QuestionImage question={question} />
      <div className="platform-options">{question.options.map((option, choice) => <button key={choice} className="platform-hex-option" disabled={checked} aria-pressed={answers[index] === choice} onClick={() => setAnswers(previous => ({ ...previous, [index]: choice }))}><MathText>{option}</MathText></button>)}</div>
      {checked && <p><MathText>{answers[index] === question.correct ? "إجابة صحيحة ✓" : `الإجابة الصحيحة: ${question.options[question.correct]}`}</MathText><br /><MathText>{question.explanation}</MathText></p>}
    </fieldset>)}
    {checked ? <><p role="status">النتيجة: {questions.reduce((sum, q, i) => sum + (answers[i] === q.correct ? q.points || 1 : 0), 0)} / {questions.reduce((sum, q) => sum + (q.points || 1), 0)}</p><button className="student-secondary-button" onClick={() => { setAnswers({}); setChecked(false); }}>جرّب مجددًا</button></> : <button className="student-primary-button" disabled={Object.keys(answers).length !== questions.length} onClick={() => setChecked(true)}>تحقّق من الإجابات</button>}
    <p className="student-preview-note">تجربة للمعلّم؛ لا تحفظ في تقدم الطلاب.</p>
  </section>;
}
