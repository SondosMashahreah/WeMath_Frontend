import HexDialog from "./HexDialog.jsx";
import { useNavigate } from "react-router-dom";
export default function RouteFeedback({ title = "الصفحة غير متاحة", message = "هذا الرابط غير موجود أو لم يعد متاحًا.", back = "/", retry }) {
  const navigate = useNavigate();
  return <HexDialog title={title} onClose={() => navigate(back, { replace: true })}><p role={retry ? "alert" : "status"}>{message}</p>{retry && <button className="student-primary-button" onClick={retry}>إعادة المحاولة</button>}<button className="student-secondary-button" onClick={() => navigate(back, { replace: true })}>رجوع</button></HexDialog>;
}
