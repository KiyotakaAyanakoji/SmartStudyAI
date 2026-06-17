import React, { useState, useEffect } from 'react';
import { FileText, BookOpen, Clock, AlertCircle, Loader2, Send, CheckSquare, Square, Volume2, UploadCloud } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../services/api';

const StudyToolsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  
  const [loadingAction, setLoadingAction] = useState(null);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState(null);

  const [question, setQuestion] = useState('');
  const [qaLoading, setQaLoading] = useState(false);
  const [qaResult, setQaResult] = useState(null);
  const [audioGenerating, setAudioGenerating] = useState(false);
  const [questionType, setQuestionType] = useState('all');

  // Quiz State
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizQuestionCount, setQuizQuestionCount] = useState(5);
  const [importantQuestionCount, setImportantQuestionCount] = useState(5);
  
  const [quizResult, setQuizResult] = useState(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  const [exportLoading, setExportLoading] = useState(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await api.get('/api/documents/');
        setDocuments(response.data);
        if (response.data.length > 0) {
          setSelectedDocIds([response.data[0].id]);
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
      }
    };
    fetchDocuments();
  }, []);

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

  const handleAction = async (action, overrideQuestionType = null) => {
    if (selectedDocIds.length === 0) return;
    
    setLoadingAction(action);
    setResults(null);
    setActiveTab(action);
    setSelectedAnswers({});
    setQuizResult(null);
    
    try {
      let response;
      if (action === 'summarize') {
        response = await api.post('/api/tools/summarize', { document_ids: selectedDocIds });
        setResults({ type: 'summarize', data: response.data.summary });
      } else if (action === 'quiz') {
        console.log(`Sending quiz request with count: ${quizQuestionCount}, docs:`, selectedDocIds);
        response = await api.post('/api/tools/quiz', { document_ids: selectedDocIds, num_questions: quizQuestionCount });
        console.log('Quiz response:', response.data);
        setResults({ type: 'quiz', data: response.data.quiz });
      } else if (action === 'study-plan') {
        response = await api.post('/api/tools/study-plan', { document_ids: selectedDocIds, days: 7 });
        setResults({ type: 'study-plan', data: response.data.plan });
      } else if (action === 'important-questions') {
        console.log('Generating all important questions for docs:', selectedDocIds);
        // Always generate 'all' type, no num_questions needed
        response = await api.post('/api/tools/important-questions', { document_ids: selectedDocIds, question_type: 'all' });
        setResults({ type: 'important-questions', data: response.data.questions, question_type: 'all' });
        setQuestionType('all');
      } else if (action === 'analyze-paper') {
        response = await api.post('/api/tools/analyze-paper', { document_id: selectedDocIds[0] });
        setResults({ type: 'analyze-paper', data: response.data.analysis });
      }
    } catch (error) {
      console.error(`Error with action ${action}:`, error);
      toast.error(error.response?.data?.detail || 'An error occurred while generating content. Please try again.');
      setResults({ type: 'error', data: error.response?.data?.detail || 'An error occurred while generating content. Please try again.' });
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
      toast.error(error.response?.data?.detail || 'An error occurred. Please try again.');
    } finally {
      setQaLoading(false);
    }
  };

  const handleGenerateAudioFromSummary = async () => {
    if (selectedDocIds.length === 0) return;
    setAudioGenerating(true);
    const loadingToast = toast.loading('Generating conversational audio overview... This might take a minute.');
    try {
      await api.post('/api/audio/generate', { document_ids: selectedDocIds });
      toast.success('Audio generated successfully! Check the Audio tab to listen.', { id: loadingToast });
    } catch (error) {
      console.error('Error generating audio:', error);
      toast.error(error.response?.data?.detail || 'Failed to generate audio', { id: loadingToast });
    } finally {
      setAudioGenerating(false);
    }
  };

  const handleQuizAnswer = (qIndex, optionKey) => {
    if (quizResult) return; // Prevent changing answers after submit
    setSelectedAnswers(prev => ({ ...prev, [qIndex]: optionKey }));
  };

  const handleQuizSubmit = async () => {
    if (!results || results.type !== 'quiz' || !results.data) return;
    
    if (Object.keys(selectedAnswers).length < results.data.length) {
      toast.error('Please answer all questions before submitting.');
      return;
    }
    
    setSubmittingQuiz(true);
    try {
      const answersList = results.data.map((_, idx) => selectedAnswers[idx]);
      const response = await api.post('/api/tools/quiz/submit', {
        document_ids: selectedDocIds,
        quiz_type: 'mcq',
        answers: answersList,
        questions: results.data
      });
      setQuizResult(response.data);
      toast.success('Quiz submitted successfully!');
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz.');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleExportToDrive = async (type) => {
    setExportLoading(type);
    try {
      let response;
      if (type === 'summary') {
        const docName = documents.find(d => d.id === selectedDocIds[0])?.title || 'Document';
        response = await api.post('/api/drive/export/summary', {
          document_name: docName,
          summary_text: results.data
        });
      } else if (type === 'study-plan') {
        const docName = documents.find(d => d.id === selectedDocIds[0])?.title || 'Document';
        response = await api.post('/api/drive/export/study-plan', {
          document_name: docName,
          plan_text: results.data
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
      toast.error(error.response?.data?.detail || 'Failed to export to Drive. Are you connected?');
    } finally {
      setExportLoading(null);
    }
  };

  const renderResults = () => {
    if (!results) return null;

    if (results.type === 'error') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
          <p className="text-red-700">{results.data}</p>
        </div>
      );
    }

    if (results.type === 'summarize') {
      const points = results.data.split('\n').filter(line => line.trim().length > 0);
      return (
        <div className="bg-white border-l-4 border-l-primary border-t border-r border-b border-gray-200 rounded-r-lg p-6 mt-6 shadow-md">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Document Summary</h3>
          <ul className="space-y-2 mb-6">
            {points.map((point, idx) => (
              <li key={idx} className="text-gray-600 leading-relaxed">
                {point.startsWith('*') || point.startsWith('-') ? point.substring(1).trim() : point}
              </li>
            ))}
          </ul>
          
          <div className="pt-4 border-t border-gray-200 flex flex-wrap gap-3">
            <button
              onClick={handleGenerateAudioFromSummary}
              disabled={audioGenerating}
              className="flex items-center space-x-2 py-2 px-4 bg-primary hover:bg-yellow-700 text-white text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {audioGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
              <span>{audioGenerating ? 'Generating Audio...' : 'Generate Audio from Summary'}</span>
            </button>
            <button
              onClick={() => handleExportToDrive('summary')}
              disabled={exportLoading === 'summary'}
              className="flex items-center space-x-2 py-2 px-4 bg-secondary hover:bg-teal-700 text-white text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {exportLoading === 'summary' ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              <span>Export Summary to Drive</span>
            </button>
          </div>
        </div>
      );
    }

    if (results.type === 'quiz') {
      return (
        <div className="space-y-6 mt-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Generated Quiz</h3>
          {results.data.map((q, idx) => (
            <div key={idx} className="bg-white border-l-4 border-l-primary border-t border-r border-b border-gray-200 rounded-r-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-lg text-gray-900 mb-4">{idx + 1}. {q.question}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(q.options)
                  .filter(([_, value]) => value !== null && value !== undefined)
                  .map(([key, value]) => {
                  const isSelected = selectedAnswers[idx] === key;
                  const isCorrect = key === q.correct_answer;
                  const showResult = quizResult !== null;
                  
                  let btnClass = "text-left p-3 rounded-md border transition-colors ";
                  
                  if (!showResult) {
                    if (isSelected) {
                      btnClass += "border-primary bg-indigo-50 text-primary font-medium";
                    } else {
                      btnClass += "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700";
                    }
                  } else {
                    if (isCorrect) {
                      btnClass += "border-green-400 bg-green-50 text-green-800";
                    } else if (isSelected && !isCorrect) {
                      btnClass += "border-red-400 bg-red-50 text-red-800";
                    } else {
                      btnClass += "border-gray-200 bg-white text-gray-400 opacity-50";
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

          {!quizResult ? (
            <div className="flex justify-end mt-6">
              <button
                onClick={handleQuizSubmit}
                disabled={submittingQuiz || Object.keys(selectedAnswers).length < results.data.length}
                className="px-6 py-2 bg-primary hover:bg-yellow-700 text-white text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {submittingQuiz ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Submit Quiz'}
              </button>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-md mt-6">
              <h4 className="text-2xl font-bold text-gray-900 mb-4">Quiz Results</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-center">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Score</p>
                  <p className="text-2xl font-bold text-primary">{quizResult.score_percentage.toFixed(0)}%</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Correct</p>
                  <p className="text-2xl font-bold text-green-600">{quizResult.correct_answers}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Incorrect</p>
                  <p className="text-2xl font-bold text-red-500">{quizResult.total_questions - quizResult.correct_answers}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{quizResult.total_questions}</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-bold text-green-700 mb-2 flex items-center"><CheckCircle className="w-4 h-4 mr-1" /> Strong Topics</h5>
                  {quizResult.strong_topics && quizResult.strong_topics.length > 0 ? (
                    <ul className="list-disc pl-5 text-gray-700">
                      {quizResult.strong_topics.map((topic, i) => <li key={i}>{topic}</li>)}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic">None identified.</p>
                  )}
                </div>
                <div>
                  <h5 className="font-bold text-red-700 mb-2 flex items-center"><AlertCircle className="w-4 h-4 mr-1" /> Weak Topics</h5>
                  {quizResult.weak_topics && quizResult.weak_topics.length > 0 ? (
                    <ul className="list-disc pl-5 text-gray-700">
                      {quizResult.weak_topics.map((topic, i) => <li key={i}>{topic}</li>)}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic">None identified.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (results.type === 'study-plan') {
      const days = results.data.split(/(?=Day \d+:)/i).filter(d => d.trim().length > 0);
      return (
        <div className="space-y-4 mt-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">7-Day Study Plan</h3>
          {days.length > 0 ? (
            days.map((day, idx) => (
              <div key={idx} className="bg-white border-l-4 border-l-secondary border-t border-r border-b border-gray-200 rounded-r-lg p-5 shadow-sm">
                <p className="text-gray-600 whitespace-pre-wrap">{day.trim()}</p>
              </div>
            ))
          ) : (
             <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <p className="text-gray-600 whitespace-pre-wrap">{results.data}</p>
            </div>
          )}
          <div className="pt-4 mt-4 border-t border-gray-200">
            <button
              onClick={() => handleExportToDrive('study-plan')}
              disabled={exportLoading === 'study-plan'}
              className="flex items-center space-x-2 py-2 px-4 bg-secondary hover:bg-teal-700 text-white text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {exportLoading === 'study-plan' ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              <span>Export Study Plan to Drive</span>
            </button>
          </div>
        </div>
      );
    }

    if (results.type === 'important-questions') {
      const qTabs = [
        { id: 'all', label: 'All' },
        { id: '2_mark', label: '2 Mark' },
        { id: '5_mark', label: '5 Mark' },
        { id: '10_mark', label: '10 Mark' },
        { id: 'viva', label: 'Viva' }
      ];

      const displayQuestions = Array.isArray(results.data) 
        ? (questionType === 'all' 
            ? results.data 
            : results.data.filter(q => q.marks == questionType.replace('_mark', '') || q.marks === questionType))
        : [];

      return (
        <div className="bg-white border-l-4 border-l-accent border-t border-r border-b border-gray-200 rounded-r-lg p-6 mt-6 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 sm:mb-0">Important Questions</h3>
            <div className="flex flex-wrap bg-gray-50 rounded-lg p-1 border border-gray-200">
              {qTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setQuestionType(tab.id)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    questionType === tab.id
                      ? 'bg-primary text-white shadow'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            {displayQuestions.length > 0 ? displayQuestions.map((q, idx) => (
              <div key={idx} className="p-4 bg-white rounded-md border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-gray-900 font-medium">{q.question}</p>
                  {q.marks && (
                    <span className="ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-primary">
                      {q.marks === 'viva' ? 'Viva' : `${q.marks} Marks`}
                    </span>
                  )}
                </div>
                {q.expected_answer && <p className="text-sm text-gray-600 mt-2"><span className="font-semibold text-gray-700">Expected:</span> {q.expected_answer}</p>}
                {q.key_points && <p className="text-sm text-gray-600 mt-2"><span className="font-semibold text-gray-700">Key Points:</span> {q.key_points}</p>}
                {q.outline && <p className="text-sm text-gray-600 mt-2"><span className="font-semibold text-gray-700">Outline:</span> {q.outline}</p>}
              </div>
            )) : (
              <div className="p-4 bg-white rounded-md border border-gray-200 text-gray-600 whitespace-pre-wrap">
                {Array.isArray(results.data) ? 'No questions available for this type.' : (typeof results.data === 'string' ? results.data : JSON.stringify(results.data))}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (results.type === 'analyze-paper') {
      const data = results.data;
      return (
        <div className="space-y-6 mt-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Paper Analysis</h3>
          <p className="text-gray-600 mb-6">AI-generated insights based on the selected previous year paper.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center"><CheckSquare className="w-5 h-5 mr-2 text-primary"/> Frequently Asked Topics</h4>
              <div className="flex flex-wrap gap-2">
                {data.frequently_asked_topics?.map((topic, i) => (
                  <span key={i} className="px-3 py-1 bg-indigo-50 text-primary border border-indigo-100 rounded-full text-sm">
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center"><BookOpen className="w-5 h-5 mr-2 text-secondary"/> Important Chapters</h4>
              <ol className="list-decimal pl-5 space-y-1 text-gray-600">
                {data.important_chapters?.map((ch, i) => (
                  <li key={i}>{ch}</li>
                ))}
              </ol>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center"><AlertCircle className="w-5 h-5 mr-2 text-accent"/> Exam Trends</h4>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                {data.exam_trends?.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center"><CheckSquare className="w-5 h-5 mr-2 text-purple-600"/> Preparation Tips</h4>
              <div className="space-y-3">
                {data.preparation_tips?.map((tip, i) => (
                  <div key={i} className="bg-gray-50 p-3 rounded border border-gray-200 text-sm text-gray-700">
                    {tip}
                  </div>
                ))}
              </div>
            </div>
            
            {data.high_weightage_concepts && (
              <div className="md:col-span-2 bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">High Weightage Concepts</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.high_weightage_concepts.map((concept, i) => (
                    <div key={i} className="bg-gray-50 p-3 rounded-lg border-l-4 border-primary shadow-sm text-gray-900 text-sm">
                      {concept}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-6 transition-colors duration-200">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">AI Study Tools</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-3 text-lg max-w-2xl">Leverage Gemini AI to summarize, quiz, and plan your studying across multiple documents.</p>
      </div>

      {/* Multi-Document Selection Section */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-8 shadow-md transition-colors duration-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Select Documents</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Choose one or more documents to analyze</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 dark:bg-gray-900 text-primary dark:text-indigo-300 border border-indigo-200 dark:border-gray-700">
              {selectedDocIds.length} selected
            </span>
            <button 
              onClick={handleSelectAll}
              disabled={loadingAction !== null || documents.length === 0}
              className="text-sm font-medium text-primary hover:text-indigo-700 transition-colors disabled:opacity-50"
            >
              Select All
            </button>
            <span className="text-gray-300">|</span>
            <button 
              onClick={handleClearAll}
              disabled={loadingAction !== null || selectedDocIds.length === 0}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="max-h-60 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
          {documents.length > 0 ? (
            documents.map(doc => {
              const isSelected = selectedDocIds.includes(doc.id);
              return (
                <div 
                  key={doc.id}
                  onClick={() => {
                    if (loadingAction === null) handleToggleDoc(doc.id);
                  }}
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 border-primary dark:border-indigo-500' 
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  } ${loadingAction !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex-shrink-0 mr-4">
                    {isSelected ? (
                      <CheckSquare className="h-5 w-5 text-primary dark:text-indigo-400" />
                    ) : (
                      <Square className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                      {doc.filename}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {doc.page_count} pages • Uploaded {format(new Date(doc.upload_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              No documents available. Upload some documents first.
            </div>
          )}
        </div>
      </div>

      {/* Tool Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => handleAction('summarize')}
          disabled={selectedDocIds.length === 0 || loadingAction !== null}
          className={`group flex items-center justify-center space-x-2 py-4 px-4 rounded-xl border shadow-sm ${activeTab === 'summarize' ? 'bg-primary dark:bg-indigo-600 border-primary dark:border-indigo-600 text-white' : 'bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-700'} transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loadingAction === 'summarize' ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5 group-hover:scale-110 transition-transform" />}
          <span className="font-medium">Summarize</span>
        </button>

        <div className="flex flex-col space-y-2">
          <button
            onClick={() => handleAction('quiz')}
            disabled={selectedDocIds.length === 0 || loadingAction !== null}
            className={`group flex items-center justify-center space-x-2 py-4 px-4 rounded-xl border shadow-sm ${activeTab === 'quiz' ? 'bg-secondary dark:bg-cyan-600 border-secondary dark:border-cyan-600 text-white' : 'bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-700'} transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loadingAction === 'quiz' ? <Loader2 className="h-5 w-5 animate-spin" /> : <AlertCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />}
            <span className="font-medium">Generate Quiz</span>
          </button>
          {activeTab === 'quiz' && (
            <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-200 mt-2 shadow-sm">
              <label className="text-xs font-medium text-gray-700">Number of Questions</label>
              <div className="flex items-center space-x-2">
                <input 
                  type="number" 
                  value={quizQuestionCount} 
                  onChange={(e) => setQuizQuestionCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))} 
                  min="1" max="20"
                  className="bg-white text-gray-900 text-sm w-16 px-2 py-1 rounded border border-gray-300 focus:outline-none focus:border-secondary text-center"
                />
                <button
                  onClick={() => handleAction('quiz')}
                  disabled={loadingAction !== null}
                  className="bg-secondary hover:bg-teal-700 text-white text-white text-xs px-2 py-1.5 rounded transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => handleAction('study-plan')}
          disabled={selectedDocIds.length === 0 || loadingAction !== null}
          className={`group flex items-center justify-center space-x-2 py-4 px-4 rounded-xl border shadow-sm ${activeTab === 'study-plan' ? 'bg-primary dark:bg-indigo-600 border-primary dark:border-indigo-600 text-white' : 'bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-700'} transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loadingAction === 'study-plan' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Clock className="h-5 w-5 group-hover:scale-110 transition-transform" />}
          <span className="font-medium">Study Plan</span>
        </button>

        <div className="flex flex-col space-y-2">
          <button
            onClick={() => handleAction('important-questions')}
            disabled={selectedDocIds.length === 0 || loadingAction !== null}
            className={`group flex items-center justify-center space-x-2 py-4 px-4 rounded-xl border shadow-sm ${activeTab === 'important-questions' ? 'bg-accent dark:bg-amber-600 border-accent dark:border-amber-600 text-white' : 'bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-700'} transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loadingAction === 'important-questions' ? <Loader2 className="h-5 w-5 animate-spin" /> : <BookOpen className="h-5 w-5 group-hover:scale-110 transition-transform" />}
            <span className="font-medium">Important Questions</span>
          </button>
          {/* Important Questions Input Removed */}
        </div>
        
        {selectedDocIds.length === 1 && documents.find(d => d.id === selectedDocIds[0])?.document_type === 'previous_year_paper' && (
          <button
            onClick={() => handleAction('analyze-paper')}
            disabled={loadingAction !== null}
            className={`group flex items-center justify-center space-x-2 py-4 px-4 rounded-xl border shadow-sm sm:col-span-2 lg:col-span-4 ${activeTab === 'analyze-paper' ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-700'} transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loadingAction === 'analyze-paper' ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckSquare className="h-5 w-5 group-hover:scale-110 transition-transform" />}
            <span className="font-medium">Paper Analysis</span>
          </button>
        )}
      </div>

      {selectedDocIds.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-8 flex items-center justify-center">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mr-2" />
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">Select at least one document to use the study tools.</p>
        </div>
      )}

      {renderResults()}

      {/* Q&A Section */}
      <div className="mt-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-md overflow-hidden transition-colors duration-200">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black transition-colors duration-200">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mr-2">Ask</span> anything about your documents
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Our AI searches through your vector database to find the right context.</p>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleAskQuestion} className="flex space-x-3 mb-6">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., What is gradient descent?"
              className="flex-grow bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary transition-shadow shadow-sm"
              disabled={qaLoading}
            />
            <button
              type="submit"
              disabled={!question.trim() || qaLoading}
              className="px-6 py-3 bg-primary hover:bg-yellow-700 text-white text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center shadow-sm"
            >
              {qaLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </form>

          {qaResult && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Answer</h4>
              <p className="text-gray-900 dark:text-gray-200 leading-relaxed text-lg whitespace-pre-wrap">{qaResult.answer}</p>
              
              {qaResult.sources && qaResult.sources.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Sources</h4>
                  <div className="flex flex-wrap gap-2">
                    {qaResult.sources.map((src, idx) => (
                      <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 shadow-sm">
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
