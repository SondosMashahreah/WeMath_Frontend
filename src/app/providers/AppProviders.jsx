import MemoryProvider from "../../shared/state/MemoryProvider.jsx";
import AccountProvider from "../../features/account/application/AccountProvider.jsx";
import TeacherProvider from "../../features/platform/application/TeacherProvider.jsx";
import CurriculumProvider from "../../features/student/application/CurriculumProvider.jsx";
export default function AppProviders({ children }) {
  return <MemoryProvider><AccountProvider><TeacherProvider><CurriculumProvider>{children}</CurriculumProvider></TeacherProvider></AccountProvider></MemoryProvider>;
}
