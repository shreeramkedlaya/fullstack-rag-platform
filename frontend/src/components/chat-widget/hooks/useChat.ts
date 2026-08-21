import { useState, useRef } from 'react';
import axios from '../../../http';
import type { ChatMessage } from '../types';
import { useToast } from '../../../context/ToastContext';

const useChat = (
  conversationId: number | null,
  setConversationId: (id: number | null) => void,
  fetchConversations: () => void,
  isExpanded: boolean
) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversation = async (id: number) => {
    setConversationId(id);
    setIsLoading(true);
    try {
      const res = await axios.get(`/chat/conversations/${id}/`);
      const formattedMessages: ChatMessage[] = res.data.map((m: any) => ({
        role: m.role === 'assistant' || m.role === 'ai' ? 'ai' : 'user',
        content: m.content
      }));
      setMessages(formattedMessages);
    } catch (e) {
      console.error("Failed to load messages", e);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const clearMessages = () => setMessages([]);

  const handleSend = async () => {
    if (!inputValue.trim() && stagedFiles.length === 0) return;

    let currentConversationId = conversationId;
    setIsLoading(true);

    try {
      // 1. Upload Staged Files first
      if (stagedFiles.length > 0) {
        setMessages(prev => [...prev, { role: 'user', content: `Uploading ${stagedFiles.length} file(s)...` }]);
        const formData = new FormData();
        stagedFiles.forEach(file => {
          formData.append('files', file);
        });
        if (currentConversationId) {
          formData.append('conversation_id', currentConversationId.toString());
        }

        const response = await axios.post(`/chat/ingest/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        const data = response.data;
        if (data.conversation_id && !currentConversationId) {
          currentConversationId = data.conversation_id;
          setConversationId(data.conversation_id);
          if (isExpanded) {
            await fetchConversations();
          }
        }

        setMessages(prev => [...prev, {
          role: 'ai',
          content: `Successfully uploaded ${stagedFiles.length} file(s). Created ${data.chunks_created || 0} knowledge chunks.`
        }]);
        setStagedFiles([]);
        showToast("Documents uploaded successfully", "success");
      }

      // 2. Send text message if present
      if (inputValue.trim()) {
        const userMessage = inputValue;
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setInputValue('');

        const response = await axios.post(`/chat/`, {
          message: userMessage,
          conversation_id: currentConversationId
        });

        const data = response.data;
        setMessages(prev => [...prev, { role: 'ai', content: data.response }]);

        if (data.conversation_id && !currentConversationId) {
          setConversationId(data.conversation_id);
          if (isExpanded) {
            fetchConversations();
          }
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', content: '⚠️ Error communicating with the KnowledgeMesh server.' }]);
      showToast("Operation failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setStagedFiles(prev => [...prev, ...Array.from(event.target.files!)]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeStagedFile = (index: number) => {
    setStagedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
      setStagedFiles(prev => [...prev, ...droppedFiles]);
    }
  };

  return {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    stagedFiles,
    isDragging,
    fileInputRef,
    messagesEndRef,
    scrollToBottom,
    loadConversation,
    clearMessages,
    handleSend,
    handleFileSelect,
    removeStagedFile,
    handleDragOver,
    handleDragLeave,
    handleDrop
  };
}

export { useChat };
