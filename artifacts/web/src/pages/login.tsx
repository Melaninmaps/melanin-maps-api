import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Compass } from "lucide-react";

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-xl border-primary/10">
        <CardHeader className="text-center space-y-4 pb-8 pt-8">
          <div className="mx-auto w-16 h-16 bg-primary/10 flex items-center justify-center rounded-2xl text-primary">
            <Compass size={32} />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-serif font-bold">Welcome Back</CardTitle>
            <CardDescription className="text-base">
              Sign in to save places, RSVP to events, and join the community.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-10">
          <a href="/api/login" className="block w-full">
            <Button size="lg" className="w-full h-14 text-lg">
              Sign in with Replit
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
