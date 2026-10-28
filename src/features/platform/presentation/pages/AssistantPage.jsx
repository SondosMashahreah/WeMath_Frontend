import { hiveItem } from "../../domain/navigation.js";
import { usePageNavigation } from "../../../../shared/routing/usePageNavigation.js";
import HivePage from "../HivePage.jsx";
import AssistantChat from "../AssistantChat.jsx";
export default function AssistantPage({ mode = null }) {
  const { go, close } = usePageNavigation();
  return <HivePage title="Algo" items={[hiveItem("calculate", "احسب معي"), hiveItem("search", "ابحث عن درس")]} onSelect={id => go(`/assistant/${id}`)} onBack={() => go("/")}>
    {mode && <AssistantChat key={mode} mode={mode} onClose={() => close("/assistant")} />}
  </HivePage>;
}
