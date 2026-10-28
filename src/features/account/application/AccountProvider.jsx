import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { accountRepository } from "../infrastructure/accountRepository.js";
import { AccountContext } from "./accountContext.js";
export default function AccountProvider({ children }) {
  const [session, setSession] = useState({ profile: null, loading: true, error: null });
  const pending = useRef(null);
  const restore = useCallback(() => {
    pending.current?.abort(); const controller = new AbortController(); pending.current = controller;
    accountRepository.restore(controller.signal)
      .then(profile => { if (!controller.signal.aborted) setSession({ profile, loading: false, error: null }); })
      .catch(error => { if (!controller.signal.aborted) setSession({ profile: null, loading: false, error: error.status === 401 ? null : error }); });
  }, []);
  const accept = useCallback(profile => { pending.current?.abort(); setSession({ profile, loading: false, error: null }); }, []);
  const clear = useCallback(() => { pending.current?.abort(); accountRepository.clearSession(); setSession({ profile: null, loading: false, error: null }); }, []);
  useEffect(() => { restore(); return () => pending.current?.abort(); }, [restore]);
  useEffect(() => { window.addEventListener("wemath:session-expired", clear); return () => window.removeEventListener("wemath:session-expired", clear); }, [clear]);
  const value = useMemo(() => ({ ...session, accept, clear, restore }), [session, accept, clear, restore]);
  return <AccountContext value={value}>{children}</AccountContext>;
}
