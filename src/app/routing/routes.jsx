import AppLayout from "../layouts/AppLayout.jsx";
import RequireAccount from "./RequireAccount.jsx";
import RouteErrorPage from "./RouteErrorPage.jsx";
import RouteFeedback from "../../shared/presentation/RouteFeedback.jsx";
import AccessPage from "../../features/account/presentation/pages/AccessPage.jsx";
import CompleteProfilePage from "../../features/account/presentation/pages/CompleteProfilePage.jsx";
import StudentPage from "../../features/student/presentation/pages/StudentPage.jsx";
import ParentLayout from "../../features/parent/presentation/ParentLayout.jsx";
import ParentPage from "../../features/parent/presentation/pages/ParentPage.jsx";
import ChildCurriculumPage from "../../features/parent/presentation/pages/ChildCurriculumPage.jsx";
import TeacherAccessPage from "../../features/platform/presentation/pages/TeacherAccessPage.jsx";
import TeacherHomePage from "../../features/platform/presentation/pages/TeacherHomePage.jsx";
import TeacherCurriculumPage from "../../features/platform/presentation/pages/TeacherCurriculumPage.jsx";
import TeacherDocumentsPage from "../../features/platform/presentation/pages/TeacherDocumentsPage.jsx";
import TeacherDocumentPage from "../../features/platform/presentation/pages/TeacherDocumentPage.jsx";
import TeacherDocumentEditorPage from "../../features/platform/presentation/pages/TeacherDocumentEditorPage.jsx";
import ContentPage from "../../features/platform/presentation/pages/ContentPage.jsx";
import AssistantPage from "../../features/platform/presentation/pages/AssistantPage.jsx";

// Pages come from the URL; forms own transient UI state. The layout stays mounted.
const journeyRoutes = element => [
  { index: true, element },
  ...["books/:bookId", "books/:bookId/units/:unitId", "books/:bookId/units/:unitId/lessons/:lessonId", "books/:bookId/units/:unitId/lessons/:lessonId/activities/:activity"].map(path => ({ path, element })),
];
const contentRoutes = (section, base = `/${section}`, home = "/") => [
  { index: true, element: <ContentPage section={section} base={base} home={home} /> },
  ...[":category", ":category/:entryId"].map(path => ({ path, element: <ContentPage section={section} base={base} home={home} /> })),
];
const documentRoutes = kind => [
  { index: true, element: <TeacherDocumentsPage kind={kind} /> },
  { path: "new", element: <TeacherDocumentEditorPage kind={kind} /> },
  { path: ":documentId", element: <TeacherDocumentPage kind={kind} /> },
  { path: ":documentId/edit", element: <TeacherDocumentEditorPage kind={kind} /> },
];
export const routes = [{
  path: "/", element: <AppLayout />, errorElement: <RouteErrorPage />,
  children: [
    { index: true, element: null },
    { path: "student", children: [
      { path: "login", element: <AccessPage role="student" mode="login" /> },
      { path: "register", element: <AccessPage role="student" mode="register" /> },
      { element: <RequireAccount role="student" />, children: [
        { path: "profile", element: <CompleteProfilePage /> },
        { path: "account", element: <StudentPage account /> },
        ...journeyRoutes(<StudentPage />),
      ] },
    ] },
    { path: "parent", children: [
      { path: "access", element: <AccessPage role="parent" mode="choice" /> },
      { path: "login", element: <AccessPage role="parent" mode="login" /> },
      { path: "register", element: <AccessPage role="parent" mode="register" /> },
      { element: <RequireAccount role="parent" />, children: [{ element: <ParentLayout />, children: [
        { index: true, element: <ParentPage /> },
        { path: "account", element: <ParentPage key="account" page="account" /> },
        ...["add", "create", "link"].map(page => ({ path: `children/${page}`, element: <ParentPage key={page} page={page} /> })),
        { path: "children/:childId", element: <ParentPage /> },
        ...["edit", "password", "progress", "results"].map(page => ({ path: `children/:childId/${page}`, element: <ParentPage key={page} page={page} /> })),
        { path: "children/:childId/curriculum", children: journeyRoutes(<ChildCurriculumPage />) },
      ] }] },
    ] },
    { path: "teachers", children: [
      { path: "login", element: <TeacherAccessPage key="login" mode="login" /> },
      { path: "register", element: <TeacherAccessPage key="register" mode="register" /> },
      { element: <RequireAccount role="teacher" />, children: [
        { index: true, element: <TeacherHomePage /> },
        { path: "account", element: <TeacherHomePage account /> },
        { path: "curriculum", children: [
          { index: true, element: <TeacherCurriculumPage /> },
          ...["grades/:grade", "grades/:grade/books/:bookId", "grades/:grade/books/:bookId/units/:unitId", "grades/:grade/books/:bookId/units/:unitId/lessons/:lessonId"].map(path => ({ path, element: <TeacherCurriculumPage /> })),
        ] },
        { path: "plans", children: documentRoutes("plan") },
        { path: "assessments", children: documentRoutes("assessment") },
        { path: "resources", children: contentRoutes("teacher_resources", "/teachers/resources", "/teachers") },
        { path: "workshops", children: contentRoutes("workshops", "/teachers/workshops", "/teachers") },
      ] },
    ] },
    ...["workshops", "competitions", "initiatives"].map(section => ({ path: section, children: contentRoutes(section) })),
    { path: "assistant", children: [{ index: true, element: <AssistantPage /> }, ...["calculate", "search"].map(mode => ({ path: mode, element: <AssistantPage mode={mode} /> }))] },
    { path: "*", element: <RouteFeedback /> },
  ],
}];
