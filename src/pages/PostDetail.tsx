import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import CommentSection from "@/components/CommentSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Heart, User as UserIcon, Loader2, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  is_anonymous: boolean;
  created_at: string;
  profiles?: {
    username: string;
  };
}

const PostDetail = () => {
  const { postId } = useParams<{ postId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (!session) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user && postId) {
      fetchPost();
      fetchLikeStatus();
    }
  }, [user, postId]);

  const fetchPost = async () => {
    if (!postId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        profiles(username)
      `)
      .eq("id", postId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching post:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load post.",
      });
    } else if (!data) {
      toast({
        variant: "destructive",
        title: "Not found",
        description: "This post doesn't exist.",
      });
      navigate("/community");
    } else {
      setPost(data);
    }
    setLoading(false);
  };

  const fetchLikeStatus = async () => {
    if (!postId || !user) return;

    // Check if user liked this post
    const { data: likeData } = await supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle();

    setLiked(!!likeData);

    // Get total like count
    const { count } = await supabase
      .from("post_likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    setLikeCount(count || 0);
  };

  const handleLike = async () => {
    if (!user || !postId) return;

    if (liked) {
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);
      
      setLiked(false);
      setLikeCount((prev) => Math.max(0, prev - 1));
    } else {
      await supabase.from("post_likes").insert({
        post_id: postId,
        user_id: user.id,
      });
      
      setLiked(true);
      setLikeCount((prev) => prev + 1);
    }
  };

  const handleDelete = async () => {
    if (!postId || !user) return;

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId)
      .eq("user_id", user.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete post.",
      });
    } else {
      toast({
        title: "Post deleted",
        description: "Your post has been removed.",
      });
      navigate("/community");
    }
    setDeleteDialogOpen(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-soft pb-20">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate("/community")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Community
        </Button>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : post ? (
          <div className="space-y-6">
            <Card className="bg-gradient-card shadow-soft border-border/50">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {post.is_anonymous ? "Anonymous" : post.profiles?.username || "User"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        • {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <CardTitle className="text-2xl mb-3">{post.title}</CardTitle>
                    <Badge variant="outline">{post.category}</Badge>
                  </div>
                  {post.user_id === user.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap mb-6 leading-relaxed">
                  {post.content}
                </p>
                <div className="flex items-center gap-4 pt-4 border-t border-border/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLike}
                    className={liked ? "text-primary" : ""}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${liked ? "fill-current" : ""}`} />
                    {likeCount} {likeCount === 1 ? "Like" : "Likes"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <CommentSection postId={post.id} userId={user.id} />
          </div>
        ) : null}
      </div>

      <Footer />
      <Navigation />

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your post and all its comments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PostDetail;
