const PORTAL_ROLES = ["student", "parent"];

export function canEnterPortal(profile, role) {
  return PORTAL_ROLES.includes(role) && Array.isArray(profile?.roles) && profile.roles.includes(role);
}

export function restoredPortalRole(profile) {
  const roles = PORTAL_ROLES.filter(role => canEnterPortal(profile, role));
  // A multi-role account must choose an entry instead of silently favouring parents.
  return roles.length === 1 ? roles[0] : null;
}

export function assertPortalAccess(profile, role) {
  if (!canEnterPortal(profile, role)) {
    throw new Error(role === "student"
      ? "هذا الحساب ليس حساب طالب. أدخل اسم المستخدم وكلمة المرور الخاصين بالطالب."
      : "هذا الحساب ليس حساب أهل. أدخل اسم المستخدم وكلمة المرور الخاصين بولي الأمر.");
  }
}
