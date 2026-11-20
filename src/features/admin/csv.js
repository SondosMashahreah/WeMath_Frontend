// RFC 4180 quoted cells, multiline values and UTF-8 BOM from spreadsheet editors.
export const COLUMNS = ['title', 'summary', 'body', 'source_url', 'lesson_id', 'category', 'event_date', 'organizer', 'audience', 'location', 'registration_start', 'registration_end'];
export function templateColumns(resource) {
  return resource ? ['title', 'summary', 'body', 'source_url', 'lesson_id'] : ['title', 'summary', 'body', 'source_url', 'category', 'event_date', 'organizer', 'audience', 'location', 'registration_start', 'registration_end'];
}
export function parseCSV(text) {
  text = text.replace(/^\uFEFF/, '');
  const rows = []; let row = [], cell = '', quoted = false, closed = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else cell += c;
    } else if (c === '"' && !cell && !closed) quoted = true;
    else if (c === ',' || c === '\n' || c === '\r') {
      row.push(cell); cell = ''; closed = false;
      if (c !== ',') { if (row.some(Boolean)) rows.push(row); row = []; if (c === '\r' && text[i + 1] === '\n') i++; }
    } else { if (closed || c === '"') throw new Error('تنسيق CSV غير صالح'); cell += c; }
  }
  if (quoted) throw new Error('علامة اقتباس غير مغلقة في CSV');
  row.push(cell); if (row.some(Boolean)) rows.push(row);
  const header = rows.shift();
  if (!header || !header.includes('title') || header.some(key => !COLUMNS.includes(key)) || new Set(header).size !== header.length) throw new Error('استخدم عناوين القالب الأصلي دون تغيير');
  if (!rows.length || rows.length > 100) throw new Error('كل دفعة يجب أن تحتوي من 1 إلى 100 مادة');
  return rows.map((values, index) => {
    if (values.length !== header.length) throw new Error(`عدد الأعمدة غير صحيح في السطر ${index + 2}`);
    const result = Object.fromEntries(header.map((key, i) => [key, values[i]]));
    if (!result.title?.trim()) throw new Error(`العنوان مطلوب في السطر ${index + 2}`);
    return result;
  });
}
