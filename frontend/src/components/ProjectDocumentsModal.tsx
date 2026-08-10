import React, { useState, useEffect, useRef } from 'react';
import {
  X, FileText, Download, Trash2, Upload, FolderOpen, Loader2,
  Image as ImageIcon, FileSpreadsheet, FileArchive,
  Film, Music, Loader
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import type { Project, ProjectDocument } from '../types';

interface ProjectDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return <ImageIcon className="w-5 h-5 text-emerald-400" />;
  if (['xlsx', 'xls', 'csv'].includes(ext)) return <FileSpreadsheet className="w-5 h-5 text-green-400" />;
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return <FileArchive className="w-5 h-5 text-amber-400" />;
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return <Film className="w-5 h-5 text-rose-400" />;
  if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) return <Music className="w-5 h-5 text-purple-400" />;
  return <FileText className="w-5 h-5 text-blue-400" />;
}

function formatSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const ProjectDocumentsModal: React.FC<ProjectDocumentsModalProps> = ({ isOpen, onClose, project }) => {
  const { token, user } = useAuth();
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === 'ADMIN';
  const isMember = !!project && (
    isAdmin ||
    project.owner?.id === user?.id ||
    project.assignedUsers.some(u => u.id === user?.id)
  );

  const fetchDocuments = async () => {
    if (!token || !project) return;
    try {
      setLoading(true);
      const res = await api.getProjectDocuments(token, project.id);
      const mapped: ProjectDocument[] = res.map((d: any) => ({
        id: d.id,
        projectId: d.project_id,
        userId: d.user_id,
        userName: d.user_name,
        fileUrl: d.file_url,
        fileName: d.file_name,
        contentType: d.content_type,
        size: d.size,
        source: d.source,
        createdAt: d.created_at,
      }));
      setDocuments(mapped);
    } catch (err) {
      console.error('Failed to load project documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && project) {
      fetchDocuments();
    }
  }, [isOpen, project, token]);

  if (!isOpen || !project) return null;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !token) return;
    try {
      setUploading(true);
      await api.uploadProjectDocument(token, project.id, file);
      await fetchDocuments();
    } catch (err: any) {
      alert(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: ProjectDocument) => {
    if (!token) return;
    try {
      const blob = await api.downloadProjectDocument(token, project.id, doc.id);
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      alert(err.message || 'Failed to download document');
    }
  };

  const handleDelete = async (doc: ProjectDocument) => {
    if (!token) return;
    if (!window.confirm(`Delete "${doc.fileName}" from the project database?`)) return;
    try {
      setDeletingId(doc.id);
      await api.deleteProjectDocument(token, project.id, doc.id);
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  const canDelete = (doc: ProjectDocument) => isAdmin || doc.userId === user?.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col h-[650px] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center space-x-2">
                <span>{project.name}</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Project Database
                </span>
              </h3>
              <p className="text-xs text-slate-400">Shared file repository for project members</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Bar */}
        {isMember && (
          <div className="px-6 py-3 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">{documents.length} document{documents.length !== 1 ? 's' : ''}</span>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-amber-600/30 transition"
            >
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              <span>{uploading ? 'Uploading...' : 'Upload File'}</span>
            </button>
          </div>
        )}

        {/* Document List */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/40">
          {loading && documents.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-16 text-slate-500 space-y-2">
              <FolderOpen className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
              <p className="text-sm font-medium">No documents in this project database.</p>
              <p className="text-xs">Upload files to share with project members.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center space-x-3 bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 hover:border-slate-600 transition"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-900/80 border border-slate-700 flex items-center justify-center shrink-0">
                    {fileIcon(doc.fileName)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate">{doc.fileName}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 flex items-center space-x-2">
                      <span>{doc.userName || 'Unknown'}</span>
                      {doc.size !== undefined && doc.size !== null && <span>· {formatSize(doc.size)}</span>}
                      {doc.createdAt && <span>· {new Date(doc.createdAt).toLocaleDateString()}</span>}
                      {doc.source && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 uppercase">
                          {doc.source}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {canDelete(doc) && (
                      <button
                        onClick={() => handleDelete(doc)}
                        disabled={deletingId === doc.id}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingId === doc.id ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
