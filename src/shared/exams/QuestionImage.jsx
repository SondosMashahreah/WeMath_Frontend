import { useState } from 'react';
import { safeExternalUrl } from '../api/client.js';
export default function QuestionImage({ question }) {
  const [failedUrl, setFailedUrl] = useState('');
  const url = safeExternalUrl(question.image_url);
  if (!url) return null;
  if (failedUrl === url) return <p role="status">تعذر عرض صورة السؤال: {question.image_alt || 'تحقق من رابط الصورة'}</p>;
  return <img className="exam-question-image" src={url} alt={question.image_alt || 'صورة السؤال'} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailedUrl(url)} />;
}
