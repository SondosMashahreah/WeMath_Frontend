// HTTP fixtures only. Real permission and publication behavior is covered by backend tests/test_cms.py.
export function installCMSAPI() {
  const original = globalThis.fetch, content = new Map(), workspaces = [], staff = [], calls = [];
  const modules = { quiz: { label: 'الامتحانات', resource: true, categories: {} }, worksheet: { label: 'أوراق العمل', resource: true, categories: {} }, workshops: { label: 'الورشات', resource: false, categories: { scientific: 'ورشات عالمية' } } };
  const books = [{ id: 'book1', grade: 1, title: 'رياضيات الصف الأول', units: [{ id: 'unit1', title: 'الأعداد', lessons: [{ id: 'lesson1', title: 'الجمع' }] }] }];
  const ok = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
  globalThis.fetch = async (url, options = {}) => {
    options.signal?.throwIfAborted();
    const path = new URL(url).pathname, params = new URL(url).searchParams, method = options.method || 'GET', body = options.body ? JSON.parse(options.body) : null;
    const admin = options.headers?.Authorization === 'Bearer admin-token';
    calls.push({ path, method, body });
    if (path === '/api/auth/login') return ok({ access_token: body.username === 'administrator' ? 'admin-token' : 'editor-token' });
    if (path === '/api/auth/logout') return new Response(null, { status: 204 });
    if (path === '/api/curriculum/catalog') return ok({ books });
    if (path === '/api/cms/me') return ok({ id: admin ? 1 : 2, name: admin ? 'مديرة المنصة' : 'مدخل البيانات', is_admin: admin, modules, workspaces: workspaces.filter(w => admin || w.member_ids.includes(2)) });
    if (path === '/api/cms/staff') {
      if (!admin) return ok({ detail: 'غير مسموح' }, 403);
      if (method === 'POST') { const row = { id: 2, name: body.full_name, username: body.username, email: body.email, team_type: body.team_type, active: true }; staff.push(row); if (body.create_workspace) workspaces.push({id:workspaces.length+1,name:body.full_name,team_type:body.team_type,modules:body.modules,member_ids:[2],can_publish:false,active:true,version:1}); return ok(row, 201); }
      return ok({ items: staff, total: staff.length });
    }
    if (path === '/api/cms/workspaces' && method === 'POST') { const row = { id: workspaces.length + 1, version: 1, ...body }; workspaces.push(row); return ok(row, 201); }
    if (path === '/api/cms/content') {
      if (method === 'POST') { const row = { id: content.size + 1, ...body, status: 'draft', version: 1, updated_at: '2026-11-19T10:00:00Z' }; content.set(row.id, row); return ok(row, 201); }
      const items = [...content.values()].filter(row => !params.get('module') || row.module === params.get('module'));
      return ok({ items, total: items.length, counts: { draft: items.filter(r => r.status === 'draft').length, published: items.filter(r => r.status === 'published').length } });
    }
    const match = path.match(/^\/api\/cms\/content\/(\d+)(\/status)?$/);
    if (match) {
      const row = content.get(Number(match[1])); if (!row) return ok({ detail: 'غير موجود' }, 404);
      if (method !== 'GET') {
        if (body.version !== row.version) return ok({ detail: 'عدّل شخص آخر هذا السجل' }, 409);
        if (match[2]) { if (body.status === 'published' && !admin) return ok({ detail: 'النشر للأدمن' }, 403); row.status = body.status; }
        else Object.assign(row, body, { status: 'draft' });
        row.version++;
      }
      return ok(row);
    }
    throw new Error(`Unexpected CMS test request ${method} ${path}`);
  };
  return { calls, content, restore() { globalThis.fetch = original; } };
}
