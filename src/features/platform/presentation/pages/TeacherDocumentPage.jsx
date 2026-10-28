import { useParams } from "react-router-dom";
import { usePlatformData } from "../../application/usePlatformData.js";
import { documentPath } from "../../../../shared/routing/paths.js";
import { usePageNavigation } from "../../../../shared/routing/usePageNavigation.js";
import RouteFeedback from "../../../../shared/presentation/RouteFeedback.jsx";
import LoadDialog from "../LoadDialog.jsx";
import DocumentPreview from "../DocumentPreview.jsx";
export default function TeacherDocumentPage({ kind }) {
  const { documentId } = useParams(), { go, close, location } = usePageNavigation();
  const state = usePlatformData(`/api/platform/teachers/documents/${encodeURIComponent(documentId)}`, true), base = documentPath(kind) + location.search;
  if (!state.data) return <LoadDialog state={state} onClose={() => close(base)} />;
  if (state.data.kind !== kind) return <RouteFeedback back={documentPath(kind)} />;
  return <DocumentPreview key={documentId} document={state.data} onClose={() => close(base)} onEdit={() => go(documentPath(kind, documentId, true) + location.search)} onArchived={() => go(documentPath(kind) + (state.data.archived ? "" : "?archived=1"), { replace: true })} />;
}
