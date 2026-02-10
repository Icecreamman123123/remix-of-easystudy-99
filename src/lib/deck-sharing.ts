/**
 * Deck Invitation and Sharing Management
 * Handles sharing decks with other users
 */

import { supabase } from "@/integrations/supabase/client";

export type AccessLevel = "view" | "edit" | "admin";
export type InvitationStatus = "pending" | "accepted" | "declined" | "expired";

export interface DeckInvitation {
  id: string;
  deck_id: string;
  inviter_id: string;
  invitee_email?: string;
  invitee_id?: string;
  access_level: AccessLevel;
  status: InvitationStatus;
  expires_at?: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SharedDeckAccess {
  id: string;
  deck_id: string;
  user_id: string;
  access_level: AccessLevel;
  granted_by?: string;
  created_at: string;
}

/**
 * Create an invitation to share a deck
 */
export async function createDeckInvitation(
  deckId: string,
  inviteeEmail: string,
  accessLevel: AccessLevel = "view",
  inviteeId?: string
): Promise<DeckInvitation | null> {
  try {
    const { data, error } = await (supabase as any)
      .from("deck_invitations")
      .insert({
        deck_id: deckId,
        invitee_email: inviteeEmail,
        invitee_id: inviteeId,
        access_level: accessLevel,
      })
      .select()
      .single();

    if (error) throw error;
    return data as DeckInvitation;
  } catch (error) {
    console.error("Error creating invitation:", error);
    return null;
  }
}

/**
 * Accept a deck invitation
 */
export async function acceptDeckInvitation(invitationId: string): Promise<boolean> {
  try {
    const { data: invitation, error: fetchError } = await (supabase as any)
      .from("deck_invitations")
      .select("*")
      .eq("id", invitationId)
      .single();

    if (fetchError) throw fetchError;

    const inv = invitation as DeckInvitation;

    // Grant access to the deck
    const { error: accessError } = await (supabase as any)
      .from("shared_deck_access")
      .insert({
        deck_id: inv.deck_id,
        user_id: inv.invitee_id,
        access_level: inv.access_level,
        granted_by: inv.inviter_id,
      });

    if (accessError && accessError.code !== "23505") {
      // 23505 = unique constraint (already has access)
      throw accessError;
    }

    // Update invitation status
    const { error: updateError } = await (supabase as any)
      .from("deck_invitations")
      .update({
        status: "accepted",
        responded_at: new Date().toISOString(),
      })
      .eq("id", invitationId);

    if (updateError) throw updateError;
    return true;
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return false;
  }
}

/**
 * Decline a deck invitation
 */
export async function declineDeckInvitation(invitationId: string): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from("deck_invitations")
      .update({
        status: "declined",
        responded_at: new Date().toISOString(),
      })
      .eq("id", invitationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error declining invitation:", error);
    return false;
  }
}

/**
 * Get pending invitations for current user
 */
export async function getPendingInvitations(userId: string): Promise<DeckInvitation[]> {
  try {
    const { data, error } = await (supabase as any)
      .from("deck_invitations")
      .select("*")
      .eq("invitee_id", userId)
      .eq("status", "pending");

    if (error) throw error;
    return (data as DeckInvitation[]) || [];
  } catch (error) {
    console.error("Error fetching pending invitations:", error);
    return [];
  }
}

/**
 * Get all invitations sent by user
 */
export async function getSentInvitations(userId: string): Promise<DeckInvitation[]> {
  try {
    const { data, error } = await (supabase as any)
      .from("deck_invitations")
      .select("*")
      .eq("inviter_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as DeckInvitation[]) || [];
  } catch (error) {
    console.error("Error fetching sent invitations:", error);
    return [];
  }
}

/**
 * Get all users with access to a deck
 */
export async function getDeckAccessUsers(deckId: string): Promise<SharedDeckAccess[]> {
  try {
    const { data, error } = await (supabase as any)
      .from("shared_deck_access")
      .select("*")
      .eq("deck_id", deckId);

    if (error) throw error;
    return (data as SharedDeckAccess[]) || [];
  } catch (error) {
    console.error("Error fetching deck access users:", error);
    return [];
  }
}

/**
 * Update shared deck access level
 */
export async function updateDeckAccess(
  deckId: string,
  userId: string,
  newAccessLevel: AccessLevel
): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from("shared_deck_access")
      .update({ access_level: newAccessLevel })
      .eq("deck_id", deckId)
      .eq("user_id", userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating deck access:", error);
    return false;
  }
}

/**
 * Revoke access to a deck
 */
export async function revokeDeckAccess(deckId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from("shared_deck_access")
      .delete()
      .eq("deck_id", deckId)
      .eq("user_id", userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error revoking deck access:", error);
    return false;
  }
}

/**
 * Cancel/revoke an invitation
 */
export async function cancelInvitation(invitationId: string): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from("deck_invitations")
      .delete()
      .eq("id", invitationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error canceling invitation:", error);
    return false;
  }
}

/**
 * Check if user has access to a deck
 */
export async function getUserDeckAccess(
  deckId: string,
  userId: string
): Promise<AccessLevel | null> {
  try {
    const { data, error } = await (supabase as any)
      .from("shared_deck_access")
      .select("access_level")
      .eq("deck_id", deckId)
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = no row found
    return (data?.access_level as AccessLevel) || null;
  } catch (error) {
    console.error("Error checking deck access:", error);
    return null;
  }
}

/**
 * Get all decks shared with user
 */
export async function getSharedDecksForUser(userId: string) {
  try {
    const { data, error } = await (supabase as any)
      .from("shared_deck_access")
      .select(
        `
        *,
        flashcard_decks:deck_id (
          id,
          user_id,
          title,
          description,
          topic,
          created_at,
          updated_at
        )
      `
      )
      .eq("user_id", userId);

    if (error) throw error;

    return (data as any[])
      .map((item) => ({
        ...item.flashcard_decks,
        access_level: item.access_level,
        shared_by: item.granted_by,
        access_granted_at: item.created_at,
      }))
      .filter((deck) => deck && deck.id); // Filter out null decks
  } catch (error) {
    console.error("Error getting shared decks:", error);
    return [];
  }
}

/**
 * Generate shareable deck link (could be implemented with short codes)
 */
export function generateShareableLink(deckId: string): string {
  // Could be improved with database-backed share codes
  return `${window.location.origin}/shared/${deckId}`;
}

/**
 * Send email invitation (would need backend email service)
 */
export async function sendEmailInvitation(
  email: string,
  deckTitle: string,
  inviterName: string,
  accessLevel: AccessLevel
): Promise<boolean> {
  try {
    // This would call a Supabase edge function to send the email
    const { error } = await supabase.functions.invoke("send-deck-invitation-email", {
      body: {
        email,
        deckTitle,
        inviterName,
        accessLevel,
      },
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error sending email invitation:", error);
    return false;
  }
}
