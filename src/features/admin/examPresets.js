const base = { type: 'mcq', variables: [{ name: 'a', minimum: 1, maximum: 20, step: 1 }, { name: 'b', minimum: 1, maximum: 10, step: 1 }], constraints: [], answer: 'a+b', distractors: ['answer+1', 'answer-1', 'answer+2'], explanation: 'الإجابة هي {answer}', image_url: '', image_alt: '', points: 1 };
export const presets = [
  { label: 'جمع عددين', template: { ...base, prompt: 'احسب: ${a} + {b}$' } },
  { label: 'طرح بدون ناتج سالب', template: { ...base, prompt: 'احسب: ${a} - {b}$', answer: 'a-b', constraints: ['a>=b'], distractors: ['answer+1', 'answer+2', 'answer+3'] } },
  { label: 'قسمة بدون باقي', template: { ...base, prompt: 'احسب: ${a} \\div {b}$', answer: 'a/b', constraints: ['a%b==0'], distractors: ['answer+1', 'answer+2', 'answer+3'] } },
  { label: 'مساحة مستطيل', template: { ...base, prompt: 'مستطيل طوله {a} سم وعرضه {b} سم. ما مساحته بالسنتيمتر المربع؟', answer: 'a*b', explanation: 'المساحة = الطول × العرض = {answer}' } },
  { label: 'مقارنة عددين — صح/خطأ', template: { ...base, type: 'true_false', prompt: 'صح أم خطأ: ${a} > {b}$', answer: 'a>b', distractors: [], explanation: 'العبارة: {answer}' } },
];
export const emptyQuestion = () => ({ type: 'mcq', prompt: '', options: ['', '', '', ''], correct: -1, explanation: '', image_url: '', image_alt: '', points: 1 });
