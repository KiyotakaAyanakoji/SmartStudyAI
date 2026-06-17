import React, { useState, useEffect } from 'react';
import { Volume2, FileText, Download, Trash2, Loader2, PlayCircle, AlertCircle, CheckSquare, Square } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../services/api';

const AudioPage = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [audioFiles, setAudioFiles] = useState([]);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  useEffect(() => {
    fetchDocuments();
    fetchAudioFiles();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await api.get('/api/documents/');
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    }
  };

  const fetchAudioFiles = async () => {
    setLoadingAudio(true);
    try {
      const response = await api.get('/api/audio/list');
      setAudioFiles(response.data);
    } catch (error) {
      console.error('Error fetching audio files:', error);
      toast.error('Failed to load audio files');
    } finally {
      setLoadingAudio(false);
    }
  };

  const handleToggleDoc = (docId) => {
    setSelectedDocIds(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const handleSelectAll = () => {
    setSelectedDocIds(documents.map(d => d.id));
  };

  const handleClearAll = () => {
    setSelectedDocIds([]);
  };

  const handleGenerateAudio = async () => {
    if (selectedDocIds.length === 0) return;
    
    setGenerating(true);
    const loadingToast = toast.loading('Generating conversational audio overview... This might take a minute.');
    
    try {
      await api.post('/api/audio/generate', { document_ids: selectedDocIds });
      toast.success('Audio generated successfully!', { id: loadingToast });
      fetchAudioFiles();
    } catch (error) {
      console.error('Error generating audio:', error);
      toast.error(error.response?.data?.detail || 'Failed to generate audio', { id: loadingToast });
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteAudio = async (audioId) => {
    if (!window.confirm("Are you sure you want to delete this audio overview?")) return;
    
    try {
      await api.delete(`/api/audio/${audioId}`);
      toast.success('Audio file deleted');
      setAudioFiles(prev => prev.filter(a => a.id !== audioId));
    } catch (error) {
      console.error('Error deleting audio:', error);
      toast.error('Failed to delete audio file');
    }
  };

  const handleDownload = async (audioId, filename) => {
    try {
      const response = await api.get(`/api/audio/download/${audioId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Error downloading audio:', error);
      toast.error('Failed to download audio file');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-6 transition-colors duration-200">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center">
          <Volume2 className="h-10 w-10 text-primary dark:text-indigo-400 mr-4" />
          Audio Overviews
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-3 text-lg max-w-2xl">
          Listen to conversational summaries of your documents on the go.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Generate Audio */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-md sticky top-6 transition-colors duration-200">
            <div className="mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Create New Audio</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Select documents to combine into a conversational podcast-style summary.</p>
            </div>
            
            <div className="flex items-center justify-between mb-3">
               <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Your Documents</span>
               <div className="flex space-x-2 text-xs">
                 <button onClick={handleSelectAll} className="text-primary dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">All</button>
                 <span className="text-gray-300 dark:text-gray-600">|</span>
                 <button onClick={handleClearAll} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">Clear</button>
               </div>
            </div>

            <div className="max-h-60 overflow-y-auto pr-2 space-y-2 custom-scrollbar mb-6">
              {documents.length > 0 ? (
                documents.map(doc => {
                  const isSelected = selectedDocIds.includes(doc.id);
                  return (
                    <div 
                      key={doc.id}
                      onClick={() => !generating && handleToggleDoc(doc.id)}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected ? 'bg-indigo-50 dark:bg-indigo-900/30 border-primary dark:border-indigo-500' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      } ${generating ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex-shrink-0 mr-3">
                        {isSelected ? <CheckSquare className="h-5 w-5 text-primary dark:text-indigo-400" /> : <Square className="h-5 w-5 text-gray-400 dark:text-gray-500" />}
                      </div>
                      <p className={`text-sm font-medium truncate ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                        {doc.filename}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">No documents found.</div>
              )}
            </div>

            <button
              onClick={handleGenerateAudio}
              disabled={selectedDocIds.length === 0 || generating}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-primary hover:bg-yellow-700 text-white text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlayCircle className="h-5 w-5" />}
              <span>{generating ? 'Generating...' : 'Generate Audio Overview'}</span>
            </button>
            
            {selectedDocIds.length === 0 && !generating && (
              <p className="text-xs text-center text-gray-500 mt-3 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 mr-1" /> Select at least one document
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Audio List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-md transition-colors duration-200">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Your Audio Files</h2>
            
            {loadingAudio ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 text-primary dark:text-indigo-400 animate-spin" />
              </div>
            ) : audioFiles.length > 0 ? (
              <div className="space-y-4">
                {audioFiles.map(audio => (
                  <div key={audio.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5 shadow-sm transition-all hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                      <div className="flex items-center mb-3 sm:mb-0">
                        <div className="bg-indigo-50 dark:bg-gray-900 p-3 rounded-full mr-4">
                          <Volume2 className="h-6 w-6 text-primary dark:text-indigo-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white break-all">{audio.filename}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Generated on {format(new Date(audio.created_at), 'MMM d, yyyy')}
                            {audio.duration_seconds ? ` • ${Math.floor(audio.duration_seconds / 60)}:${(audio.duration_seconds % 60).toString().padStart(2, '0')}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleDownload(audio.id, audio.filename)}
                          className="p-2 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md transition-colors border border-gray-200 dark:border-gray-700"
                          title="Download MP3"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteAudio(audio.id)}
                          className="p-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500 dark:text-red-400 rounded-md transition-colors border border-red-100 dark:border-red-900/50"
                          title="Delete Audio"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-50 dark:bg-gray-900 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
                      <audio 
                        controls 
                        className="w-full h-10 custom-audio-player" 
                        src={`http://localhost:8000/api/audio/download/${audio.id}?token=${localStorage.getItem('token')}`}
                        preload="metadata"
                      >
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 border-dashed">
                <Volume2 className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300">No audio overviews yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  Select a document from the left and generate a conversational overview you can listen to anywhere.
                </p>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default AudioPage;
