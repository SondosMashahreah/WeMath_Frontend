import katex from 'katex';
import 'katex/dist/katex.min.css';
import './exams.css';

// Text remains escaped by React; only bounded KaTeX output is inserted as markup.
export default function MathText({ children = '' }) {
  return <span className="exam-math-text">{String(children).split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g).map((part, i) => {
    if (!part.startsWith('$') || !part.endsWith('$') || part.length < 3) return part;
    const block = part.startsWith('$$'), expression = part.slice(block ? 2 : 1, block ? -2 : -1);
    if (expression.length > 2000) return part;
    try {
      const html = katex.renderToString(expression, { displayMode: block, throwOnError: false, trust: false, strict: 'ignore', maxExpand: 100, maxSize: 10, macros: {} });
      return <span key={i} dir="ltr" className="exam-formula" dangerouslySetInnerHTML={{ __html: html }} />;
    } catch { return part; }
  })}</span>;
}
