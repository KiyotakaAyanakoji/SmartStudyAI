import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  FileText, MessageSquare, ClipboardList, Target, 
  Activity, ArrowRight, Upload, HelpCircle, FileCheck, CheckCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get('/api/analytics/dashboard');
        setAnalytics(response.data);
      } catch (error) {
        console.error('Failed to fetch analytics', error);
        toast.error('Failed to load analytics dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const getIconForActivity = (type) => {
    switch (type) {
      case 'upload': return <Upload className="h-5 w-5 text-blue-500" />;
      case 'question': return <HelpCircle className="h-5 w-5 text-purple-500" />;
      case 'quiz': return <FileCheck className="h-5 w-5 text-green-500" />;
      case 'summary': return <FileText className="h-5 w-5 text-orange-500" />;
      default: return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600 bg-green-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg h-24"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white shadow rounded-lg h-96"></div>
          <div className="bg-white shadow rounded-lg h-96"></div>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8">Learning Analytics</h1>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white dark:bg-black overflow-hidden shadow-sm rounded-lg hover:shadow-md transition-shadow duration-200 border-l-4 border-primary dark:border-indigo-500">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-50 dark:bg-gray-900 rounded-md p-3">
                <FileText className="h-6 w-6 text-primary dark:text-indigo-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Documents</dt>
                  <dd className="text-3xl font-semibold text-gray-900 dark:text-white">{analytics.total_documents}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-black overflow-hidden shadow-sm rounded-lg hover:shadow-md transition-shadow duration-200 border-l-4 border-secondary dark:border-cyan-500">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-cyan-50 dark:bg-gray-900 rounded-md p-3">
                <MessageSquare className="h-6 w-6 text-secondary dark:text-cyan-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Questions Asked</dt>
                  <dd className="text-3xl font-semibold text-gray-900 dark:text-white">{analytics.total_questions_asked}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-black overflow-hidden shadow-sm rounded-lg hover:shadow-md transition-shadow duration-200 border-l-4 border-emerald-500">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-emerald-50 dark:bg-gray-900 rounded-md p-3">
                <ClipboardList className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Quizzes Completed</dt>
                  <dd className="text-3xl font-semibold text-gray-900 dark:text-white">{analytics.total_quizzes_completed}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-black overflow-hidden shadow-sm rounded-lg hover:shadow-md transition-shadow duration-200 border-l-4 border-accent dark:border-amber-500">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-amber-50 dark:bg-gray-900 rounded-md p-3">
                <Target className="h-6 w-6 text-accent dark:text-amber-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Avg Readiness</dt>
                  <dd className="text-3xl font-semibold text-gray-900 dark:text-white">{analytics.average_readiness_score}%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Documents Breakdown Table */}
          <div className="bg-white dark:bg-black shadow-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 transition-colors duration-200">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Documents Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              {analytics.documents_breakdown.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-black">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Document</th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Chunks</th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quizzes</th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg Score</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-black divide-y divide-gray-200 dark:divide-gray-800">
                    {analytics.documents_breakdown.map((doc, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">{doc.filename}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">{doc.chunks}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">{doc.quizzes_taken}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getScoreColor(doc.avg_score)}`}>
                            {doc.avg_score}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">No documents found. Start uploading to see insights!</div>
              )}
            </div>
          </div>
          
          {/* Readiness Score Card */}
          <div className="bg-white dark:bg-black shadow-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-200">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Overall Readiness Score</h3>
            <div className="flex items-center space-x-6">
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="56" fill="transparent" stroke="#e2e8f0" strokeWidth="12" />
                  <circle cx="64" cy="64" r="56" fill="transparent" stroke={analytics.average_readiness_score >= 70 ? "#10b981" : analytics.average_readiness_score >= 50 ? "#f59e0b" : "#ef4444"} strokeWidth="12" strokeDasharray="351.858" strokeDashoffset={351.858 - (351.858 * analytics.average_readiness_score) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                </svg>
                <div className="absolute top-1/2 left-1/2 transform -trangray-x-1/2 -trangray-y-1/2 text-2xl font-bold text-gray-700">
                  {analytics.average_readiness_score}%
                </div>
              </div>
              <div className="flex-1">
                <p className="text-gray-600 mb-2">
                  {analytics.average_readiness_score >= 70 ? "Great job! You're well prepared." : 
                   analytics.average_readiness_score >= 50 ? "You're getting there. Keep practicing!" : 
                   "You need to study more to improve your score."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          
          {/* Recent Activity Feed */}
          <div className="bg-white dark:bg-black shadow-sm rounded-lg border border-gray-200 dark:border-gray-800 transition-colors duration-200">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-black">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Recent Activity</h3>
              <Activity className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <div className="p-6">
              {analytics.recent_activity.length > 0 ? (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {analytics.recent_activity.map((activity, activityIdx) => (
                      <li key={activityIdx}>
                        <div className="relative pb-8">
                          {activityIdx !== analytics.recent_activity.length - 1 ? (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center ring-8 ring-white dark:ring-gray-900 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                                {getIconForActivity(activity.type)}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{activity.description}</p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-400 dark:text-gray-500">
                                <time dateTime={activity.date}>
                                  {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                                </time>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
                  <CheckCircle className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
                  No recent activity. Start studying!
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
