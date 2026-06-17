import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Brain, Zap } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen flex flex-col font-sans transition-colors duration-200">
      <main className="flex-grow flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto mt-16 sm:mt-24">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-8">
            Supercharge your learning with <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">SmartStudy AI</span>
          </h1>
          <p className="mt-4 text-xl sm:text-2xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Upload your documents, generate instant quizzes, create study plans, and get answers right when you need them.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link 
              to="/register" 
              className="w-full sm:w-auto px-8 py-4 border border-transparent text-lg font-medium rounded-lg bg-primary hover:bg-yellow-700 text-white shadow-lg shadow-indigo-500/30 transition-all hover:scale-105"
            >
              Get Started for Free
            </Link>
            <Link 
              to="/login" 
              className="w-full sm:w-auto px-8 py-4 border border-gray-300 dark:border-gray-700 text-lg font-medium rounded-lg text-gray-600 dark:text-gray-300 bg-btn-grey hover:bg-gray-600 text-white px-4 py-2 rounded-lg dark:bg-gray-700 dark:hover:bg-gray-600 transition-all hover:text-gray-900 dark:hover:text-white shadow-sm"
            >
              Login to your Account
            </Link>
          </div>
        </div>

        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full mb-24">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 rounded-2xl flex flex-col items-center text-center shadow-md hover:shadow-lg transition-all duration-200">
            <div className="bg-indigo-50 dark:bg-gray-900 p-4 rounded-full mb-6">
              <Brain className="h-8 w-8 text-primary dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">AI-Powered Summaries</h3>
            <p className="text-gray-600 dark:text-gray-400">Instantly condense long PDFs into digestible bullet points for rapid revision.</p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 rounded-2xl flex flex-col items-center text-center shadow-md hover:shadow-lg transition-all duration-200">
            <div className="bg-cyan-50 dark:bg-gray-900 p-4 rounded-full mb-6">
              <Zap className="h-8 w-8 text-secondary dark:text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Dynamic Quizzes</h3>
            <p className="text-gray-600 dark:text-gray-400">Test your knowledge with automatically generated interactive multiple-choice quizzes.</p>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 rounded-2xl flex flex-col items-center text-center shadow-md hover:shadow-lg transition-all duration-200">
            <div className="bg-amber-50 dark:bg-gray-900 p-4 rounded-full mb-6">
              <BookOpen className="h-8 w-8 text-accent dark:text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Contextual Q&A</h3>
            <p className="text-gray-600 dark:text-gray-400">Ask any question and our RAG engine finds the exact answer directly from your study materials.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
