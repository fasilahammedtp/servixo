import { api } from "./api";
import { ChatMessage, Conversation } from "../types";

export async function getConversations(): Promise<Conversation[]> {
  const res = await api.get<{ conversations: Conversation[] }>("/messages/conversations");
  return res.data.conversations;
}

export async function getUnreadCount(): Promise<number> {
  const res = await api.get<{ count: number }>("/messages/unread-count");
  return res.data.count;
}

export async function getJobMessages(jobId: string, before?: string): Promise<ChatMessage[]> {
  const params: Record<string, any> = { limit: 50 };
  if (before) {
    params.before = before;
  }
  const res = await api.get<{ messages: ChatMessage[] }>(`/jobs/${jobId}/messages`, { params });
  return res.data.messages;
}

export async function sendMessage(jobId: string, text: string): Promise<ChatMessage> {
  const res = await api.post<{ message: ChatMessage }>(`/jobs/${jobId}/messages`, { text });
  return res.data.message;
}

export async function markJobMessagesAsRead(jobId: string): Promise<{ message: string; modifiedCount: number }> {
  const res = await api.patch<{ message: string; modifiedCount: number }>(`/jobs/${jobId}/messages/read`);
  return res.data;
}
