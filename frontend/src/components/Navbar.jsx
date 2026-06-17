import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Moon, Sun } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavLink = ({ to, children }) => {
    const isActive = location.pathname.startsWith(to) && to !== '/' || location.pathname === to;
    return (
      <Link 
        to={to} 
        className={`text-sm font-medium transition-colors pb-1 ${isActive ? 'text-accent border-b-2 border-accent' : 'text-indigo-100 hover:text-white hover:border-b-2 hover:border-indigo-300 border-b-2 border-transparent'}`}
      >
        {children}
      </Link>
    );
  };

  return (
    <nav className="bg-yellow-800 dark:bg-black text-white shadow-md sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-extrabold text-white tracking-tight">
              SmartStudy AI
            </Link>
          </div>
          
          <div className="flex items-center space-x-6">
            {user ? (
              <>
                <NavLink to="/documents">Documents</NavLink>
                <NavLink to="/study-tools">Study Tools</NavLink>
                <NavLink to="/analytics">Analytics</NavLink>
                <NavLink to="/audio">Audio</NavLink>
                <NavLink to="/drive">Drive</NavLink>
                <NavLink to="/feedback">Feedback</NavLink>
                
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full text-indigo-100 hover:text-white hover:bg-indigo-700 dark:hover:bg-gray-800 transition-colors focus:outline-none"
                  aria-label="Toggle dark mode"
                >
                  {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
                
                <div className="flex items-center space-x-2 pl-4 border-l border-indigo-400 dark:border-gray-700">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-700 dark:bg-gray-900 text-indigo-100 dark:text-gray-300">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-white mr-4">{user.full_name || user.email}</span>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 border border-indigo-400 dark:border-gray-700 text-sm font-medium rounded-md text-white hover:bg-indigo-700 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary dark:focus:ring-offset-gray-900 focus:ring-white transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="space-x-4 flex items-center">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full text-indigo-100 hover:text-white hover:bg-indigo-700 dark:hover:bg-gray-800 transition-colors focus:outline-none"
                  aria-label="Toggle dark mode"
                >
                  {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
                <Link to="/login" className="text-indigo-100 hover:text-white transition-colors text-sm font-medium">
                  Log in
                </Link>
                <Link to="/register" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary dark:text-white bg-white dark:bg-gray-900 hover:bg-indigo-50 dark:hover:bg-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary dark:focus:ring-offset-gray-900 focus:ring-white transition-colors">
                  Sign up
                </Link>
                <Link to="/feedback" className="text-indigo-100 hover:text-white transition-colors text-sm font-medium ml-2 border border-indigo-400 dark:border-gray-700 px-3 py-1.5 rounded-md hover:bg-indigo-700 dark:hover:bg-gray-800">
                  Feedback
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
