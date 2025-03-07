import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Team from "./pages/Team";
import Projects from "./pages/Projects";
import GanttView from "./pages/GanttView";
import DiagramExamples from "./pages/DiagramExamples";
import { usePlanStore } from "./store/planStore";

function ProtectedRoute({ children }) {
  const { currentPlanId, initialized } = usePlanStore();
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (initialized) {
      setIsLoading(false);
    }
  }, [initialized]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!currentPlanId) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route
          path="team"
          element={
            <ProtectedRoute>
              <Team />
            </ProtectedRoute>
          }
        />
        <Route
          path="projects"
          element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          }
        />
        <Route
          path="projects/:shortId"
          element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          }
        />
        <Route
          path="schedule"
          element={
            <ProtectedRoute>
              <GanttView />
            </ProtectedRoute>
          }
        />
        <Route
          path="schedule/p/:shortId"
          element={
            <ProtectedRoute>
              <GanttView />
            </ProtectedRoute>
          }
        />
        <Route
          path="diagrams"
          element={<DiagramExamples />}
        />
      </Route>
    </Routes>
  );
}

export default App;
