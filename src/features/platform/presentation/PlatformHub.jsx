import AssistantPortal from "./AssistantPortal.jsx";
import ContentPortal from "./ContentPortal.jsx";
import GuestPortal from "./GuestPortal.jsx";
import TeacherPortal from "./TeacherPortal.jsx";

export default function PlatformHub({ section, onHome }) {
  if (section === "teachers") return <TeacherPortal onBack={onHome} />;
  if (section === "guest") return <GuestPortal onBack={onHome} />;
  if (section === "assistant") return <AssistantPortal onBack={onHome} />;
  return <ContentPortal section={section} onBack={onHome} />;
}
