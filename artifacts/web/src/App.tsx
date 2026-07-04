import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/theme";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { useEffect } from "react";

import Home from "@/pages/home";
import About from "@/pages/about";
import Features from "@/pages/features";
import Contact from "@/pages/contact";
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
import Cities from "@/pages/cities";
import CitySpotlight from "@/pages/city-spotlight";
import Jobs from "@/pages/jobs";
import Billing from "@/pages/billing";
import VerifyBusiness from "@/pages/verify-business";
import Welcome from "@/pages/welcome";
import BusinessDashboard from "@/pages/business-dashboard";
import Notifications from "@/pages/notifications";
import Affiliate from "@/pages/affiliate";
import Mentorship from "@/pages/mentorship";
import RateNeighborhood from "@/pages/rate-neighborhood";
import ReferralRedirect from "@/pages/referral-redirect";
import Resources from "@/pages/resources";
import SharedTrip from "@/pages/shared-trip";
import DeleteAccount from "@/pages/delete-account";
import BusinessResponse from "@/pages/business-response";
import GlobalRecommendations from "@/pages/global-recommendations";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: auth, isLoading } = useGetCurrentAuthUser();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-[#CA922B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!auth?.user) return <Redirect to="/login" />;
  return <>{children}</>;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function OgRedirectHandler() {
  const [, navigate] = useLocation();
  useEffect(() => {
    try {
      const businessId = sessionStorage.getItem("_og_business_id");
      if (businessId) {
        sessionStorage.removeItem("_og_business_id");
        navigate(`/businesses/${encodeURIComponent(businessId)}`, { replace: true });
      }
    } catch {
    }
  }, []);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Layout><Home /></Layout>
      </Route>
      <Route path="/about">
        <Layout><About /></Layout>
      </Route>
      <Route path="/features">
        <Layout><Features /></Layout>
      </Route>
      <Route path="/contact">
        <Layout><Contact /></Layout>
      </Route>
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
      <Route path="/business/:id">
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
      <Route path="/privacy">
        <Layout><PrivacyPolicy /></Layout>
      </Route>
      <Route path="/delete-account">
        <Layout><DeleteAccount /></Layout>
      </Route>
      <Route path="/terms">
        <Layout><Terms /></Layout>
      </Route>
      <Route path="/community-guidelines">
        <Layout><CommunityGuidelines /></Layout>
      </Route>
      <Route path="/cities">
        <Layout><Cities /></Layout>
      </Route>
      <Route path="/cities/:city">
        <Layout><CitySpotlight /></Layout>
      </Route>
      <Route path="/jobs">
        <Layout><Jobs /></Layout>
      </Route>
      <Route path="/billing">
        <Layout><ProtectedRoute><Billing /></ProtectedRoute></Layout>
      </Route>
      <Route path="/verify-business">
        <Layout><VerifyBusiness /></Layout>
      </Route>
      <Route path="/welcome" component={Welcome} />
      <Route path="/business-dashboard">
        <Layout><ProtectedRoute><BusinessDashboard /></ProtectedRoute></Layout>
      </Route>
      <Route path="/global-recommendations">
        <Layout><GlobalRecommendations /></Layout>
      </Route>
      <Route path="/notifications">
        <Layout><ProtectedRoute><Notifications /></ProtectedRoute></Layout>
      </Route>
      <Route path="/affiliate">
        <Layout><Affiliate /></Layout>
      </Route>
      <Route path="/mentorship">
        <Layout><Mentorship /></Layout>
      </Route>
      <Route path="/rate-neighborhood">
        <Layout><RateNeighborhood /></Layout>
      </Route>
      <Route path="/r/:code" component={ReferralRedirect} />
      <Route path="/business-response/:token" component={BusinessResponse} />
      <Route path="/resources">
        <Layout><Resources /></Layout>
      </Route>
      <Route path="/shared/trip/:shareId" component={SharedTrip} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <OgRedirectHandler />
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
