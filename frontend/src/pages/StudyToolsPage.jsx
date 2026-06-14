import React, { useState, useEffect } from 'react';
import { FileText, BookOpen, Clock, AlertCircle, Loader2, Send } from 'lucide-react';
import api from '../services/api';

const StudyToolsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  
  const [loadingAction, setLoadingAction] = useState(null);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState(null);

  const [question, setQuestion] = useState('');
  const [qaLoading, setQaLoading] = useState(false);
  const [qaResult, setQaResult] = useState(null);

  // Quiz State
  const [selectedAnswers, setSelectedAnswers] = useState({});

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await api.get('/api/documents/');
        setDocuments(response.data);
        if (response.data.length > 0) {
          setSelectedDocId(response.data[0].id);
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
      }
    };
    fetchDocuments();
  }, []);

  const handleAction = async (action) => {
    if (!selectedDocId) return;
    
    setLoadingAction(action);
    setResults(null);
    setActiveTab(action);
    setSelectedAnswers({});
    
    try {
      let response;
      if (action === 'summarize') {
        response = await api.post('/api/tools/summarize', { document_id: selectedDocId });
        setResults({ type: 'summarize', data: response.data.summary });
      } else if (action === 'quiz') {
        response = await api.post('/api/tools/quiz', { document_id: selectedDocId, num_questions: 5 });
        setResults({ type: 'quiz', data: response.data.quiz });
      } else if (action === 'study-plan') {
        response = await api.post('/api/tools/study-plan', { document_id: selectedDocId, days: 7 });
        setResults({ type: 'study-plan', data: response.data.plan });
      } else if (action === 'important-questions') {
        response = await api.post('/api/tools/important-questions', { document_id: selectedDocId });
        setResults({ type: 'important-questions', data: response.data.questions });
      }
    } catch (error) {
      console.error(`Error with action ${action}:`, error);
      setResults({ type: 'error', data: 'An error occurred while generating content. Please try again.' });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setQaLoading(true);
    try {
      const response = await api.post('/api/qa/ask', { question: question });
      setQaResult(response.data);
    } catch (error) {
      console.error('Error asking question:', error);
      setQaResult({ answer: 'An error occurred. Please try again later.', sources: [] });
    } finally {
      setQaLoading(false);
    }
  };

  const handleQuizAnswer = (qIndex, optionKey) => {
    setSelectedAnswers(prev => ({ ...prev, [qIndex]: optionKey }));
  };

  const renderResults = () => {
    if (!results) return null;

    if (results.type === 'error') {
      return (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mt-6">
          <p className="text-red-200">{results.data}</p>
        </div>
      );
    }

    if (results.type === 'summarize') {
      const points = results.data.split('\n').filter(line => line.trim().length > 0);
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mt-6">
          <h3 className="text-xl font-bold text-white mb-4">Document Summary</h3>
          <ul className="space-y-2">
            {points.map((point, idx) => (
              <li key={idx} className="text-slate-300 leading-relaxed">
                {point.startsWith('*') || point.startsWith('-') ? point.substring(1).trim() : point}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    if (results.type === 'quiz') {
      return (
        <div className="space-y-6 mt-6">
          <h3 className="text-xl font-bold text-white mb-4">Generated Quiz</h3>
          {results.data.map((q, idx) => (
            <div key={idx} className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <p className="text-lg text-white mb-4">{idx + 1}. {q.question}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(q.options).map(([key, value]) => {
                  const isSelected = selectedAnswers[idx] === key;
                  const isCorrect = key === q.correct_answer;
                  const showResult = selectedAnswers[idx] !== undefined;
                  
                  let btnClass = "text-left p-3 rounded-md border transition-colors ";
                  
                  if (!showResult) {
                    btnClass += "border-slate-600 bg-slate-700 hover:bg-slate-600 text-slate-200";
                  } else {
                    if (isCorrect) {
                      btnClass += "border-green-500 bg-green-900/30 text-green-200";
                    } else if (isSelected && !isCorrect) {
                      btnClass += "border-red-500 bg-red-900/30 text-red-200";
                    } else {
                      btnClass += "border-slate-700 bg-slate-800 text-slate-400 opacity-50";
                    }
                  }

                  return (
                    <button
                      key={key}
                      onClick={() => handleQuizAnswer(idx, key)}
                      disabled={showResult}
                      className={btnClass}
                    >
                      <span className="font-bold mr-2">{key})</span> {value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (results.type === 'study-plan') {
      const days = results.data.split(/(?=Day \d+:)/i).filter(d => d.trim().length > 0);
      return (
        <div className="space-y-4 mt-6">
          <h3 className="text-xl font-bold text-white mb-4">7-Day Study Plan</h3>
          {days.length > 0 ? (
            days.map((day, idx) => (
              <div key={idx} className="bg-slate-800 border border-slate-700 rounded-lg p-5">
                <p className="text-slate-300 whitespace-pre-wrap">{day.trim()}</p>
              </div>
            ))
          ) : (
             <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <p className="text-slate-300 whitespace-pre-wrap">{results.data}</p>
            </div>
          )}
        </div>
      );
    }

    if (results.type === 'important-questions') {
      const questions = results.data.split('\n').filter(line => line.trim().length > 0);
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mt-6">
          <h3 className="text-xl font-bold text-white mb-4">Important Questions</h3>
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={idx} className="p-4 bg-slate-700/50 rounded-md border border-slate-600">
                <p className="text-slate-200">{q}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">AI Study Tools</h1>
        <p className="text-slate-400 mt-2">Leverage Gemini AI to summarize, quiz, and plan your studying.</p>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8 shadow-xl">
        <label className="block text-sm font-medium text-slate-300 mb-2">Select a Document to analyze</label>
        <select
          className="w-full md:w-1/2 bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={selectedDocId}
          onChange={(e) => setSelectedDocId(e.target.value)}
          disabled={loadingAction !== null}
        >
          {documents.map(doc => (
            <option key={doc.id} value={doc.id}>{doc.filename}</option>
          ))}
          {documents.length === 0 && <option value="">No documents available</option>}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => handleAction('summarize')}
          disabled={!selectedDocId || loadingAction !== null}
          className={`flex items-center justify-center space-x-2 py-4 px-4 rounded-lg border ${activeTab === 'summarize' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loadingAction === 'summarize' ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
          <span className="font-medium">Summarize</span>
        </button>

        <button
          onClick={() => handleAction('quiz')}
          disabled={!selectedDocId || loadingAction !== null}
          className={`flex items-center justify-center space-x-2 py-4 px-4 rounded-lg border ${activeTab === 'quiz' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loadingAction === 'quiz' ? <Loader2 className="h-5 w-5 animate-spin" /> : <AlertCircle className="h-5 w-5" />}
          <span className="font-medium">Generate Quiz</span>
        </button>

        <button
          onClick={() => handleAction('study-plan')}
          disabled={!selectedDocId || loadingAction !== null}
          className={`flex items-center justify-center space-x-2 py-4 px-4 rounded-lg border ${activeTab === 'study-plan' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loadingAction === 'study-plan' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Clock className="h-5 w-5" />}
          <span className="font-medium">Study Plan</span>
        </button>

        <button
          onClick={() => handleAction('important-questions')}
          disabled={!selectedDocId || loadingAction !== null}
          className={`flex items-center justify-center space-x-2 py-4 px-4 rounded-lg border ${activeTab === 'important-questions' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loadingAction === 'important-questions' ? <Loader2 className="h-5 w-5 animate-spin" /> : <BookOpen className="h-5 w-5" />}
          <span className="font-medium">Important Questions</span>
        </button>
      </div>

      {renderResults()}

      {/* Q&A Section */}
      <div className="mt-12 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 bg-slate-800/50">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent mr-2">Ask</span> anything about your documents
          </h2>
          <p className="text-slate-400 mt-1">Our AI searches through your vector database to find the right context.</p>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleAskQuestion} className="flex space-x-3 mb-6">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., What is gradient descent?"
              className="flex-grow bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={qaLoading}
            />
            <button
              type="submit"
              disabled={!question.trim() || qaLoading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center"
            >
              {qaLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </form>

          {qaResult && (
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Answer</h4>
              <p className="text-slate-200 leading-relaxed text-lg whitespace-pre-wrap">{qaResult.answer}</p>
              
              {qaResult.sources && qaResult.sources.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-700">
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Sources</h4>
                  <div className="flex flex-wrap gap-2">
                    {qaResult.sources.map((src, idx) => (
                      <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-300 border border-slate-600">
                        {src.document} (Page {src.page})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default StudyToolsPage;
