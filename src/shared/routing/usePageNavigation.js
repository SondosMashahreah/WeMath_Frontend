import { useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
export function usePageNavigation() {
  const navigate = useNavigate(), location = useLocation(), from = location.pathname + location.search;
  const go = useCallback((to, options = {}) => navigate(to, { ...options, state: { from, ...options.state } }), [navigate, from]);
  const close = useCallback(fallback => {
    if (location.state?.from === fallback) navigate(-1);
    else navigate(fallback, { replace: true });
  }, [navigate, location.state]);
  return { go, close, location };
}
export function useQueryNavigation() {
  const [params, setParams] = useSearchParams();
  const update = (values, replace = false) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(values)) {
      if (value === null || value === undefined || value === "" || value === false || key === "page" && value === 1) next.delete(key);
      else next.set(key, value === true ? "1" : String(value));
    }
    setParams(next, { replace });
  };
  return { params, update };
}
