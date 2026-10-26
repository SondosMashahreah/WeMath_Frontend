import PlatformDialog from "./PlatformDialog.jsx";
export default function LoadDialog({ state, onClose }) {
  return <PlatformDialog title={state.error ? "تعذّر تحميل المحتوى" : "جاري التحميل…"} onClose={onClose}>
    <p role={state.error ? "alert" : "status"}>{state.error?.message || "لحظات ونفتح المساحة."}</p>
    {state.error && <button className="student-primary-button" onClick={state.retry}>إعادة المحاولة</button>}
  </PlatformDialog>;
}
