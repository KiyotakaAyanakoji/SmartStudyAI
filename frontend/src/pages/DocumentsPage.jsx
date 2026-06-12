import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { UploadCloud, FileText, Trash2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const DocumentsPage = () => {
  const { user } = useContext(AuthContext);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await api.get('/api/documents/');
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to fetch documents', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    setUploadError(null);
    
    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are allowed.');
      return;
    }
    
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('File size exceeds the 20MB limit.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const response = await api.post('/api/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      setDocuments([response.data, ...documents]);
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Upload failed', error);
      setUploadError(error.response?.data?.detail || 'Failed to upload document.');
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await api.delete(`/api/documents/${id}`);
      setDocuments(documents.filter(doc => doc.id !== id));
    } catch (error) {
      console.error('Failed to delete document', error);
      alert('Failed to delete document.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">Your Documents</h1>
          <p className="text-slate-400 mt-2">Upload and manage your study materials.</p>
        </header>

        {/* Upload Area */}
        <div 
          className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-900 hover:border-slate-500 hover:bg-slate-800'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileInput} 
            accept="application/pdf" 
            className="hidden" 
          />
          
          <div className="flex flex-col items-center justify-center space-y-4 cursor-pointer">
            <div className="p-4 bg-slate-800 rounded-full">
              <UploadCloud className={`h-8 w-8 ${isDragging ? 'text-indigo-400' : 'text-slate-400'}`} />
            </div>
            <div>
              <p className="text-lg font-medium text-slate-200">
                Click or drag PDF to upload
              </p>
              <p className="text-sm text-slate-500 mt-1">Maximum file size 20MB</p>
            </div>
          </div>
          
          {isUploading && (
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-8">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-4" />
              <div className="w-full max-w-xs bg-slate-800 rounded-full h-2.5 mb-2">
                <div className="bg-indigo-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
              </div>
              <p className="text-sm font-medium text-indigo-300">{uploadProgress}% Uploaded</p>
            </div>
          )}
        </div>

        {uploadError && (
          <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-200">{uploadError}</p>
          </div>
        )}

        {/* Documents List */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-xl font-semibold text-white">Uploaded Files</h2>
          </div>
          
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center">
              <FileText className="h-12 w-12 text-slate-700 mb-4" />
              <p>No documents uploaded yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-800">
              {documents.map((doc) => (
                <li key={doc.id} className="p-6 hover:bg-slate-800/50 transition-colors flex items-center justify-between group">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                      <FileText className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-200 line-clamp-1">{doc.filename}</h3>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-slate-500">
                        <span>{formatDate(doc.upload_date)}</span>
                        <span>•</span>
                        <span>{doc.page_count} pages</span>
                        <span>•</span>
                        <span className="flex items-center text-emerald-400">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {doc.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Delete document"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;
