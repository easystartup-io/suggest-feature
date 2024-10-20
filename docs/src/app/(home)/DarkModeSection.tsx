"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun } from 'lucide-react';

const DarkModeSection = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5, // Trigger when 50% of the section is visible
    };

    const handleIntersect = (entries) => {
      entries.forEach((entry) => {
        setIsDarkMode(entry.isIntersecting);
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  return (
    <section
      ref={sectionRef}
      className={`min-h-screen flex items-center justify-center transition-colors duration-500 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
        }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center">
          <div className="lg:w-1/2 mb-8 lg:mb-0">
            <img
              src="/img/dark-mode.png"
              alt="Dark Mode Preview"
              className="rounded-lg shadow-xl max-w-full h-auto"
            />
          </div>
          <div className="lg:w-1/2 lg:pl-12">
            <h2 className="text-4xl font-extrabold mb-6 text-gray-400">
              A delight for the eyes
            </h2>
            <h3 className="text-3xl font-bold mb-4">
              Optimized for dark mode
            </h3>
            <p className="text-xl mb-6">
              Match the app to your preferred appearance setting and reduce eye strain.
            </p>
            <ul className="space-y-4">
              {[
                "Elegant and modern dark interface",
                "Reduce eye strain during night-time usage",
                "Seamlessly switch between light and dark modes"
              ].map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg className="w-6 h-6 mr-3 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-lg">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DarkModeSection;
