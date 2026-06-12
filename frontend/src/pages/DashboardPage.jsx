import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const DashboardPage = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-xl">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Welcome, <span className="text-indigo-400">{user?.full_name || user?.email}</span>!
          </h1>
          <p className="mt-4 text-lg text-slate-400">
            You are successfully logged in. This is your protected dashboard.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Placeholder Cards */}
          {[1, 2, 3].map((item) => (
            <div key={item} className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-md">
              <div className="h-10 w-10 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-4 border border-indigo-500/30">
                <div className="h-5 w-5 bg-indigo-400 rounded-sm"></div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Feature {item}</h3>
              <p className="text-slate-400">
                This is a placeholder for your awesome dashboard features.
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
