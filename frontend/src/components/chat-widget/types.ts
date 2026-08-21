export interface Conversation {
  id: number;
  title: string;
  updated_at: string;
}

export interface ChatMessage {
  role: 'user' | 'ai' | 'assistant';
  content: string;
  created_at?: string;
}
