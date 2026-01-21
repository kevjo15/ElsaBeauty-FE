import { useEffect, useState } from "react";
import { fetchConversationMessages } from "@/services/api/chatAPI";

/**
 * Hook to count unread messages in a conversation.
 * A message is considered unread if:
 * - It was sent by someone other than the current user
 * - It has no readAt timestamp
 */
export function useUnreadCount(
  conversationId: string | undefined,
  userId: string | undefined
): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!conversationId || !userId) {
      setCount(0);
      return;
    }

    const fetchUnread = async () => {
      try {
        const messages = await fetchConversationMessages(conversationId);
        const unread = messages.filter(
          (m) => m.senderId !== userId && !m.readAt
        ).length;
        setCount(unread);
      } catch {
        setCount(0);
      }
    };

    fetchUnread();
  }, [conversationId, userId]);

  return count;
}
