import { useState } from "react";
import { useListCommunityPosts, useCreateCommunityPost, useGetCurrentAuthUser } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Heart, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Community() {
  const { data: auth } = useGetCurrentAuthUser();
  const { data: posts, isLoading } = useListCommunityPosts();
  const createPost = useCreateCommunityPost();
  
  const [content, setContent] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    createPost.mutate({ data: { content } }, {
      onSuccess: () => {
        setContent("");
        queryClient.invalidateQueries({ queryKey: ["listCommunityPosts"] });
        toast({ title: "Posted successfully" });
      }
    });
  };

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-serif font-bold tracking-tight">Community Feed</h1>
        <p className="text-muted-foreground text-lg">Share updates, ask for recommendations, and connect.</p>
      </div>

      {auth?.user ? (
        <Card className="shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handlePostSubmit} className="space-y-4">
              <div className="flex gap-4">
                <Avatar className="w-10 h-10 border border-border shrink-0">
                  <AvatarImage src={auth.user.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {auth.user.firstName?.[0] || auth.user.email?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <Textarea 
                    placeholder="What's happening in your community?" 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[100px] text-base border-muted bg-muted/20 focus-visible:ring-primary/20"
                  />
                  <div className="flex justify-end">
                    <Button type="submit" disabled={!content.trim() || createPost.isPending} className="px-6 rounded-full">
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-6 text-center text-muted-foreground">
            Sign in to join the conversation and post to the community.
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6 space-y-4"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))
        ) : posts?.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            No posts yet. Be the first to start the conversation!
          </div>
        ) : (
          posts?.map((post) => (
            <Card key={post.id} className="shadow-sm overflow-hidden">
              <CardHeader className="p-5 pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border border-border">
                    <AvatarFallback className="bg-secondary text-secondary-foreground font-medium">
                      {post.authorName?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-[15px]">{post.authorName || "Anonymous User"}</div>
                    <div className="text-xs text-muted-foreground">
                      {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Recently'}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-4">
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{post.content}</p>
                {post.imageUrl && (
                  <div className="rounded-xl overflow-hidden mt-3 border border-border/50">
                    <img src={post.imageUrl} alt="Post attachment" className="w-full max-h-96 object-cover" />
                  </div>
                )}
                <div className="flex items-center gap-6 pt-2 text-muted-foreground">
                  <button className="flex items-center gap-1.5 text-sm font-medium hover:text-destructive transition-colors group">
                    <Heart size={18} className="group-hover:fill-destructive/20" /> 
                    <span>{post.likesCount || 0}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors">
                    <MessageSquare size={18} /> 
                    <span>{post.commentsCount || 0}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-sm font-medium hover:text-foreground transition-colors ml-auto">
                    <Share2 size={18} />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
