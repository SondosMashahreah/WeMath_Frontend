// HTTP boundary fixtures. Backend tests verify real API authorization separately.
export const student = { id: 2, username: 'student.one', full_name: 'الطالب الأول', roles: ['student'], grade: 1 };
const parent = { id: 1, username: 'parent.one', full_name: 'ولي الأمر', roles: ['parent'], grade: null };
const teacher = { id: 20, username: 'teacher.one', full_name: 'المعلّم', role: 'teacher', school: '' };
export const books = [1, 2].map(grade => ({ id: `book${grade}`, grade, semester: 1, title: `كتاب ${grade}`, period_label: 'الفصل الأول', source_url: `https://example.org/book${grade}.pdf`, units: [{ id: `unit${grade}`, number_in_book: 1, title: 'وحدة الأعداد', lessons: [1, 2].map(i => ({ id: `lesson${grade}-${i}`, position: i, title: `درس ${grade}-${i}` })) }] }));
const children = [student, { ...student, id: 3, full_name: 'الطالب الثاني', username: 'student.two' }];
const entries = ['workshops', 'competitions', 'initiatives', 'teacher_resources'].flatMap(section => Array.from({ length: 8 }, (_, i) => ({ id: `${section}-${i}`, section, category: section === 'teacher_resources' ? 'activities' : section === 'initiatives' ? 'schools' : 'scientific', title: `مادة ${section} ${i}`, body: 'تفاصيل المادة التجريبية', summary: '', is_demo: true, archived: false, event_date: '2026-11-10', source_url: null })));
const ok = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
export function installRoutingAPI({ studentProfile = student, catalog = books } = {}) {
  const calls = [], documents = new Map(); let capacity = 2;
  const original = globalThis.fetch;
  globalThis.fetch = async (address, options = {}) => {
    options.signal?.throwIfAborted();
    const url = new URL(address), path = url.pathname, method = options.method || 'GET', body = options.body ? JSON.parse(options.body) : null, token = options.headers?.Authorization?.replace('Bearer ', '');
    calls.push({ path, search: url.search, method, body, token });
    if (path === '/api/curriculum/catalog') return ok({ books: catalog });
    if (path === '/api/auth/me') return ok(token === 'parent-token' ? parent : studentProfile);
    if (path === '/api/auth/login') return ok({ access_token: body.username.startsWith('parent') ? 'parent-token' : 'student-token' });
    if (path === '/api/auth/logout') return ok({ ok: true });
    if (path === '/api/parents/children') return ok({ children: capacity === 2 ? children : Array.from({ length: 5 }, (_, i) => ({ ...student, id: i + 2, full_name: `طفل ${i}` })), max_children: 5 });
    if (/^\/api\/parents\/children\/\d+\/password$/.test(path)) return ok({ ok: true });
    if (/^\/api\/parents\/children\/\d+\/progress$/.test(path)) return ok({ visited: 0, completed: 0, lessons: [] });
    if (/^\/api\/parents\/children\/\d+\/results$/.test(path)) return ok({ results: [] });
    if (/\/lessons\//.test(path)) {
      if (method === 'PUT') return ok({ status: body.activity === 'completed' ? 'completed' : 'in_progress' });
      return ok({ book: books[0], resources: ['quiz', 'worksheet', 'film', 'activity', 'game', 'story_video'].map(id => ({ id, label: id, demo: true, text: 'مورد تجريبي', url: ['film', 'story_video'].includes(id) ? 'https://example.org/video.mp4' : null })) });
    }
    if (path === '/api/platform/teachers/me') return ok(teacher);
    if (/\/teachers\/(login|register)$/.test(path)) return ok({ access_token: 'teacher-token', user: teacher });
    if (path === '/api/platform/teachers/logout') return ok({ ok: true });
    if (path === '/api/platform/teachers/documents' && method === 'POST') {
      const doc = { ...body, id: String(documents.size + 1), version: 1, archived: false }; documents.set(doc.id, doc); return ok(doc, 201);
    }
    if (path === '/api/platform/teachers/documents') {
      const rows = [...documents.values()].filter(doc => doc.kind === url.searchParams.get('kind') && doc.archived === (url.searchParams.get('archived') === 'true'));
      return ok({ items: rows, total: rows.length });
    }
    if (path.startsWith('/api/platform/teachers/documents/')) {
      const id = path.split('/')[5], doc = documents.get(id);
      if (!doc) return ok({ detail: 'غير موجود' }, 404);
      if (method !== 'GET') {
        if (body.version !== doc.version) return ok({ detail: 'تغيّر الملف؛ أعد تحميله قبل الحفظ.' }, 409);
        Object.assign(doc, body, { version: doc.version + 1 });
      }
      return ok(doc);
    }
    if (path === '/api/platform/assistant') return ok({ answer: 'الناتج = 4', steps: [], sources: [], is_demo: true });
    if (/^\/api\/platform\/(entries|teachers\/library)(\/|$)/.test(path)) {
      const privateArea = path.includes('/teachers/library');
      if (privateArea && token !== 'teacher-token') return ok({ detail: 'الدخول مطلوب' }, 401);
      const base = privateArea ? '/api/platform/teachers/library' : '/api/platform/entries';
      if (path !== base) { const row = entries.find(entry => entry.id === path.slice(base.length + 1)); return row ? ok(row) : ok({ detail: 'غير موجود' }, 404); }
      const rows = entries.filter(row => row.section === (privateArea ? 'teacher_resources' : url.searchParams.get('section')) && row.category === url.searchParams.get('category') && row.archived === (url.searchParams.get('archived') === 'true') && row.title.includes(url.searchParams.get('q') || ''));
      const offset = Number(url.searchParams.get('offset') || 0), limit = Number(url.searchParams.get('limit') || 6);
      return ok({ items: rows.slice(offset, offset + limit), total: rows.length });
    }
    throw new Error(`Unmocked route: ${method} ${path}`);
  };
  return { calls, documents, setCapacity(value) { capacity = value; }, restore() { globalThis.fetch = original; } };
}
