import { useState } from "react";
import HexDialog from "./HexDialog.jsx";
import AccountForm from "./AccountForm.jsx";
import { accountRepository } from "../infrastructure/accountRepository.js";
export default function AccountDialog({ profile, onClose, onLogout }) {
  const [pending, setPending] = useState(false), [passwordOpen, setPasswordOpen] = useState(false), [passwordSaved, setPasswordSaved] = useState(false);
  async function logout() {
    setPending(true);
    try { await accountRepository.logout(); } catch { /* Local credentials were removed. */ }
    finally { onLogout(); }
  }
  return <HexDialog wide={passwordOpen} title={profile.full_name} subtitle={`اسم المستخدم: ${profile.username}`} onClose={onClose}>
    {profile.grade && <p className="account-grade">الصف {profile.grade}{profile.track ? ` · ${profile.track}` : ""}</p>}
    {passwordOpen ? <>{passwordSaved ? <p role="status">تم تغيير كلمة المرور وتحديث جلستك الحالية.</p> : <AccountForm mode="changePassword" onSubmit={accountRepository.changePassword} onComplete={() => setPasswordSaved(true)} submitLabel="حفظ كلمة المرور الجديدة" />}<button className="student-secondary-button" type="button" onClick={() => { setPasswordOpen(false); setPasswordSaved(false); }}>رجوع للحساب</button></> : <div className="student-access-choices"><button className="student-secondary-button" type="button" onClick={() => setPasswordOpen(true)}>تغيير كلمة المرور</button><button className="student-primary-button" disabled={pending} onClick={logout}>{pending ? "جاري الخروج…" : "تسجيل الخروج"}</button></div>}
  </HexDialog>;
}
