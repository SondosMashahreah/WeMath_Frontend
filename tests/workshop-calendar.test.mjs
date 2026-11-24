import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarFilters, dayValid, monthDays, shiftMonth, todayInJerusalem } from '../src/shared/calendar/dates.js';
import { CATEGORIES } from '../src/features/platform/domain/navigation.js';
test('calendar uses Jerusalem dates, leap years and bounded month/year jumps', () => {
  assert.equal(todayInJerusalem(new Date('2026-11-22T23:30:00Z')), '2026-11-23');
  assert.equal(shiftMonth('2026-12',1),'2027-01');
  assert.equal(shiftMonth('1900-01',-12),'1900-01');
  assert.equal(shiftMonth('2199-12',12),'2199-12');
  const days=monthDays('2024-02');
  assert.equal(days.length,42); assert.equal(new Set(days).size,42); assert(days.includes('2024-02-29'));
  assert(!dayValid('2026-02-29')); assert(dayValid('2024-02-29'));
});
test('invalid URL calendar filters fall back without requesting invalid dates', () => {
  const value=calendarFilters(new URLSearchParams('month=2026-13&day=2026-02-31&view=day&page=-4&status=bad'),'2026-11-22');
  assert.equal(value.month,'2026-11'); assert.equal(value.mode,'month'); assert.equal(value.page,1); assert.equal(value.status,'');
  assert.equal(CATEGORIES.workshops.ministry,'الوزارة');
});
