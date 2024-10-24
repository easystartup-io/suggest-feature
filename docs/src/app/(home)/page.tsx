import { Button } from "@/components/ui/button";
import WistiaVideo from "@/components/WistiaEmbed";
import { ArrowRight, AtSign, Code, ExternalLink, Headset, Lightbulb, Map, Megaphone, Paintbrush, UserCheck, Vote } from "lucide-react";
import { Metadata } from 'next';
import Link from 'next/link';
import BestInClassSupport from './BestInClassSupport';
import ChangelogSection from './ChangelogSection';
import DarkModeSection from './DarkModeSection';
import FAQ from './Faq';
import Pricing from './Pricing';

export const metadata: Metadata = {
  title: "Suggest Feature - Share and Vote on Feature Requests",
  description: "Suggest Feature is a platform for sharing and voting on feature requests.",
  metadataBase: new URL('https://suggestfeature.com'),
};

const FeatureIcon = ({ children }) => (
  <div className="flex justify-center items-center mb-4 w-10 h-10 rounded-full bg-primary-100 lg:h-12 lg:w-12 dark:bg-primary-900">
    {children}
  </div>
);

const Feature = ({ icon, title, description }) => (
  <div>
    <FeatureIcon>{icon}</FeatureIcon>
    <h3 className="mb-2 text-xl font-bold dark:text-white">{title}</h3>
    <p className="text-gray-500 dark:text-gray-400">{description}</p>
  </div>
);

const Hero = () => (
  <section className="bg-white dark:bg-gray-900">
    <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16 lg:px-12">
      <h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-none text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
        Simplest way to gather customer feedback
      </h1>
      <p className="mb-8 text-lg font-normal text-gray-500 lg:text-xl sm:px-16 xl:px-48 dark:text-gray-400">
        Understand what users really want to make the best product. Effortlessly manage and prioritize suggestions for your product&apos;s future roadmap.
      </p>
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
        <Link href="https://app.suggestfeature.com/sign-up" passHref={true}>
          <Button size="lg" asChild className='py-3 px-5 font-medium text-base text-center text-white rounded-lg border border-primary-700 bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-900 h-[13.5]'>
            <div className='flex items-center'>
              Get Started
              <ArrowRight className="ml-2 -mr-1 w-6 h-6" />
            </div>
          </Button>
        </Link>
        <Link href="https://feedback.suggestfeature.com" passHref={true}
          target="_blank"
        >
          <Button size="lg" asChild className='py-3 px-5 font-medium text-base text-gray-900 text-center rounded-lg border border-gray-700 bg-white hover:bg-gray-900/10 focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-900 h-[13.5]'>
            <div className='flex items-center'>
              Live Demo
              <ExternalLink className="ml-2 -mr-1 w-6 h-6" />
            </div>
          </Button>
        </Link>
      </div>
      <div className="flex flex-col mt-1 mb-8 lg:mb-16 space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
        <p className='text-sm text-muted-foreground'>
          7 days free trial
        </p>
      </div>
      <WistiaVideo />
    </div>
  </section>
);

const Features = () => {
  const featureData = [
    {
      icon: <Code className="w-6 h-6 text-primary-600 dark:text-primary-300" />,
      title: "Open source core",
      description: "Seemlessly switch between self-hosted and cloud-hosted versions of Suggest Feature. Your data is always yours."
    },
    {
      icon: <Lightbulb className="w-6 h-6 text-primary-600 dark:text-primary-300" />,
      title: "Intelligent Feedback Boards",
      description: "Create public and private boards to gather and organize user feedback effectively."
    },
    {
      icon: <Map className="w-6 h-6 text-primary-600 dark:text-primary-300" />,
      title: "Visual Product Roadmap",
      description: "Share your product vision with an engaging, interactive roadmap that excites users."
    },
    {
      icon: <Megaphone className="w-6 h-6 text-primary-600 dark:text-primary-300" />,
      title: "Dynamic Changelog",
      description: "Communicate your latest launches and updates in a beautiful, automated feed."
    },
    {
      icon: <Vote className="w-6 h-6 text-primary-600 dark:text-primary-300" />,
      title: "Feature Voting",
      description: "Enable users, team members, and stakeholders to vote on feature requests and prioritize development."
    },
    {
      icon: <UserCheck className="w-6 h-6 text-primary-600 dark:text-primary-300" />,
      title: "User SSO",
      description: "Streamline access with automatic user authentication and seamless integration."
    },
    {
      icon: <Paintbrush className="w-6 h-6 text-primary-600 dark:text-primary-300" />,
      title: "Customization Options",
      description: "Tailor the experience with custom statuses, CSS styling, and branding possibilities. Whitelabeling available."
    },
    {
      icon: <AtSign className="w-6 h-6 text-primary-600 dark:text-primary-300" />,
      title: "Custom Domain",
      description: "Host your feedback portal on our domain or integrate seamlessly with your own custom URL."
    },
    {
      icon: <Headset className="w-6 h-6 text-primary-600 dark:text-primary-300" />,
      title: "Best in class support",
      description: "Available to help you with any issues or questions you may have."
    }
  ];

  return (
    <section id='features' className="bg-white dark:bg-gray-900">
      <div className="py-8 px-4 mx-auto max-w-screen-xl sm:py-16 lg:px-6">
        <div className="max-w-screen-md mb-8 lg:mb-16">
          <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">All the features you need!</h2>
          <p className="text-gray-500 sm:text-xl dark:text-gray-400">From roadmap to SSO authentication, from comments to custom domains - we have it all to enhance your product feedback experience.</p>
        </div>
        <div className="space-y-8 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-12 md:space-y-0">
          {featureData.map((feature, index) => (
            <Feature key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default function Home() {
  return (
    <div>
      <Hero />
      <Features />
      <ChangelogSection />
      <DarkModeSection />
      <BestInClassSupport />
      <FAQ />
      <Pricing />
    </div>
  );
}
