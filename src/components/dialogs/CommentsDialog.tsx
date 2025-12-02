e conimport { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User as UserIcon, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  user_id: string;
  content: string;
  is_anonymous: boolean;
  created_at: string;
  profiles?: {
    username: string;
  };
}

interface CommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  userId: string;
  postTitle: string;
}

const CommentsDialog = ({ open, onOpenChange, postId, userId, postTitle }: CommentsDialogProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && postId) {
      fetchComments();
    }
  }, [open, postId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          profiles(username)
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching comments:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load comments.",
        });
      } else {
        setComments(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      toast({
        variant: "destructive",
        title: "Empty comment",
        description: "Please write something before posting.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        user_id: userId,
        content: newComment.trim(),
        is_anonymous: isAnonymous,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to post comment. Please try again.",
        });
      } else {
        toast({
          title: "Comment posted!",
          description: "Your comment has been added.",
        });
        setNewComment("");
        setIsAnonymous(false);
        fetchComments();
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg">Comments</DialogTitle>
          <p className="text-sm text-muted-foreground truncate">{postTitle}</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
          {loading ? (
            <div className="text-center text-muted-foreground py-8">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="border-b border-border/50 pb-4 last:border-b-0">
                <div className="flex items-start gap-3">
                  <UserIcon className="h-8 w-8 text-muted-foreground mt-1" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {comment.is_anonymous ? "Anonymous" : comment.profiles?.username || "User"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-border/50 pt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="comment">Add a comment</Label>
            <Textarea
              id="comment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="anonymous-comment"
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
              <Label htmlFor="anonymous-comment" className="text-sm">
                Comment anonymously
              </Label>
            </div>

            <Button
              onClick={handleSubmitComment}
              disabled={submitting || !newComment.trim()}
              size="sm"
            >
              {submitting ? (
                "Posting..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Post Comment
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentsDialog;