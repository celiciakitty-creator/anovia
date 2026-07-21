import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  DirectConversation,
  DirectMessage,
} from "@/types/direct-message";
import { DIRECT_MESSAGE_MAX_LENGTH } from "@/types/direct-message";

type DbConversationRow = {
  id: string;
  participant_one: string;
  participant_two: string;
  created_at: string;
  updated_at: string;
};

type DbMessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

function mapConversationRow(row: DbConversationRow): DirectConversation {
  return {
    id: row.id,
    participantOne: row.participant_one,
    participantTwo: row.participant_two,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMessageRow(row: DbMessageRow): DirectMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
  };
}

/** Canonical participant order for duplicate prevention (participant_one < participant_two). */
export function orderParticipantIds(
  userIdA: string,
  userIdB: string
): [string, string] {
  return userIdA < userIdB ? [userIdA, userIdB] : [userIdB, userIdA];
}

export function validateDirectMessageBody(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) {
    throw new Error("Message cannot be empty.");
  }
  if (trimmed.length > DIRECT_MESSAGE_MAX_LENGTH) {
    throw new Error(
      `Message must be ${DIRECT_MESSAGE_MAX_LENGTH} characters or fewer.`
    );
  }
  return trimmed;
}

export async function getOrCreateDirectConversation(
  supabase: SupabaseClient,
  currentUserId: string,
  otherUserId: string
): Promise<DirectConversation> {
  if (currentUserId === otherUserId) {
    throw new Error("You cannot start a conversation with yourself.");
  }

  const [participantOne, participantTwo] = orderParticipantIds(
    currentUserId,
    otherUserId
  );

  const { data: existing, error: selectError } = await supabase
    .from("direct_conversations")
    .select("*")
    .eq("participant_one", participantOne)
    .eq("participant_two", participantTwo)
    .maybeSingle();

  if (selectError) {
    throw new Error(selectError.message);
  }

  if (existing) {
    return mapConversationRow(existing as DbConversationRow);
  }

  const { data, error } = await supabase
    .from("direct_conversations")
    .insert({
      participant_one: participantOne,
      participant_two: participantTwo,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: retry, error: retryError } = await supabase
        .from("direct_conversations")
        .select("*")
        .eq("participant_one", participantOne)
        .eq("participant_two", participantTwo)
        .single();

      if (retryError) {
        throw new Error(retryError.message);
      }

      return mapConversationRow(retry as DbConversationRow);
    }

    throw new Error(error.message);
  }

  return mapConversationRow(data as DbConversationRow);
}

export async function getDirectMessages(
  supabase: SupabaseClient,
  conversationId: string
): Promise<DirectMessage[]> {
  const { data, error } = await supabase
    .from("direct_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data as DbMessageRow[]).map(mapMessageRow);
}

export async function sendDirectMessage(
  supabase: SupabaseClient,
  conversationId: string,
  senderId: string,
  body: string
): Promise<DirectMessage> {
  const validatedBody = validateDirectMessageBody(body);

  const { data, error } = await supabase
    .from("direct_messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      body: validatedBody,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapMessageRow(data as DbMessageRow);
}

export function formatDirectMessageTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
