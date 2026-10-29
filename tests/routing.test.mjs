import test from 'node:test';
import assert from 'node:assert/strict';
import { studentPath, childPath, documentPath, teacherCurriculumPath, contentPath, safeReturnPath, readListQuery } from '../src/shared/routing/paths.js';
import { validJourney } from '../src/features/student/domain/validateJourney.js';
import { createCurriculumRepository } from '../src/features/student/infrastructure/apiCurriculumRepository.js';
import { books } from './support/routing-api.mjs';
const curriculum = createCurriculumRepository(books);
test('URL contracts cover nested journeys, independent roles and encoded identifiers', () => {
  assert.equal(studentPath({ semester: 'book1', unit: 'unit1', lesson: 'lesson1', activity: 'worksheet' }), '/student/books/book1/units/unit1/lessons/lesson1/activities/worksheet');
  assert.equal(studentPath({ semester: 'a/b' }, childPath(7, 'curriculum')), '/parent/children/7/curriculum/books/a%2Fb');
  assert.equal(teacherCurriculumPath({ grade: 1, bookId: 'book1', unitId: 'unit1', lessonId: 'lesson1' }), '/teachers/curriculum/grades/1/books/book1/units/unit1/lessons/lesson1');
  assert.equal(contentPath('/workshops', 'scientific', 'entry/1'), '/workshops/scientific/entry%2F1');
  assert.equal(documentPath('assessment', 4, true), '/teachers/assessments/4/edit');
});
test('login return URLs stay within the requested role and cannot loop into access pages', () => {
  assert.equal(safeReturnPath('/student/books/book1?panel=book', '/student'), '/student/books/book1?panel=book');
  for (const value of ['https://evil.invalid', '//evil.invalid', '/parent', '/student-other', '/student/../../parent', '/student/login', '/student/register?next=/student', null]) assert.equal(safeReturnPath(value, '/student'), '/student', String(value));
});
test('query state rejects invalid pagination and calendar values', () => {
  assert.deepEqual(readListQuery('?page=2&archived=1&month=2026-11&q=الجمع&panel=calendar'), { page: 2, archived: true, month: '2026-11', q: 'الجمع', panel: 'calendar' });
  for (const page of ['0', '-1', 'NaN', '1.5', '10001']) assert.equal(readListQuery(`?page=${page}`).page, 1);
  assert.equal(readListQuery('?month=2026-13&panel=unknown').month, '');
  assert.equal(readListQuery('?month=2026-13&panel=unknown').panel, null);
});
test('direct lesson links must belong to the account grade and every URL ancestor', () => {
  const state = { grade: 1, semester: 'book1', unit: 'unit1', lesson: 'lesson1-1' };
  assert.equal(validJourney(state, curriculum, 'worksheet'), true);
  for (const changes of [{ grade: 2 }, { semester: 'book2' }, { unit: 'unit2' }, { lesson: 'lesson2-1' }, { semester: null }, { unit: null }]) assert.equal(validJourney({ ...state, ...changes }, curriculum, 'worksheet'), false);
  assert.equal(validJourney(state, curriculum, 'unknown'), false);
  assert.equal(validJourney({ grade: 1 }, curriculum), true);
  assert.equal(validJourney({ grade: 1 }, curriculum, 'game'), false);
});
