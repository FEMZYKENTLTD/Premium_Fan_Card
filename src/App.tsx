import { AppProvider, useApp } from "./context/AppContext";
import { AuthProvider } from "@/auth/AuthProvider";
import Navbar from "./components/Navbar";
import LandingDiscovery from "./components/LandingDiscovery";
import CustomerDashboard from "./components/CustomerDashboard";
import AdminPortal from "./components/AdminPortal";
import { Toaster } from "sonner";
import { Crown } from "lucide-react";

function LoadingScreen() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center app-gradient">
      <div className="text-center">
        <Crown className="mx-auto mb-3 h-10 w-10 animate-pulse text-[#D4AF37]" />
        <p className="text-sm text-zinc-500">Loading Keanu Reeves VIP...</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { state, authLoading } = useApp();
  if (authLoading) return <LoadingScreen />;
  return (
    <div className="min-h-[100dvh] app-gradient text-white">
      <Toaster position="top-right" richColors theme="dark" />
      <Navbar />
      {state.view === "landing" && <LandingDiscovery />}
      {state.view === "dashboard" && <CustomerDashboard />}
      {state.view === "admin" && <AdminPortal />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;