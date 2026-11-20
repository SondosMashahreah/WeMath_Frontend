import { useEffect, useState } from 'react';
import { cmsRequest } from './api.js';
export function useCmsData(path, revision = 0) {
  const [state, setState] = useState({ data: null, error: '', loading: true });
  useEffect(() => {
    const controller = new AbortController();
    cmsRequest(path, { signal: controller.signal }).then(data => { if (!controller.signal.aborted) setState({ data, error: '', loading: false, path, revision }); })
      .catch(error => { if (!controller.signal.aborted) setState({ data: null, error: error.message, loading: false, path, revision }); });
    return () => controller.abort();
  }, [path, revision]);
  return state.path === path && state.revision === revision ? state : { data: null, error: '', loading: true };
}
