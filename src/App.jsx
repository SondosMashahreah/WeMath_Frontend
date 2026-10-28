import { RouterProvider } from "react-router-dom";
import AppProviders from "./app/providers/AppProviders.jsx";
export default function App({ router }) { return <AppProviders><RouterProvider router={router} /></AppProviders>; }
