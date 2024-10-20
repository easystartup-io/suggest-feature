"use client"
import React, { useEffect } from 'react';

const CustomChangelogButton = () => {
  useEffect(() => {
    SuggestFeature.init({
      domain: 'https://feedback.suggestfeature.com',
      position: 'bottom',
      align: 'left',
      theme: 'light'
    });
  }, []);

  return (
    <div className="p-8 flex justify-center items-center bg-gray-100">
      <button
        data-sf-changelog
        className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-teal-400 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-teal-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out"></span>
        <span className="relative flex items-center justify-center">
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8.34164C20 7.8034 19.7831 7.28789 19.3982 6.91161L15.0892 2.6983C14.7133 2.33375 14.2035 2.12598 13.6708 2.12598H6C4.89543 2.12598 4 3.02141 4 4.12598V4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 14H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 18H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Changelog</span>
        </span>
      </button>
      <script src="https://suggestfeature.com/js/changelog.js" async></script>
    </div>
  );
};

export default CustomChangelogButton;
