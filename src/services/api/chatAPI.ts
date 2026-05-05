import {
  getConversationMessagesUrl,
  sendConversationMessageUrl,
  API_BASE_URL,
} from "./apiUrl";
import { api } from "./apiService";
import type { ChatMessage } from "./types";

type RawChatMessage = Partial<{
  id: string;
  Id: string;
  conversationId: string;
  ConversationId: string;
  senderId: string;
  SenderId: string;
  userId: string;
  UserId: string;
  content: string;
  Content: string;
  sentAt: string;
  SentAt: string;
  readAt: string;
  ReadAt: string;
}>;

function normalizeOptionalTimestamp(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const toChatMessage = (raw: RawChatMessage | unknown): ChatMessage => {
  const r = (typeof raw === "object" && raw !== null ? raw : {}) as RawChatMessage;
  const sender =
    r.senderId ??
    r.SenderId ??
    r.userId ??
    r.UserId ??
    "";
  return {
    id: r.id ?? r.Id,
    conversationId: r.conversationId ?? r.ConversationId ?? "",
    senderId: sender,
    content: r.content ?? r.Content ?? "",
    sentAt: r.sentAt ?? r.SentAt ?? new Date().toISOString(),
    readAt: normalizeOptionalTimestamp(r.readAt ?? r.ReadAt),
  };
};

/**
 * Fetch message history for a conversation.
 */
export async function fetchConversationMessages(
  conversationId: string
): Promise<ChatMessage[]> {
  const url = getConversationMessagesUrl(conversationId);
  // api instance already has auth interceptor that adds Authorization header
  const res = await api.get<ChatMessage[]>(url);
  return (res.data ?? []).map(toChatMessage);
}

/**
 * HTTP fallback for sending a message (used if SignalR send fails).
 */
export async function sendMessageHttp(
  conversationId: string,
  payload: Pick<ChatMessage, "content"> & { senderId: string }
): Promise<void> {
  const url = sendConversationMessageUrl(conversationId);
  // api instance already has auth interceptor that adds Authorization header
  await api.post(url, {
    ConversationId: conversationId,
    SenderId: payload.senderId,
    Content: payload.content,
  });
}

/**
 * HTTP fallback for marking all messages in a conversation as read.
 * Used when the SignalR connection is not yet established.
 */
export async function markConversationAsReadHttp(conversationId: string): Promise<void> {
  try {
    await api.patch(`${API_BASE_URL}/conversations/${conversationId}/read`);
  } catch {
    // best-effort
  }
}

export { toChatMessage };
