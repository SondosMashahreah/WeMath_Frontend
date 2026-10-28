import { useParams } from "react-router-dom";
import { CATEGORIES, PAGE_SIZE } from "../domain/navigation.js";
import { query } from "../infrastructure/client.js";
import { usePlatformData } from "./usePlatformData.js";
import { readListQuery } from "../../../shared/routing/paths.js";
import { usePageNavigation, useQueryNavigation } from "../../../shared/routing/usePageNavigation.js";
export function useContentRoute(section) {
  const { category, entryId } = useParams(), { location } = usePageNavigation(), { update } = useQueryNavigation();
  const filters = readListQuery(location.search), privateArea = section === "teacher_resources";
  const valid = !category || Object.hasOwn(CATEGORIES[section], category), offset = (filters.page - 1) * PAGE_SIZE;
  const listPath = privateArea ? "/api/platform/teachers/library" : "/api/platform/entries";
  const list = usePlatformData(category && valid ? `${listPath}?${query({ section, category, q: filters.q, archived: filters.archived, offset, limit: PAGE_SIZE, month: section === "competitions" ? filters.month : undefined })}` : null, privateArea);
  const detail = usePlatformData(entryId && valid ? `${listPath}/${encodeURIComponent(entryId)}` : null, privateArea);
  return { category, entryId, filters, offset, valid, list, detail, privateArea, update };
}
