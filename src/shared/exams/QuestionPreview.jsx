import MathText from './MathText.jsx';
import QuestionImage from './QuestionImage.jsx';
export default function QuestionPreview({ question: q, answers = true }) {
  return <div className="exam-preview" dir="rtl"><p><MathText>{q.prompt || 'نص السؤال'}</MathText> <small>({q.points || 1} علامة)</small></p><QuestionImage question={q} /><ol>{q.options.map((option, i) => <li key={i}><MathText>{option || '…'}</MathText>{answers && q.correct === i && <strong> ✓</strong>}</li>)}</ol>{answers && q.explanation && <p><MathText>{q.explanation}</MathText></p>}</div>;
}
