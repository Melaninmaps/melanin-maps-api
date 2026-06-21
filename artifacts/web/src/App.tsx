import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";

import Home from "@/pages/home";
import Explore from "@/pages/explore";
import BusinessDetail from "@/pages/business-detail";
import Safety from "@/pages/safety";
import Community from "@/pages/community";
import Businesses from "@/pages/businesses";
import ForBusinessOwners from "@/pages/for-business-owners";
import Roadmap from "@/pages/roadmap";
import Membership from "@/pages/membership";
import Login from "@/pages/login";
import Profile from "@/pages/profile";

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
      <Route path="/explore">
        <Layout><Explore /></Layout>
      </Route>
      <Route path="/businesses">
        <Layout><Businesses /></Layout>
      </Route>
      <Route path="/businesses/:id">
        <Layout><BusinessDetail /></Layout>
      </Route>
      <Route path="/safety">
        <Layout><Safety /></Layout>
      </Route>
      <Route path="/community">
        <Layout><Community /></Layout>
      </Route>
      <Route path="/for-business-owners">
        <Layout><ForBusinessOwners /></Layout>
      </Route>
      <Route path="/roadmap">
        <Layout><Roadmap /></Layout>
      </Route>
      <Route path="/membership">
        <Layout><Membership /></Layout>
      </Route>
      <Route path="/login" component={Login} />
      <Route path="/profile">
        <Layout><Profile /></Layout>
      </Route>
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
