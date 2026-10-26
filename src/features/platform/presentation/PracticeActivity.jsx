import { useState } from "react";

export default function PracticeActivity({ activity }) {
  const [answers, setAnswers] = useState({}), [checked, setChecked] = useState(false);
  const questions = activity.questions || [];
  if (!questions.length) return null;
  return <section className="platform-practice">
    <h3>جرّب النشاط</h3><p>{activity.instructions}</p>
    {questions.map((question, index) => <fieldset key={index}>
      <legend>{index + 1}. {question.prompt}</legend>
      <div className="platform-options">{question.options.map((option, choice) => <button key={choice} className="platform-hex-option" disabled={checked} aria-pressed={answers[index] === choice} onClick={() => setAnswers(previous => ({ ...previous, [index]: choice }))}>{option}</button>)}</div>
      {checked && <p>{answers[index] === question.correct ? "إجابة صحيحة ✓" : `الإجابة الصحيحة: ${question.options[question.correct]}`}<br />{question.explanation}</p>}
    </fieldset>)}
    {checked ? <><p role="status">النتيجة: {questions.filter((q, i) => answers[i] === q.correct).length} / {questions.length}</p><button className="student-secondary-button" onClick={() => { setAnswers({}); setChecked(false); }}>جرّب مجددًا</button></> : <button className="student-primary-button" disabled={Object.keys(answers).length !== questions.length} onClick={() => setChecked(true)}>تحقّق من الإجابات</button>}
    <p className="student-preview-note">تجربة للمعلّم؛ لا تحفظ في تقدم الطلاب.</p>
  </section>;
}
