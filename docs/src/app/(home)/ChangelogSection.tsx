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
      description: "Keep everyone engaged with your product's evolution",
      details: [
        "Publish detailed release notes linked to feature requests",
        "Automatically notify users of updates they care about",
        "Boost customer engagement and feature adoption"
      ],
      icon: <Bell className="w-6 h-6" />,
      image: "/img/changelog/share-updates.png"
    },
    {
      title: "Public changelog page",
      description: "Showcase your progress and build trust",
      details: [
        "Create a dedicated, SEO-friendly page for your changelog",
        "Customize the design to match your brand identity",
        "Demonstrate your commitment to continuous improvement"
      ],
      icon: <Globe className="w-6 h-6" />,
      image: "/img/changelog/public-page.png"
    },
    {
      title: "Powerful changelog editor",
      description: "Create compelling update narratives effortlessly",
      details: [
        "Use our rich text editor to format changelogs beautifully",
        "Embed images and videos to showcase new features effectively",
        "Link updates to documentation for seamless user education"
      ],
      icon: <Edit className="w-6 h-6" />,
      image: "/img/changelog/editor.png"
    },
    {
      title: "In-app changelog widgets",
      description: "Bring updates directly to your users' workflow",
      details: [
        "Embed customizable changelog widgets in your application",
        "Highlight unread updates to ensure visibility",
        "Improve feature discovery and reduce support queries"
      ],
      icon: <LayoutList className="w-6 h-6" />,
      image: "/img/changelog/widget.png"
    },
    {
      title: "Smart tagging and notifications",
      description: "Deliver relevant updates to the right audience",
      details: [
        "Categorize updates with tags for easy navigation",
        "Set up automated, targeted email notifications",
        "Allow users to subscribe to updates that matter to them"
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
          Our public changelog keeps your users informed about the latest updates, improvements, and new features. Boost engagement and showcase your product&apos;s evolution.
        </p>
      </div>

      {/* Scrolling Content */}
      <div className="flex flex-col lg:flex-row">
        <div className="lg:w-1/2 lg:sticky lg:top-0 lg:h-screen hidden lg:flex items-center justify-center">
          <img
            src={sections[activeSection].image}
            alt={sections[activeSection].title}
            className="rounded-lg shadow-xl max-w-full max-h-full object-contain transition-opacity duration-300"
          />
        </div>
        <div className="lg:w-1/2">
          {sections.map((section, index) => (
            <div
              key={index}
              ref={(el) => (sectionRefs.current[index] = el)}
              className="min-h-screen flex flex-col lg:flex-row items-center p-8"
            >
              <div className="w-full lg:w-auto mb-8 lg:mb-0 lg:hidden">
                <img
                  src={section.image}
                  alt={section.title}
                  className="rounded-lg shadow-xl max-w-full h-auto object-contain"
                />
              </div>
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
