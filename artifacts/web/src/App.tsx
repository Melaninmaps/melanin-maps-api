import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";

import Home from "@/pages/home";
import Explore from "@/pages/explore";
import Discover from "@/pages/discover";
import BusinessDetail from "@/pages/business-detail";
import Safety from "@/pages/safety";
import Community from "@/pages/community";
import Businesses from "@/pages/businesses";
import ForBusinessOwners from "@/pages/for-business-owners";
import Roadmap from "@/pages/roadmap";
import Membership from "@/pages/membership";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Profile from "@/pages/profile";
import Admin from "@/pages/admin";
import PendingApproval from "@/pages/pending-approval";
import Travel from "@/pages/travel";
import MapPage from "@/pages/map";
import Events from "@/pages/events";
import PrivacyPolicy from "@/pages/privacy-policy";
import Terms from "@/pages/terms";
import CommunityGuidelines from "@/pages/community-guidelines";

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
      <Route path="/discover">
        <Layout><Discover /></Layout>
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
      <Route path="/events">
        <Layout><Events /></Layout>
      </Route>
      <Route path="/travel">
        <Layout><Travel /></Layout>
      </Route>
      <Route path="/map">
        <Layout><MapPage /></Layout>
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
      <Route path="/signup" component={Signup} />
      <Route path="/pending-approval" component={PendingApproval} />
      <Route path="/admin" component={Admin} />
      <Route path="/profile">
        <Layout><Profile /></Layout>
      </Route>
      <Route path="/privacy-policy">
        <Layout><PrivacyPolicy /></Layout>
      </Route>
      <Route path="/terms">
        <Layout><Terms /></Layout>
      </Route>
      <Route path="/community-guidelines">
        <Layout><CommunityGuidelines /></Layout>
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
