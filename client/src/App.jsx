import { BrowserRouter, Routes, Route } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import ProtectedLayout from "./layouts/ProtectedLayout";
import ImpactCenter from "./pages/ImpactCenter";
import OperationsDashboard from "./pages/OperationsDashboard";
import AdminQueue from "./pages/AdminQueue";
import ReportIssue from "./pages/ReportIssue";
import ComplaintDetail from "./pages/ComplaintDetail";
import WorkerTasks from "./pages/WorkerTasks";
import Login from "./pages/Login";

import ErrorBoundary from "./components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<ImpactCenter />} />
            <Route path="/report" element={<ReportIssue />} />
          </Route>
          
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<OperationsDashboard />} />
            <Route path="/queue" element={<AdminQueue />} />
            <Route path="/worker" element={<WorkerTasks />} />
            <Route path="/complaint/:id" element={<ComplaintDetail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
