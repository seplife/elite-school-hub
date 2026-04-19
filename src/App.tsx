import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import NotFound from "./pages/NotFound.tsx";
import { AppLayout } from "./components/AppLayout";
import Dashboard from "./pages/app/Dashboard";
import Eleves from "./pages/app/Eleves";
import NouvelEleve from "./pages/app/NouvelEleve";
import Classes from "./pages/app/Classes";
import Inscriptions from "./pages/app/Inscriptions";
import Utilisateurs from "./pages/app/Utilisateurs";
import Annonces from "./pages/app/Annonces";
import Albums from "./pages/app/Albums";
import AlbumDetail from "./pages/app/AlbumDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="eleves" element={<Eleves />} />
            <Route path="eleves/nouveau" element={<NouvelEleve />} />
            <Route path="classes" element={<Classes />} />
            <Route path="inscriptions" element={<Inscriptions />} />
            <Route path="annonces" element={<Annonces />} />
            <Route path="albums" element={<Albums />} />
            <Route path="albums/:id" element={<AlbumDetail />} />
            <Route path="utilisateurs" element={<Utilisateurs />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
