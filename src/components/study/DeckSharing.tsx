import { useState } from "react";
import { useDeckInvitations, useDeckAccessManagement } from "@/hooks/useDeckinvitations";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Share2, Check, X, Trash2, Users, Mail } from "lucide-react";
import { type AccessLevel } from "@/lib/deck-sharing";

interface DeckInviteDialogProps {
  deckId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeckInviteDialog({ deckId, open, onOpenChange }: DeckInviteDialogProps) {
  const { send } = useDeckInvitations();
  const [email, setEmail] = useState("");
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("view");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) return;

    setLoading(true);
    const success = await send(deckId, email, accessLevel);
    if (success) {
      setEmail("");
      setAccessLevel("view");
      onOpenChange(false);
    }
    setLoading(false);
  };

  return (
    <div className={`space-y-4 ${open ? "block" : "hidden"}`}>
      <div className="space-y-2">
        <label className="text-sm font-medium">Email Address</label>
        <Input
          type="email"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Access Level</label>
        <Select value={accessLevel} onValueChange={(value) => setAccessLevel(value as AccessLevel)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="view">View Only</SelectItem>
            <SelectItem value="edit">Can Edit</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {accessLevel === "view" && "Can view and study from the deck"}
          {accessLevel === "edit" && "Can edit cards and settings"}
          {accessLevel === "admin" && "Full access and can manage sharing"}
        </p>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSend} disabled={!email.trim() || loading}>
          {loading ? "Sending..." : "Send Invite"}
        </Button>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function PendingInvitations() {
  const { pendingInvitations, loading, accept, decline } = useDeckInvitations();

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading invitations...</div>;
  }

  if (pendingInvitations.length === 0) {
    return <div className="text-sm text-muted-foreground">No pending invitations</div>;
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Mail className="h-4 w-4" />
        Pending Invitations ({pendingInvitations.length})
      </h3>

      <div className="space-y-3">
        {pendingInvitations.map((invitation) => (
          <div
            key={invitation.id}
            className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
          >
            <div className="flex-1">
              <p className="font-medium text-sm">Deck Invitation</p>
              <p className="text-xs text-muted-foreground mt-1">
                Access Level: {invitation.access_level}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => accept(invitation.id)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-1" />
                Accept
              </Button>
              <Button size="sm" variant="outline" onClick={() => decline(invitation.id)}>
                <X className="h-4 w-4 mr-1" />
                Decline
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

interface SharedDeckAccessProps {
  deckId: string;
}

export function SharedDeckAccessManager({ deckId }: SharedDeckAccessProps) {
  const { accessUsers, loading, updateAccess, revoke } = useDeckAccessManagement(deckId);
  const [revokeConfirm, setRevokeConfirm] = useState<string | null>(null);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading shared access...</div>;
  }

  if (accessUsers.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No one has access to this deck yet. Invite them to share!
      </div>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Users className="h-4 w-4" />
        Shared With ({accessUsers.length})
      </h3>

      <div className="space-y-2">
        {accessUsers.map((access) => (
          <div key={access.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium">User Access</p>
              <Badge variant="secondary" className="mt-1">
                {access.access_level}
              </Badge>
            </div>

            <div className="flex gap-2">
              <Select
                value={access.access_level}
                onValueChange={(value) => updateAccess(access.user_id, value as AccessLevel)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View Only</SelectItem>
                  <SelectItem value="edit">Can Edit</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>

              <AlertDialog open={revokeConfirm === access.id}>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setRevokeConfirm(access.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                <AlertDialogContent>
                  <AlertDialogTitle>Revoke Access</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove this user's access to the deck? They will no
                    longer be able to view or edit it.
                  </AlertDialogDescription>

                  <div className="flex gap-2 justify-end">
                    <AlertDialogCancel onClick={() => setRevokeConfirm(null)}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        revoke(access.user_id);
                        setRevokeConfirm(null);
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Revoke
                    </AlertDialogAction>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

interface DeckShareButtonProps {
  deckId: string;
  deckTitle: string;
}

export function DeckShareButton({ deckId, deckTitle }: DeckShareButtonProps) {
  const [showInvite, setShowInvite] = useState(false);

  return (
    <div className="space-y-4">
      <Button onClick={() => setShowInvite(!showInvite)} className="w-full">
        <Share2 className="h-4 w-4 mr-2" />
        {showInvite ? "Hide Invite" : "Share Deck"}
      </Button>

      {showInvite && <DeckInviteDialog deckId={deckId} open={true} onOpenChange={setShowInvite} />}

      <SharedDeckAccessManager deckId={deckId} />
    </div>
  );
}
