import test from "node:test";
import assert from "node:assert/strict";
import { initialJourney, journeyReducer, selectJourneyItem } from "../src/features/student/domain/journey.js";
import { REGISTRATION_FIELDS, validateAccess } from "../src/features/student/domain/accessValidation.js";
import { presentJourney } from "../src/features/student/application/presentJourney.js";
import { previewCurriculumRepository as curriculum } from "../src/features/student/infrastructure/previewCurriculumRepository.js";
import { studentLayout } from "../src/features/student/presentation/studentLayout.js";
import { DESKTOP_HIVE, desktopHiveLayout, cameraBounds, DISC_RADIUS } from "../src/lib/beeConfig.js";

test("every grade 1–12 leads to exactly two semesters, then units and lessons", () => {
  const grades = presentJourney(initialJourney, curriculum);
  assert.deepEqual(grades.items.map(item => item.lines), Array.from({ length: 12 }, (_, i) => [String(i + 1)]));
  for (const grade of grades.items) {
    const gradeState = selectJourneyItem(initialJourney, grade.id, curriculum);
    const semesters = presentJourney(gradeState, curriculum);
    assert.equal(semesters.title, grade.label);
    assert.deepEqual(semesters.items.map(item => item.label), ["الفصل الأول", "الفصل الثاني"]);
    for (const semester of semesters.items) {
      const semesterState = selectJourneyItem(gradeState, semester.id, curriculum);
      const units = presentJourney(semesterState, curriculum);
      assert.equal(units.title, semester.label);
      for (const unit of units.items) {
        const unitState = selectJourneyItem(semesterState, unit.id, curriculum);
        const lessons = presentJourney(unitState, curriculum);
        assert.equal(lessons.title, unit.label);
        const selected = selectJourneyItem(unitState, lessons.items[0].id, curriculum);
        assert.equal(selected.lesson, lessons.items[0].id);
        assert.equal(presentJourney(selected, curriculum).key, lessons.key, "lesson selection has no extra page");
      }
    }
  }
});

test("back, breadcrumbs and parent changes clear all stale descendants", () => {
  let state = selectJourneyItem(initialJourney, "12", curriculum);
  state = selectJourneyItem(state, "2", curriculum);
  const units = presentJourney(state, curriculum).items;
  state = selectJourneyItem(state, units[0].id, curriculum);
  state = selectJourneyItem(state, presentJourney(state, curriculum).items[0].id, curriculum);
  const crumbs = presentJourney(state, curriculum).breadcrumbs;
  assert.equal(crumbs.length, 4);
  assert.deepEqual(journeyReducer(state, crumbs[0].action), initialJourney);
  assert.deepEqual(journeyReducer(state, crumbs[1].action), { ...initialJourney, grade: 12 });
  assert.deepEqual(journeyReducer(state, { type: "back" }), { ...initialJourney, grade: 12, semester: 2 });
  assert.deepEqual(journeyReducer(state, { type: "grade", value: 1 }), { ...initialJourney, grade: 1 });
  assert.equal(selectJourneyItem(state, "missing", curriculum), state);
  assert.equal(selectJourneyItem(initialJourney, "13", curriculum), initialJourney);
  const anotherSemester = journeyReducer(state, { type: "semester", value: 1 });
  assert.equal(selectJourneyItem(anotherSemester, units[0].id, curriculum), anotherSemester, "a unit from a different semester is rejected");
});

test("access requires precisely the requested fields and supports Arabic numerals", () => {
  assert.deepEqual(REGISTRATION_FIELDS.map(field => field.name), ["studentName", "identityNumber", "school", "phone", "email", "directorate"]);
  assert.deepEqual(Object.keys(validateAccess("login", {})), ["username", "password"]);
  assert.deepEqual(validateAccess("login", { username: "student", password: "preview" }), {});
  const data = { studentName: "طالب تجريبي", identityNumber: "١٢٣٤٥٦٧٨٩", school: "مدرسة تجريبية", phone: "٠٥٩ ١٢٣ ٤٥٦٧", email: "student@example.com", directorate: "مديرية تجريبية" };
  assert.deepEqual(validateAccess("register", data), {});
  for (const name of REGISTRATION_FIELDS.map(field => field.name)) assert(validateAccess("register", { ...data, [name]: "" })[name]);
  assert(validateAccess("register", { ...data, email: "not-an-email" }).email);
  assert(validateAccess("register", { ...data, phone: "-------" }).phone);
  assert(validateAccess("register", { ...data, identityNumber: "abcdefghi" }).identityNumber);
});

function polygon(box) {
  return [[-.5,0],[-.25,-.5],[.25,-.5],[.5,0],[.25,.5],[-.25,.5]].map(([x,y]) => ({ x: box.x + box.width*x, y: box.y + box.height*y }));
}
function intersects(a,b) {
  for (const poly of [a,b]) for (let i=0;i<poly.length;i++) {
    const p=poly[i],q=poly[(i+1)%poly.length],axis={x:q.y-p.y,y:p.x-q.x};
    const pa=a.map(v=>v.x*axis.x+v.y*axis.y),pb=b.map(v=>v.x*axis.x+v.y*axis.y);
    if(Math.max(...pa)<=Math.min(...pb)||Math.max(...pb)<=Math.min(...pa)) return false;
  }
  return true;
}
test("all cells stay readable, in bounds and separated on desktop and phone", () => {
  for (const [width,height] of [[320,568],[390,844],[768,1024],[800,600],[844,390],[1024,768],[1440,900],[1917,907],[1920,1080]]) {
    let previousCell;
    for (const count of [2,4,6,12]) {
      const items=Array.from({length:count},(_,i)=>({id:String(i+1)}));
      const layout=studentLayout(width,height,items);
      const cell=layout.cells["1"];
      if(previousCell) assert.deepEqual([cell.width,cell.height],[previousCell.width,previousCell.height], "cell size stays constant between journey stages");
      previousCell=cell;
      if(!layout.mobile){
        assert.equal(layout.height,height,"desktop uses exactly the viewport, without extra scrolling");
        const home=desktopHiveLayout(width,height),pixelsPerUnit=width/cameraBounds(width,height).width;
        assert(Math.abs(layout.center.width-home.centerScale.x*2*DISC_RADIUS*pixelsPerUnit)<1e-6,"center matches the home page size");
        assert(Math.abs(layout.center.height-home.centerScale.y*Math.sqrt(3)*DISC_RADIUS*pixelsPerUnit)<1e-6);
        assert(Math.abs(layout.center.x-(home.center.x*pixelsPerUnit+width/2))<1e-6,"center matches the home page position");
        assert(Math.abs(layout.center.y-(height/2-home.center.y*pixelsPerUnit))<1e-6);
        assert(Math.abs(cell.width/layout.center.width-DESKTOP_HIVE.cells.students.width/DESKTOP_HIVE.center.width)<1e-6,"small cells retain the home page proportions");
      }
      const boxes=[layout.center,...Object.values(layout.cells)];
      for(const box of boxes){
        assert(box.width>=44&&box.height>=44, "minimum touch size");
        assert(box.x-box.width/2>=0&&box.x+box.width/2<=width, `horizontal clipping ${width}/${count}`);
        assert(box.y-box.height/2>=0&&box.y+box.height/2<=layout.height, `vertical clipping ${width}/${count}`);
      }
      const polygons=boxes.map(polygon);
      for(let i=0;i<polygons.length;i++)for(let j=i+1;j<polygons.length;j++)assert(!intersects(polygons[i],polygons[j]),`overlapping cells ${width}/${count}/${i}/${j}`);
    }
  }
});
