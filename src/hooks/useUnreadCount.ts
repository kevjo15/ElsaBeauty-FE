import { useChatState } from "@/contexts/ChatStateContext";

/**
 * Returns the number of unread messages for a given conversation.
 * Reads directly from ChatStateContext — no HTTP requests.
 */
export function useUnreadCount(
  conversationId: string | undefined,
  _userId?: string
): number {
  const { unreadCounts } = useChatState();
  if (!conversationId) return 0;
  return unreadCounts[conversationId.toLowerCase()] ?? 0;
}
