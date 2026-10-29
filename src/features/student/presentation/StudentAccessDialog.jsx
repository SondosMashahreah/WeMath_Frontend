import { useEffect, useRef } from "react";
import AccountForm from "../../account/presentation/AccountForm.jsx";
import HexDialog from "../../account/presentation/HexDialog.jsx";
import { accountRepository } from "../../account/infrastructure/accountRepository.js";
export default function StudentAccessDialog({ role = "student", mode = "login", onModeChange, onClose, onComplete }) {
  const pendingRequest = useRef(null);
  useEffect(() => () => pendingRequest.current?.abort(), [role, mode]);
  function submit(values) {
    pendingRequest.current?.abort();
    const controller = new AbortController();
    pendingRequest.current = controller;
    return accountRepository[mode](values, { role, signal: controller.signal });
  }
  function changeMode(next) { pendingRequest.current?.abort(); onModeChange(next); }
  return <HexDialog wide={mode === "register"} onClose={onClose} title={role === "parent" ? "مساحة الأهل" : mode === "register" ? "إنشاء حساب طالب" : "تسجيل دخول الطالب"}
    subtitle={mode === "choice" ? "رحلتك تبدأ من هنا" : mode === "login" ? "ادخل باسم المستخدم وكلمة المرور." : role === "parent" ? "حساب واحد لمتابعة حتى خمسة أطفال." : "اختر صفك مرة واحدة، لنفتح لك منهجك مباشرة."}>
    {mode === "choice" ? <div className="student-access-choices">
      <button className="student-primary-button" onClick={() => changeMode("login")}>تسجيل الدخول <span aria-hidden="true">←</span></button><button className="student-secondary-button" onClick={() => changeMode("register")}>إنشاء حساب</button>
    </div> : <><AccountForm key={`${role}-${mode}`} mode={mode} role={role} onSubmit={submit} onComplete={onComplete} submitLabel={mode === "login" ? "دخول" : "إنشاء حساب"} />
      <p className="student-switch-access">{mode === "login" ? "ليس لديك حساب؟" : "لديك حساب؟"} <button type="button" onClick={() => changeMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "إنشاء حساب" : "تسجيل الدخول"}</button></p></>}
  </HexDialog>;
}
