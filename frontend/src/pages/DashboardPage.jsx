import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, MessageCircle, CheckSquare, Target, 
  Brain, BarChart3, Headphones, Cloud, MessageSquare,
  Clock, FileIcon, ChevronRight
} from 'lucide-react';
import api from '../services/api';

const DashboardPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/api/analytics/dashboard');
        setData(response.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  const userName = user?.full_name || user?.email?.split('@')[0] || 'User';

  const quickActions = [
    { title: 'Upload Documents', desc: 'Add new study materials', icon: <FileText className="w-8 h-8" />, path: '/documents', color: 'text-blue-500' },
    { title: 'AI Study Tools', desc: 'Generate quizzes & notes', icon: <Brain className="w-8 h-8" />, path: '/study-tools', color: 'text-purple-500' },
    { title: 'View Analytics', desc: 'Track your progress', icon: <BarChart3 className="w-8 h-8" />, path: '/analytics', color: 'text-green-500' },
    { title: 'Audio Overview', desc: 'Listen to your notes', icon: <Headphones className="w-8 h-8" />, path: '/audio', color: 'text-orange-500' },
    { title: 'Google Drive', desc: 'Import from cloud', icon: <Cloud className="w-8 h-8" />, path: '/drive', color: 'text-sky-500' },
    { title: 'Give Feedback', desc: 'Help us improve', icon: <MessageSquare className="w-8 h-8" />, path: '/feedback', color: 'text-rose-500' },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl mb-8"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  const stats = data || {
    total_documents: 0,
    total_questions_asked: 0,
    total_quizzes_completed: 0,
    average_readiness_score: 0,
    recent_activity: [],
    recent_documents: []
  };

  const recentDocs = stats.recent_documents || stats.documents || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white dark:bg-black transition-colors duration-200 min-h-screen">
      
      {/* Section 1 - Welcome Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-[#B8860B] dark:text-[#B8860B] tracking-tight mb-2">
          Welcome back, {userName}! 👋
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Here's your study progress today
        </p>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-500 mt-2">
          {currentDate}
        </p>
      </div>

      {/* Section 2 - Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center">
          <div className="p-3 rounded-lg bg-[#B8860B]/10 mr-4">
            <FileText className="w-6 h-6 text-[#B8860B]" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Documents Uploaded</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_documents}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center">
          <div className="p-3 rounded-lg bg-[#008080]/10 mr-4">
            <MessageCircle className="w-6 h-6 text-[#008080]" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Questions Asked</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_questions_asked}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center">
          <div className="p-3 rounded-lg bg-[#4F46E5]/10 mr-4">
            <CheckSquare className="w-6 h-6 text-[#4F46E5]" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Quizzes Completed</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_quizzes_completed}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center">
          <div className="p-3 rounded-lg bg-[#F59E0B]/10 mr-4">
            <Target className="w-6 h-6 text-[#F59E0B]" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Readiness Score</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.average_readiness_score}%</p>
          </div>
        </div>
      </div>

      {/* Section 3 - Quick Actions Row */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-[#008080] dark:hover:border-[#008080] transition-all duration-200 group text-left w-full"
            >
              <div className={`mb-4 ${action.color} transform group-hover:scale-110 transition-transform duration-200`}>
                {action.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-1">{action.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">{action.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section 4 - Recent Activity */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex flex-col h-full">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h2>
          
          <div className="flex-grow">
            {stats.recent_activity && stats.recent_activity.length > 0 ? (
              <ul className="space-y-4">
                {stats.recent_activity.slice(0, 5).map((activity, idx) => (
                  <li key={idx} className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <Clock className="w-5 h-5 text-[#008080]" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.description || activity.action}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time_ago || new Date(activity.timestamp).toLocaleString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No activity yet. Start by uploading a document!</p>
                <button onClick={() => navigate('/documents')} className="text-[#B8860B] hover:text-yellow-700 font-medium">
                  Upload now &rarr;
                </button>
              </div>
            )}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Link to="/analytics" className="text-sm font-medium text-[#008080] hover:text-teal-700 flex items-center">
              View all activity <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>

        {/* Section 5 - Documents Breakdown */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex flex-col h-full">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Documents</h2>
          
          <div className="flex-grow">
            {recentDocs.length > 0 ? (
              <ul className="space-y-4">
                {recentDocs.slice(0, 3).map((doc, idx) => (
                  <li key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center overflow-hidden">
                      <FileIcon className="w-8 h-8 text-[#B8860B] flex-shrink-0 mr-3" />
                      <div className="truncate">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{doc.filename || doc.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {doc.page_count || 1} pages &bull; <span className="uppercase text-xs font-semibold text-[#008080]">{doc.type || 'PDF'}</span>
                        </p>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${doc.status === 'processed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                        {doc.status || 'Ready'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 mb-4">You haven't uploaded any documents yet.</p>
                <button onClick={() => navigate('/documents')} className="bg-[#B8860B] text-white px-4 py-2 rounded-md hover:bg-yellow-700 font-medium transition-colors">
                  Upload your first document
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Link to="/documents" className="text-sm font-medium text-[#B8860B] hover:text-yellow-700 flex items-center">
              View all documents <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default DashboardPage;
