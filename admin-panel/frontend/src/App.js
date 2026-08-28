import "@/App.css";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import Workspace from "@/pages/Workspace";
import LoginPage from "@/pages/LoginPage";
import UsersPage from "@/pages/UsersPage";
import CustomerAccountPage from "@/pages/CustomerAccountPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import WebsiteRequestsPage from "@/pages/WebsiteRequestsPage";

function ProtectedRoute({ children, adminOnly = false, staffOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoaderCircle className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/" replace />;
  if (staffOnly && user.role !== "admin") return <Navigate to="/account" replace />;
  return children;
}

function CustomerRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><LoaderCircle className="h-7 w-7 animate-spin text-muted-foreground" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/" replace />;
  if (user.role !== "customer") return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <div className="App">
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<ProtectedRoute staffOnly><Workspace /></ProtectedRoute>} />
                <Route path="/users" element={<ProtectedRoute adminOnly><UsersPage /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute adminOnly><AnalyticsPage /></ProtectedRoute>} />
                <Route path="/requests" element={<ProtectedRoute adminOnly><WebsiteRequestsPage /></ProtectedRoute>} />
                <Route path="/account" element={<CustomerRoute><CustomerAccountPage /></CustomerRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
          <Toaster position="top-right" richColors closeButton />
        </div>
      </I18nProvider>
    </ThemeProvider>
  );
}

export default App;
