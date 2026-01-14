import {
  getConversationMessagesUrl,
  sendConversationMessageUrl,
} from "./apiUrl";
import { api } from "./apiService";
import type { ChatMessage } from "./types";
import { getCookie } from "./authService";

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
    readAt: r.readAt ?? r.ReadAt,
  };
};

/**
 * Fetch message history for a conversation.
 */
export async function fetchConversationMessages(
  conversationId: string
): Promise<ChatMessage[]> {
  const url = getConversationMessagesUrl(conversationId);
  const token = getCookie("accessToken");

  const res = await api.get<ChatMessage[]>(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

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
  const token = getCookie("accessToken");

  await api.post(
    url,
    {
      ConversationId: conversationId,
      SenderId: payload.senderId,
      Content: payload.content,
    },
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }
  );
}

export { toChatMessage };
