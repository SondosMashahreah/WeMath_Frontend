import { useState } from "react";
import HexDialog from "./HexDialog.jsx";
import { accountRepository } from "../infrastructure/accountRepository.js";
export default function AccountDialog({ profile, onClose, onLogout }) {
  const [pending, setPending] = useState(false);
  async function logout() {
    setPending(true);
    try { await accountRepository.logout(); } catch { /* Local credentials were removed. */ }
    finally { onLogout(); }
  }
  return <HexDialog title={profile.full_name} subtitle={`اسم المستخدم: ${profile.username}`} onClose={onClose}>
    {profile.grade && <p className="account-grade">الصف {profile.grade}</p>}
    <button className="student-primary-button" disabled={pending} onClick={logout}>{pending ? "جاري الخروج…" : "تسجيل الخروج"}</button>
  </HexDialog>;
}
