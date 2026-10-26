import { useState } from "react";
import { usePlatformData } from "../application/usePlatformData.js";
import { bookLabel, externalURL, hiveItem } from "../domain/navigation.js";
import HivePage from "./HivePage.jsx";
import LoadDialog from "./LoadDialog.jsx";
import PlatformDialog from "./PlatformDialog.jsx";

export default function GuestPortal({ onBack }) {
  const state = usePlatformData("/api/platform/guest/catalog");
  const [grade, setGrade] = useState(null), [selected, setSelected] = useState(null);
  if (!state.data) return <LoadDialog state={state} onClose={onBack} />;
  const books = state.data.books.filter(book => book.grade === grade);
  const items = grade ? books.map(book => hiveItem(book.id, bookLabel(book))) : [...new Set(state.data.books.map(book => book.grade))].map(value => hiveItem(value, `الصف ${value}`, { kind: "grade", number: value, lines: [String(value)] }));
  return <HivePage title={grade ? `معاينة الصف ${grade}` : "الزائر"} hint="معاينة للكتاب ودرس نموذجي دون حساب" items={items} onSelect={id => grade ? setSelected(books.find(book => book.id === id)) : setGrade(Number(id))} onBack={() => grade ? setGrade(null) : onBack()}>
    {selected && <PlatformDialog title={selected.title} subtitle={bookLabel(selected)} onClose={() => setSelected(null)}>
      <p className="platform-demo">معاينة فقط؛ لا يحفظ تقدم أو تنشأ حسابات هنا.</p>
      {selected.sample ? <><h3>{selected.sample.unit}</h3><p>درس نموذجي: {selected.sample.lesson}</p><p>افتح الكتاب واقرأ مثال الدرس، ثم حاول شرحه بطريقتك.</p></> : <p>لا يوجد درس نموذجي لهذا الكتاب.</p>}
      {externalURL(selected.source_url) && <a className="student-primary-button" href={externalURL(selected.source_url)} target="_blank" rel="noopener noreferrer">فتح الكتاب ↗</a>}
    </PlatformDialog>}
  </HivePage>;
}
