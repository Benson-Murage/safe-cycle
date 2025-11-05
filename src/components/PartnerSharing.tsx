import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Heart, Share2, Trash2, Check, X, Copy, Loader2 } from "lucide-react";
import { z } from "zod";
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

const emailSchema = z.string().trim().email({ message: "Invalid email address" });

interface PartnerShare {
  id: string;
  partner_email: string;
  share_code: string;
  status: string;
  created_at: string;
  accepted_at?: string;
  expires_at: string;
}

interface PartnerSharingProps {
  userId: string;
}

const PartnerSharing = ({ userId }: PartnerSharingProps) => {
  const [partnerEmail, setPartnerEmail] = useState("");
  const [shares, setShares] = useState<PartnerShare[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareToDelete, setShareToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchShares();
  }, [userId]);

  const fetchShares = async () => {
    const { data, error } = await supabase
      .from("partner_shares")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching shares:", error);
      return;
    }

    setShares(data || []);
  };

  const createShare = async () => {
    // Validate email
    const validation = emailSchema.safeParse(partnerEmail);
    if (!validation.success) {
      toast({
        title: "Invalid Email",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Generate share code
      const { data: codeData, error: codeError } = await supabase.rpc(
        "generate_share_code"
      );

      if (codeError) throw codeError;

      // Create share
      const { error: insertError } = await supabase
        .from("partner_shares")
        .insert({
          user_id: userId,
          partner_email: partnerEmail.trim(),
          share_code: codeData,
        });

      if (insertError) {
        if (insertError.code === "23505") {
          toast({
            title: "Already Shared",
            description: "You've already sent an invitation to this email.",
            variant: "destructive",
          });
        } else {
          throw insertError;
        }
        return;
      }

      toast({
        title: "Invitation Created!",
        description: "Share the code with your partner to give them access.",
      });

      setPartnerEmail("");
      fetchShares();
    } catch (error) {
      console.error("Error creating share:", error);
      toast({
        title: "Error",
        description: "Failed to create invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyShareCode = (code: string) => {
    const shareUrl = `${window.location.origin}/partner-accept?code=${code}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied!",
      description: "Share this link with your partner.",
    });
  };

  const revokeShare = async (shareId: string) => {
    const { error } = await supabase
      .from("partner_shares")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("id", shareId);

    if (error) {
      console.error("Error revoking share:", error);
      toast({
        title: "Error",
        description: "Failed to revoke access. Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Access Revoked",
      description: "Your partner no longer has access to your data.",
    });

    fetchShares();
  };

  const handleDeleteClick = (shareId: string) => {
    setShareToDelete(shareId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!shareToDelete) return;

    const { error } = await supabase
      .from("partner_shares")
      .delete()
      .eq("id", shareToDelete);

    if (error) {
      console.error("Error deleting share:", error);
      toast({
        title: "Error",
        description: "Failed to delete invitation. Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Invitation Deleted",
      description: "The invitation has been removed.",
    });

    setDeleteDialogOpen(false);
    setShareToDelete(null);
    fetchShares();
  };

  return (
    <>
      <Card className="shadow-colorful hover:shadow-glow transition-all duration-300">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg gradient-vibrant">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Partner Sharing</CardTitle>
              <CardDescription>
                Share your cycle predictions and insights with your partner
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="partnerEmail">Partner's Email</Label>
            <div className="flex gap-2">
              <Input
                id="partnerEmail"
                type="email"
                placeholder="partner@example.com"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                disabled={loading}
                maxLength={255}
              />
              <Button
                onClick={createShare}
                disabled={loading || !partnerEmail}
                className="gradient-animated"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Invite
                  </>
                )}
              </Button>
            </div>
          </div>

          {shares.length > 0 && (
            <div className="space-y-3">
              <Label>Active Invitations</Label>
              <div className="space-y-2">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{share.partner_email}</p>
                        <Badge
                          variant={
                            share.status === "accepted"
                              ? "default"
                              : share.status === "revoked"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {share.status === "accepted" && <Check className="h-3 w-3 mr-1" />}
                          {share.status === "revoked" && <X className="h-3 w-3 mr-1" />}
                          {share.status}
                        </Badge>
                      </div>
                      {share.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            Code: {share.share_code}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyShareCode(share.share_code)}
                            className="h-6 px-2"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {share.status === "accepted" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => revokeShare(share.id)}
                        >
                          Revoke
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(share.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invitation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PartnerSharing;
