import React, { useState } from 'react';
import { Star, Send, Loader2, Bug, Lightbulb, Heart, MessageSquare } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const FeedbackPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    feedback_type: 'suggestion',
    message: '',
    rating: 0
  });
  
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const feedbackTypes = [
    { id: 'bug', label: 'Bug Report', icon: <Bug className="w-4 h-4 mr-2" /> },
    { id: 'suggestion', label: 'Suggestion', icon: <Lightbulb className="w-4 h-4 mr-2" /> },
    { id: 'compliment', label: 'Compliment', icon: <Heart className="w-4 h-4 mr-2" /> },
    { id: 'other', label: 'Other', icon: <MessageSquare className="w-4 h-4 mr-2" /> }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || formData.name.length < 2) {
      toast.error('Please enter a valid name (min 2 characters).');
      return;
    }
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (!formData.rating || formData.rating < 1 || formData.rating > 5) {
      toast.error('Please provide a rating from 1 to 5 stars.');
      return;
    }
    if (!formData.message || formData.message.length < 20) {
      toast.error('Please provide a more detailed message (min 20 characters).');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/feedback/submit', formData);
      toast.success(
        <div className="text-center">
          <p className="font-bold text-lg mb-1">Thank you for your feedback! 🎉</p>
          <p className="text-sm">We'll use it to make SmartStudy AI better.</p>
        </div>,
        { duration: 5000 }
      );
      
      // Clear form
      setFormData({
        name: '',
        email: '',
        feedback_type: 'suggestion',
        message: '',
        rating: 0
      });
    } catch (error) {
      console.error('Feedback submission failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit feedback. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl tracking-tight">
            Feedback & Suggestions
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Help us improve SmartStudy AI by sharing your thoughts!
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 transition-all duration-200">
          <div className="px-6 py-8 sm:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Your Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-800 dark:text-white sm:text-sm px-4 py-3 border"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Your Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-800 dark:text-white sm:text-sm px-4 py-3 border"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Feedback Type
                </label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {feedbackTypes.map((type) => (
                    <div
                      key={type.id}
                      onClick={() => setFormData(prev => ({ ...prev, feedback_type: type.id }))}
                      className={`cursor-pointer flex items-center justify-center px-3 py-2 border rounded-md text-sm font-medium transition-colors ${
                        formData.feedback_type === type.id
                          ? 'bg-primary border-primary text-white'
                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {type.icon}
                      {type.label}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Overall Experience Rating
                </label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                      className="p-1 focus:outline-none focus:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          star <= (hoveredRating || formData.rating)
                            ? 'text-accent fill-accent'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                        style={{ color: star <= (hoveredRating || formData.rating) ? '#F59E0B' : undefined, fill: star <= (hoveredRating || formData.rating) ? '#F59E0B' : 'none' }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-800 dark:text-white sm:text-sm px-4 py-3 border resize-y"
                  placeholder="Tell us what you think... (min 20 characters)"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {formData.message.length}/20 minimum characters
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="-ml-1 mr-2 h-5 w-5" />
                      Submit Feedback
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
