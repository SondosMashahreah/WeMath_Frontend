import { useRouteError } from "react-router-dom";
import RouteFeedback from "../../shared/presentation/RouteFeedback.jsx";
export default function RouteErrorPage() {
  const error = useRouteError();
  console.error("WE MATH route failed", error);
  return <RouteFeedback title="تعذّر فتح الصفحة" message="ارجع للرئيسية ثم حاول مرة أخرى." />;
}
