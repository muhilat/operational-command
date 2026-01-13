import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BriefingProvider } from "@/context/BriefingContext";
import Dashboard from "./pages/Dashboard";
import FacilityDrillDown from "./pages/FacilityDrillDown";
import ComplianceVault from "./pages/ComplianceVault";
import LiabilityDefense from "./pages/LiabilityDefense";
import RevenueOpportunities from "./pages/RevenueOpportunities";
import RevenueIntegrity from "./pages/RevenueIntegrity";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BriefingProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
              <Route path="/facility/:facilityId" element={<ErrorBoundary><FacilityDrillDown /></ErrorBoundary>} />
              {/* Liability Defense routes (backward compatible) */}
              <Route path="/compliance" element={<ErrorBoundary><LiabilityDefense /></ErrorBoundary>} />
              <Route path="/liability-defense" element={<ErrorBoundary><LiabilityDefense /></ErrorBoundary>} />
              {/* Revenue Integrity routes (backward compatible) */}
              <Route path="/revenue" element={<ErrorBoundary><RevenueIntegrity /></ErrorBoundary>} />
              <Route path="/revenue-integrity" element={<ErrorBoundary><RevenueIntegrity /></ErrorBoundary>} />
              <Route path="/settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<ErrorBoundary><NotFound /></ErrorBoundary>} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </BriefingProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
