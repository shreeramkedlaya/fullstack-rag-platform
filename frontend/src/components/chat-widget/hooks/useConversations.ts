import { useState } from 'react';
import axios from '../../../http';
import type { Conversation } from '../types';
import { useToast } from '../../../context/ToastContext';

const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const { showToast } = useToast();

  const fetchConversations = async () => {
    try {
      const res = await axios.get(`/chat/conversations/`);
      setConversations(res.data);
    } catch (e) {
      console.error("Failed to fetch conversations", e);
    }
  };

  const createNewChat = () => {
    setConversationId(null);
  };

  const deleteConversation = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await axios.delete(`/chat/conversations/${id}/`);
      setConversations(prev => prev.filter(c => c.id !== id));
      showToast("Conversation deleted", "success");
      if (conversationId === id) {
        createNewChat();
      }
    } catch (error) {
      console.error("Failed to delete conversation", error);
      showToast("Failed to delete conversation", "error");
    }
  };

  const startEditing = (e: React.MouseEvent, id: number, currentTitle: string) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle || '');
  };

  const saveEdit = async (e: React.SyntheticEvent | undefined, id: number) => {
    if (e) e.stopPropagation();
    const conv = conversations.find(c => c.id === id);
    if (!editTitle.trim() || (conv && editTitle.trim() === conv.title)) {
      setEditingId(null);
      return;
    }
    try {
      await axios.put(`/chat/conversations/${id}/`, { title: editTitle.trim() });
      setConversations(prev => prev.map(c => c.id === id ? { ...c, title: editTitle.trim() } : c));
      showToast("Conversation renamed", "success");
    } catch (error) {
      console.error("Failed to rename conversation", error);
      showToast("Failed to rename conversation", "error");
    } finally {
      setEditingId(null);
    }
  };

  return {
    conversations,
    conversationId,
    setConversationId,
    editingId,
    editTitle,
    setEditTitle,
    fetchConversations,
    createNewChat,
    deleteConversation,
    startEditing,
    saveEdit
  };
}

export { useConversations };
