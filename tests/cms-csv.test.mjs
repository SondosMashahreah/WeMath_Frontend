import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCSV } from '../src/features/admin/csv.js';
test('CSV accepts Arabic, BOM, commas, quotes and multiline Excel cells', () => {
  assert.deepEqual(parseCSV('\uFEFFtitle,body\r\n"ورشة, علمية","سطر أول\nسطر ""ثان"""\r\n'), [{ title: 'ورشة, علمية', body: 'سطر أول\nسطر "ثان"' }]);
});
test('CSV rejects malformed files, unknown columns and excessive batch sizes', () => {
  for (const text of ['title,unknown\na,b', 'title,title\na,b', 'title,body\na', 'title\n"open', 'title\n"a"b', 'title\n', 'title\n' + Array(101).fill('item').join('\n')]) assert.throws(() => parseCSV(text));
});
