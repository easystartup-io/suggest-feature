"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Globe, Edit, Tag, Mail, LayoutList } from 'lucide-react';

const ChangelogSection = () => {
  const [activeSection, setActiveSection] = useState(0);
  const sectionRefs = useRef([]);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();

      // Only activate when the changelog section is in view
      if (containerRect.top <= 0 && containerRect.bottom >= window.innerHeight) {
        sectionRefs.current.forEach((ref, index) => {
          if (ref) {
            const rect = ref.getBoundingClientRect();
            if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
              setActiveSection(index);
            }
          }
        });
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const sections = [
    {
      title: "Share updates",
      description: "Build a changelog to keep everyone engaged",
      details: [
        "Publish detailed release notes linked to your feature requests",
        "Automatically notify users who voted on those feature requests",
        "Boost customer engagement, retention, and feature adoption"
      ],
      icon: <Bell className="w-6 h-6" />,
      image: "/img/changelog/share-updates.png"
    },
    {
      title: "Public changelog page",
      description: "Showcase your progress to the world",
      details: [
        "Create a dedicated public page for your changelog",
        "Customizable design to match your brand",
        "Categorize updates for easy navigation"
      ],
      icon: <Globe className="w-6 h-6" />,
      image: "/img/changelog/public-page.png"
    },
    {
      title: "In-app changelog widgets",
      description: "Bring updates directly to your users",
      details: [
        "Embed changelog widgets within your application",
        "Show unread updates in real-time",
        "Increase feature discovery and adoption"
      ],
      icon: <LayoutList className="w-6 h-6" />,
      image: "/img/changelog/widget.png"
    },
    {
      title: "Best-in-class changelog editor",
      description: "Create compelling update narratives",
      details: [
        "Rich text editor for formatted changelogs",
        "Embed images and videos to showcase new features",
        "Link directly to updated features or documentation"
      ],
      icon: <Edit className="w-6 h-6" />,
      image: "/img/changelog/editor.png"
    },
    {
      title: "Tagging and notifications",
      description: "Keep users informed and engaged",
      details: [
        "Add tags to categorize your updates",
        "Set up automated email notifications for new changelogs",
        "Allow users to subscribe to specific update types"
      ],
      icon: <Tag className="w-6 h-6" />,
      image: "/img/changelog/email.png"
    },
  ];

  return (
    <section ref={containerRef} className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-900">
      {/* Main Changelog Header */}
      <div className="text-center py-16 px-4">
        <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-6">
          Changelog
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Our public changelog keeps your users informed about the latest updates, improvements, and new features. Boost engagement and showcase your product's evolution.
        </p>
      </div>

      {/* Scrolling Content */}
      <div className="flex">
        <div className="w-1/2 sticky top-0 h-screen flex items-center justify-center">
          <img
            src={sections[activeSection].image}
            alt={sections[activeSection].title}
            className="rounded-lg shadow-xl max-w-full max-h-full object-contain transition-opacity duration-300"
          />
        </div>
        <div className="w-1/2">
          {sections.map((section, index) => (
            <div
              key={index}
              ref={(el) => (sectionRefs.current[index] = el)}
              className="min-h-screen flex items-center p-8"
            >
              <div>
                <div className="flex items-center mb-4">
                  <div className="mr-4 p-2 bg-indigo-100 dark:bg-indigo-800 rounded-full">
                    {section.icon}
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {section.title}
                  </h3>
                </div>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
                  {section.description}
                </p>
                <ul className="space-y-4">
                  {section.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-start">
                      <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      <span className="text-lg text-gray-600 dark:text-gray-400">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ChangelogSection;
