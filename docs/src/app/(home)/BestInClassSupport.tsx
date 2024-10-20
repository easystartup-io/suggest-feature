import React from 'react';
import { Headset, Clock, CheckCircle } from 'lucide-react';

const BestInClassSupport = () => (
  <section className="py-24 bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-900 dark:to-blue-900">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col lg:flex-row items-center">
        <div className="lg:w-1/2 lg:pr-10 mb-10 lg:mb-0">
          <img
            src="/img/round-the-clock.jpg"
            alt="Best in Class Support"
            className="rounded-lg shadow-2xl"
          />
        </div>
        <div className="lg:w-1/2 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <h2 className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-6">
            Best in Class Support
          </h2>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
            We&apos;re committed to providing round-the-clock, top-notch support to answer any query and solve any problem, anytime.
          </p>
          <div className="space-y-6">
            <Feature
              icon={<Clock className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />}
              title="24/7 Availability"
              description="Our support team is always ready to assist you, day or night."
            />
            <Feature
              icon={<Headset className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />}
              title="Expert Assistance"
              description="Get help from our team of product experts for any query or issue."
            />
            <Feature
              icon={<CheckCircle className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />}
              title="Quick Resolution"
              description="We're committed to solving your problems swiftly and efficiently."
            />
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Feature = ({ icon, title, description }) => (
  <div className="flex items-start">
    <div className="flex-shrink-0 mr-4">{icon}</div>
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  </div>
);

export default BestInClassSupport;
