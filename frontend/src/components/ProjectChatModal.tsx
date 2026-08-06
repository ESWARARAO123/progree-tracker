import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Paperclip, FileText, Image as ImageIcon, Download, MessageSquare, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import type { Project, ProjectChatMessage } from '../types';

interface ProjectChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

export const ProjectChatModal: React.FC<ProjectChatModalProps> = ({ isOpen, onClose, project }) => {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<ProjectChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMessages = async () => {
    if (!token || !project) return;
    try {
      setLoading(true);
      const res = await api.getProjectChat(token, project.id);
      const mapped: ProjectChatMessage[] = res.map((m: any) => ({
        id: m.id,
        projectId: m.project_id,
        userId: m.user_id,
        userName: m.user_name,
        userEmail: m.user_email,
        userDesignation: m.user_designation,
        message: m.message,
        fileUrl: m.file_url,
        fileName: m.file_name,
        createdAt: m.created_at,
      }));
      setMessages(mapped);
    } catch (err) {
      console.error('Failed to load project chat:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && project) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000); // Polling every 5 sec
      return () => clearInterval(interval);
    }
  }, [isOpen, project, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen || !project) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !token) return;

    try {
      setSending(true);
      let fileUrl = '';
      let fileName = '';

      if (selectedFile) {
        const uploadRes = await api.uploadChatFile(token, project.id, selectedFile);
        fileUrl = uploadRes.file_url;
        fileName = uploadRes.file_name;
      }

      await api.sendProjectChatMessage(token, project.id, {
        message: newMessage.trim() || (selectedFile ? `Shared file: ${selectedFile.name}` : ''),
        file_url: fileUrl || undefined,
        file_name: fileName || undefined,
      });

      setNewMessage('');
      setSelectedFile(null);
      await fetchMessages();
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const isImageFile = (fileName?: string) => {
    if (!fileName) return false;
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext || '');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col h-[650px] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center space-x-2">
                <span>{project.name}</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Project Discussion
                </span>
              </h3>
              <p className="text-xs text-slate-400">Collaborate, share doubts, files & updates with project members</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/40">
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16 text-slate-500 space-y-2">
              <MessageSquare className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
              <p className="text-sm font-medium">No messages yet in this project chat.</p>
              <p className="text-xs">Be the first to start the discussion or upload project files!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.userId === user?.id;
              const formattedTime = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-semibold text-slate-300">
                      {isMe ? 'You' : msg.userName}
                    </span>
                    {msg.userDesignation && (
                      <span className="text-[10px] text-slate-500">({msg.userDesignation})</span>
                    )}
                    <span className="text-[10px] text-slate-500">{formattedTime}</span>
                  </div>

                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed space-y-2 ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-600/20'
                      : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-tl-none'
                  }`}>
                    {msg.message && <p className="whitespace-pre-wrap">{msg.message}</p>}

                    {msg.fileUrl && (
                      <div className="pt-1">
                        {isImageFile(msg.fileName) ? (
                          <div className="space-y-1.5">
                            <img
                              src={msg.fileUrl}
                              alt={msg.fileName || 'Attachment'}
                              className="max-h-48 rounded-lg object-cover border border-white/10"
                            />
                            <a
                              href={msg.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1 text-[11px] underline opacity-90 hover:opacity-100"
                            >
                              <Download className="w-3 h-3" />
                              <span>{msg.fileName || 'Download Screenshot'}</span>
                            </a>
                          </div>
                        ) : (
                          <a
                            href={msg.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={`flex items-center space-x-2 p-2 rounded-xl border transition ${
                              isMe ? 'bg-blue-700/60 border-blue-400/40 text-white' : 'bg-slate-900 border-slate-700 text-slate-200'
                            }`}
                          >
                            <FileText className="w-4 h-4 shrink-0 text-amber-400" />
                            <span className="truncate flex-1 font-medium">{msg.fileName || 'Download File'}</span>
                            <Download className="w-3.5 h-3.5 shrink-0" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Selected file banner */}
        {selectedFile && (
          <div className="px-6 py-2 bg-slate-800/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center space-x-2 truncate">
              {isImageFile(selectedFile.name) ? <ImageIcon className="w-4 h-4 text-emerald-400" /> : <FileText className="w-4 h-4 text-blue-400" />}
              <span className="truncate font-medium">{selectedFile.name}</span>
              <span className="text-[10px] text-slate-500">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
            </div>
            <button onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-rose-400 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-4 bg-slate-900 border-t border-slate-800 flex items-center space-x-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setSelectedFile(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-blue-400 transition border border-slate-700/80"
            title="Attach Screenshot or Document"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message or ask doubts about this project..."
            className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
          />

          <button
            type="submit"
            disabled={sending || (!newMessage.trim() && !selectedFile)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-blue-600/30 transition"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
