/**
 * React Hook for managing deck invitations and sharing
 */

import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import {
  getPendingInvitations,
  getSentInvitations,
  createDeckInvitation,
  acceptDeckInvitation,
  declineDeckInvitation,
  cancelInvitation,
  getDeckAccessUsers,
  updateDeckAccess,
  revokeDeckAccess,
  getSharedDecksForUser,
  type DeckInvitation,
  type SharedDeckAccess,
  type AccessLevel,
} from "@/lib/deck-sharing";

export function useDeckInvitations() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [pendingInvitations, setPendingInvitations] = useState<DeckInvitation[]>([]);
  const [sentInvitations, setSentInvitations] = useState<DeckInvitation[]>([]);
  const [sharedDecks, setSharedDecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchInvitations = async () => {
      setLoading(true);
      try {
        const [pending, sent, shared] = await Promise.all([
          getPendingInvitations(user.id),
          getSentInvitations(user.id),
          getSharedDecksForUser(user.id),
        ]);

        setPendingInvitations(pending);
        setSentInvitations(sent);
        setSharedDecks(shared);
      } catch (error) {
        console.error("Error fetching invitations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvitations();

    // Refresh every 10 seconds
    const interval = setInterval(fetchInvitations, 10 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const send = async (
    deckId: string,
    email: string,
    accessLevel: AccessLevel = "view"
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const invitation = await createDeckInvitation(deckId, email, accessLevel);

      if (invitation) {
        setSentInvitations([invitation, ...sentInvitations]);
        toast({
          title: "Invitation sent",
          description: `Deck invitation sent to ${email}`,
        });
        return true;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    }

    return false;
  };

  const accept = async (invitationId: string): Promise<boolean> => {
    try {
      const success = await acceptDeckInvitation(invitationId);

      if (success) {
        setPendingInvitations(pendingInvitations.filter((i) => i.id !== invitationId));
        toast({
          title: "Accepted",
          description: "Deck invitation accepted",
        });

        // Refetch shared decks
        if (user) {
          const shared = await getSharedDecksForUser(user.id);
          setSharedDecks(shared);
        }

        return true;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept invitation",
        variant: "destructive",
      });
    }

    return false;
  };

  const decline = async (invitationId: string): Promise<boolean> => {
    try {
      const success = await declineDeckInvitation(invitationId);

      if (success) {
        setPendingInvitations(pendingInvitations.filter((i) => i.id !== invitationId));
        toast({
          title: "Declined",
          description: "Deck invitation declined",
        });
        return true;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to decline invitation",
        variant: "destructive",
      });
    }

    return false;
  };

  const cancel = async (invitationId: string): Promise<boolean> => {
    try {
      const success = await cancelInvitation(invitationId);

      if (success) {
        setSentInvitations(sentInvitations.filter((i) => i.id !== invitationId));
        toast({
          title: "Cancelled",
          description: "Invitation cancelled",
        });
        return true;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel invitation",
        variant: "destructive",
      });
    }

    return false;
  };

  return {
    pendingInvitations,
    sentInvitations,
    sharedDecks,
    loading,
    send,
    accept,
    decline,
    cancel,
    refetch: async () => {
      if (!user) return;
      const [pending, sent, shared] = await Promise.all([
        getPendingInvitations(user.id),
        getSentInvitations(user.id),
        getSharedDecksForUser(user.id),
      ]);
      setPendingInvitations(pending);
      setSentInvitations(sent);
      setSharedDecks(shared);
    },
  };
}

export function useDeckAccessManagement(deckId: string) {
  const [accessUsers, setAccessUsers] = useState<SharedDeckAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAccessUsers = async () => {
      setLoading(true);
      try {
        const users = await getDeckAccessUsers(deckId);
        setAccessUsers(users);
      } catch (error) {
        console.error("Error fetching access users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccessUsers();
  }, [deckId]);

  const updateAccess = async (userId: string, newLevel: AccessLevel): Promise<boolean> => {
    try {
      const success = await updateDeckAccess(deckId, userId, newLevel);

      if (success) {
        setAccessUsers(
          accessUsers.map((u) => (u.user_id === userId ? { ...u, access_level: newLevel } : u))
        );
        toast({
          title: "Updated",
          description: `Access level changed to ${newLevel}`,
        });
        return true;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update access level",
        variant: "destructive",
      });
    }

    return false;
  };

  const revoke = async (userId: string): Promise<boolean> => {
    try {
      const success = await revokeDeckAccess(deckId, userId);

      if (success) {
        setAccessUsers(accessUsers.filter((u) => u.user_id !== userId));
        toast({
          title: "Revoked",
          description: "Deck access revoked",
        });
        return true;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke access",
        variant: "destructive",
      });
    }

    return false;
  };

  return {
    accessUsers,
    loading,
    updateAccess,
    revoke,
  };
}
