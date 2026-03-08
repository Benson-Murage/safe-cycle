import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, User as UserIcon, Trash2, MessageSquare, Pencil, Check, X } from "lucide-react";
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

interface CommentSectionProps {
  postId: string;
  userId: string;
}

const CommentSection = ({ postId, userId }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    setLoading(true);
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
    } else {
      setComments(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) {
      toast({
        variant: "destructive",
        title: "Empty comment",
        description: "Please write something before submitting.",
      });
      return;
    }

    setSubmitting(true);
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
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!commentToDelete) return;

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentToDelete)
      .eq("user_id", userId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete comment.",
      });
    } else {
      toast({
        title: "Comment deleted",
        description: "Your comment has been removed.",
      });
      fetchComments();
    }
    setDeleteDialogOpen(false);
    setCommentToDelete(null);
  };

  const confirmDelete = (commentId: string) => {
    setCommentToDelete(commentId);
    setDeleteDialogOpen(true);
  };

  const startEditing = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent("");
  };

  const saveEdit = async () => {
    if (!editingId || !editContent.trim()) return;

    const { error } = await supabase
      .from("comments")
      .update({ content: editContent.trim() })
      .eq("id", editingId)
      .eq("user_id", userId);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update comment." });
    } else {
      toast({ title: "Comment updated" });
      fetchComments();
    }
    cancelEditing();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        Comments ({comments.length})
      </h3>

      {/* Comment input */}
      <Card className="bg-gradient-card border-border/50">
        <CardContent className="pt-4 space-y-4">
          <Textarea
            placeholder="Share your thoughts..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="anonymous-comment"
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
              <Label htmlFor="anonymous-comment" className="text-sm text-muted-foreground">
                Post anonymously
              </Label>
            </div>
            <Button onClick={handleSubmit} disabled={submitting || !newComment.trim()}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Post Comment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comments list */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="py-8 text-center">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">No comments yet</p>
            <p className="text-sm text-muted-foreground/70">Be the first to share your thoughts!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <Card key={comment.id} className="bg-gradient-card border-border/50">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {comment.is_anonymous ? "Anonymous" : comment.profiles?.username || "User"}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        • {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-foreground whitespace-pre-wrap break-words">
                      {editingId === comment.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={2}
                            className="resize-none"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={saveEdit} disabled={!editContent.trim()}>
                              <Check className="h-3 w-3 mr-1" /> Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelEditing}>
                              <X className="h-3 w-3 mr-1" /> Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        comment.content
                      )}
                    </p>
                  </div>
                  {comment.user_id === userId && editingId !== comment.id && (
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-primary h-8 w-8"
                        onClick={() => startEditing(comment)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive h-8 w-8"
                        onClick={() => confirmDelete(comment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Your comment will be permanently removed.
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

export default CommentSection;
