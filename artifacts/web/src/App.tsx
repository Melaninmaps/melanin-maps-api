import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";

import Home from "@/pages/home";
import Discover from "@/pages/discover";
import MapPage from "@/pages/map";
import BusinessDetail from "@/pages/business-detail";
import Safety from "@/pages/safety";
import Events from "@/pages/events";
import Community from "@/pages/community";
import Travel from "@/pages/travel";
import Profile from "@/pages/profile";
import Login from "@/pages/login";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/discover">
        <Layout><Discover /></Layout>
      </Route>
      <Route path="/map">
        <Layout><MapPage /></Layout>
      </Route>
      <Route path="/businesses/:id">
        <Layout><BusinessDetail /></Layout>
      </Route>
      <Route path="/safety">
        <Layout><Safety /></Layout>
      </Route>
      <Route path="/events">
        <Layout><Events /></Layout>
      </Route>
      <Route path="/community">
        <Layout><Community /></Layout>
      </Route>
      <Route path="/travel">
        <Layout><Travel /></Layout>
      </Route>
      <Route path="/profile">
        <Layout><Profile /></Layout>
      </Route>
      <Route path="/login" component={Login} /> 
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
