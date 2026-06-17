import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { UploadCloud, FileText, Trash2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const DocumentsPage = () => {
  const { user } = useContext(AuthContext);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [documentType, setDocumentType] = useState('notes');
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
      toast.error('Failed to load documents');
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
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed.');
      return;
    }
    
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size exceeds the 20MB limit.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);

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
      toast.success('Document uploaded successfully!');
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Upload failed', error);
      toast.error(error.response?.data?.detail || 'Failed to upload document.');
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await api.delete(`/api/documents/${id}`);
      setDocuments(documents.filter(doc => doc.id !== id));
      toast.success('Document deleted');
    } catch (error) {
      console.error('Failed to delete document', error);
      toast.error('Failed to delete document.');
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
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl font-bold text-gray-900">Your Documents</h1>
          <p className="text-gray-600 mt-2">Upload and manage your study materials.</p>
        </header>

        {/* Upload Area */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
            <select 
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary shadow-sm"
            >
              <option value="notes">Notes</option>
              <option value="textbook">Textbook</option>
              <option value="syllabus">Syllabus</option>
              <option value="previous_year_paper">Previous Year Paper</option>
            </select>
          </div>
          <div className="text-sm text-gray-500 max-w-sm">
            Tagging your document correctly helps the AI provide better study tools and analysis.
          </div>
        </div>

        <div 
          className={`relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-colors ${isDragging ? 'border-primary bg-indigo-50' : 'border-primary bg-white hover:border-indigo-500 hover:bg-gray-50'} shadow-sm`}
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
            <div className="p-4 bg-indigo-50 rounded-full">
              <UploadCloud className={`h-8 w-8 ${isDragging ? 'text-primary' : 'text-indigo-400'}`} />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                Click or drag PDF to upload
              </p>
              <p className="text-sm text-gray-500 mt-1">Maximum file size 20MB</p>
            </div>
          </div>
          
          {isUploading && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-8">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
              <div className="w-full max-w-xs bg-gray-200 rounded-full h-2.5 mb-2">
                <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
              </div>
              <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">{uploadProgress}% Uploaded</p>
            </div>
          )}
        </div>

        {/* Documents List */}
        <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-md">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Uploaded Files</h2>
          </div>
          
          {loading ? (
            <div className="p-6 sm:p-12 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
              <FileText className="h-16 w-16 text-gray-300 dark:text-gray-700 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-1">No documents yet</h3>
              <p>Upload your first PDF to get started!</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {documents.map((doc) => (
                <li key={doc.id} className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center justify-between group">
                  <div className="flex items-center space-x-4 overflow-hidden">
                    <div className="p-3 bg-indigo-50 dark:bg-gray-900 rounded-lg border border-indigo-100 dark:border-gray-700 flex-shrink-0">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{doc.filename}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span>{formatDate(doc.upload_date)}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{doc.page_count} pages</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="capitalize bg-gray-100 dark:bg-gray-900 px-2 py-0.5 rounded text-indigo-700 dark:text-indigo-300">
                          {doc.document_type ? doc.document_type.replace('_', ' ') : 'Notes'}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className={`flex items-center ${doc.status === 'processed' ? 'text-secondary' : doc.status === 'error' ? 'text-red-600' : 'text-accent'}`}>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {doc.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex-shrink-0 ml-4"
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
