import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Cloud, CheckCircle, XCircle, FileText, UploadCloud, AlertCircle, Clock, Volume2, Loader2 } from 'lucide-react';

const DriveIntegrationPage = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(null);

  const [quizzes, setQuizzes] = useState([]);
  const [audioFiles, setAudioFiles] = useState([]);
  
  const [summaryDocName, setSummaryDocName] = useState('');
  const [summaryText, setSummaryText] = useState('');
  
  const [planDocName, setPlanDocName] = useState('');
  const [planText, setPlanText] = useState('');
  
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [selectedAudioId, setSelectedAudioId] = useState('');

  useEffect(() => {
    checkConnectionStatus();
    
    // Check for callback params
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get('connected') === 'true') {
      toast.success('Successfully connected to Google Drive!');
      // Clean up URL safely using navigate
      navigate('/drive', { replace: true });
    } else if (queryParams.get('error') === 'true') {
      toast.error('Failed to connect to Google Drive.');
      navigate('/drive', { replace: true });
    }
  }, [location]);

  const checkConnectionStatus = async () => {
    try {
      const response = await api.get('/api/drive/status');
      setIsConnected(response.data.connected);
      if (response.data.connected) {
        fetchResources();
      }
    } catch (error) {
      console.error('Failed to check drive status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      const [quizRes, audioRes] = await Promise.all([
        api.get('/api/tools/quiz/results'),
        api.get('/api/audio/')
      ]);
      setQuizzes(quizRes.data);
      if (quizRes.data.length > 0) setSelectedQuizId(quizRes.data[0].id);
      
      setAudioFiles(audioRes.data);
      if (audioRes.data.length > 0) setSelectedAudioId(audioRes.data[0].id);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    }
  };

  const handleConnect = async () => {
    try {
      const response = await api.get('/api/drive/auth-url');
      window.location.href = response.data.auth_url;
    } catch (error) {
      toast.error('Failed to get authorization URL');
    }
  };

  const handleExport = async (type) => {
    setExportLoading(type);
    try {
      let response;
      if (type === 'summary') {
        if (!summaryDocName || !summaryText) {
          toast.error("Please provide both name and text");
          return;
        }
        response = await api.post('/api/drive/export/summary', {
          document_name: summaryDocName,
          summary_text: summaryText
        });
      } else if (type === 'plan') {
        if (!planDocName || !planText) {
          toast.error("Please provide both name and text");
          return;
        }
        response = await api.post('/api/drive/export/study-plan', {
          document_name: planDocName,
          plan_text: planText
        });
      } else if (type === 'quiz') {
        if (!selectedQuizId) return;
        response = await api.post('/api/drive/export/quiz-report', {
          quiz_result_id: selectedQuizId
        });
      } else if (type === 'audio') {
        if (!selectedAudioId) return;
        response = await api.post('/api/drive/export/audio', {
          audio_id: selectedAudioId
        });
      }
      
      if (response && response.data.success) {
        toast.success(
          <span>
            Export successful! <a href={response.data.drive_link} target="_blank" rel="noopener noreferrer" className="underline font-bold">View in Drive</a>
          </span>,
          { duration: 5000 }
        );
      }
    } catch (error) {
      console.error(`Export failed for ${type}:`, error);
      toast.error(error.response?.data?.detail || 'Failed to export to Drive');
    } finally {
      setExportLoading(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-gray-50"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-8 transition-colors duration-200">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center sm:justify-start">
            <Cloud className="w-8 h-8 mr-3 text-primary dark:text-indigo-400" /> Google Drive Integration
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Connect your Google Drive to export study materials seamlessly.</p>
        </header>

        {/* Section 1 - Connection Status */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 sm:p-8 shadow-md text-center sm:text-left flex flex-col sm:flex-row items-center justify-between transition-colors duration-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Connection Status</h2>
            {isConnected ? (
              <p className="text-green-600 dark:text-green-500 font-medium flex items-center justify-center sm:justify-start">
                <CheckCircle className="w-5 h-5 mr-2" /> Connected to Google Drive
              </p>
            ) : (
              <p className="text-red-500 dark:text-red-400 font-medium flex items-center justify-center sm:justify-start">
                <XCircle className="w-5 h-5 mr-2" /> Not Connected
              </p>
            )}
          </div>
          <div className="mt-6 sm:mt-0">
            {!isConnected ? (
              <button
                onClick={handleConnect}
                className="px-6 py-3 bg-primary hover:bg-yellow-700 text-white text-white font-medium rounded-lg shadow-sm transition-colors"
              >
                Connect Google Drive
              </button>
            ) : (
              <span className="px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50 rounded-lg text-sm font-medium">
                Active
              </span>
            )}
          </div>
        </div>

        {/* Section 2 - Export Center */}
        {isConnected && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Export Center</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              
              {/* Card 1 - Export Summary */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center mb-4">
                  <FileText className="w-5 h-5 mr-2 text-primary dark:text-indigo-400" /> Export Summary
                </h3>
                <input
                  type="text"
                  placeholder="Document Name (e.g. DBMS Unit 1)"
                  value={summaryDocName}
                  onChange={(e) => setSummaryDocName(e.target.value)}
                  className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                />
                <textarea
                  placeholder="Paste your summary here..."
                  value={summaryText}
                  onChange={(e) => setSummaryText(e.target.value)}
                  className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg px-3 py-2 h-32 resize-none mb-4 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                />
                <button
                  onClick={() => handleExport('summary')}
                  disabled={exportLoading === 'summary'}
                  className="mt-auto flex items-center justify-center w-full py-2 bg-primary hover:bg-yellow-700 text-white text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {exportLoading === 'summary' ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5 mr-2" />}
                  Export to Drive
                </button>
              </div>

              {/* Card 2 - Export Study Plan */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center mb-4">
                  <Clock className="w-5 h-5 mr-2 text-emerald-500 dark:text-emerald-400" /> Export Study Plan
                </h3>
                <input
                  type="text"
                  placeholder="Subject / Topic Name"
                  value={planDocName}
                  onChange={(e) => setPlanDocName(e.target.value)}
                  className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                />
                <textarea
                  placeholder="Paste your study plan here..."
                  value={planText}
                  onChange={(e) => setPlanText(e.target.value)}
                  className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg px-3 py-2 h-32 resize-none mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                />
                <button
                  onClick={() => handleExport('plan')}
                  disabled={exportLoading === 'plan'}
                  className="mt-auto flex items-center justify-center w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {exportLoading === 'plan' ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5 mr-2" />}
                  Export to Drive
                </button>
              </div>

              {/* Card 3 - Export Quiz Report */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center mb-4">
                  <AlertCircle className="w-5 h-5 mr-2 text-orange-500 dark:text-orange-400" /> Export Quiz Report
                </h3>
                {quizzes.length > 0 ? (
                  <>
                    <select
                      value={selectedQuizId}
                      onChange={(e) => setSelectedQuizId(e.target.value)}
                      className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                    >
                      {quizzes.map(q => (
                        <option key={q.id} value={q.id}>
                          {q.quiz_type} - {q.score_percentage}% - {new Date(q.created_at).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleExport('quiz')}
                      disabled={exportLoading === 'quiz'}
                      className="mt-auto flex items-center justify-center w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {exportLoading === 'quiz' ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5 mr-2" />}
                      Export to Drive
                    </button>
                  </>
                ) : (
                  <p className="text-gray-500 italic">No quiz results found.</p>
                )}
              </div>

              {/* Card 4 - Export Audio */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center mb-4">
                  <Volume2 className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" /> Export Audio Overview
                </h3>
                {audioFiles.length > 0 ? (
                  <>
                    <select
                      value={selectedAudioId}
                      onChange={(e) => setSelectedAudioId(e.target.value)}
                      className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-sm"
                    >
                      {audioFiles.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.filename} ({a.duration_seconds}s)
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleExport('audio')}
                      disabled={exportLoading === 'audio'}
                      className="mt-auto flex items-center justify-center w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {exportLoading === 'audio' ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5 mr-2" />}
                      Export to Drive
                    </button>
                  </>
                ) : (
                  <p className="text-gray-500 italic">No audio files found.</p>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DriveIntegrationPage;
