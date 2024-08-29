import React from 'react';
import WistiaEmbed from "@/components/WistiaEmbed";
import { ArrowRight, Check, MousePointerClick } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { cn } from '@/lib/utils';


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

const PricingTier = ({ title, price, description, features }) => (
  <Card className="flex flex-col p-2 mx-auto max-w-lg text-center text-gray-900 bg-white rounded-lg border border-gray-100 shadow dark:border-gray-600 dark:bg-gray-800 dark:text-white">
    <CardHeader>
      <h3 className="mb-4 text-2xl font-semibold">{title}</h3>
      <p className="font-light text-gray-500 sm:text-lg dark:text-gray-400">{description}</p>
    </CardHeader>
    <CardContent>
      <div className="flex justify-center items-baseline my-8">
        <span className={cn("mr-2 text-4xl font-extrabold",
          price === "Custom" ? "text-4xl" : ""
        )}>${price}</span>
        {price === "Custom" ? "" :
          <span className="text-gray-500 dark:text-gray-400">/month</span>
        }
      </div>
      <ul role="list" className="mb-8 space-y-4 text-left">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center space-x-3">
            <Check className="flex-shrink-0 w-5 h-5 text-green-500 dark:text-green-400" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Link href="https://app.suggestfeature.com/sign-up" passHref={true}>
        <Button size="lg"
          className={cn("text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:text-white  dark:focus:ring-primary-900 w-full",
            price === 'Custom' ? "bg-primary hover:bg-primary/90" : ""
          )}>
          {price === "Custom" ? "Contact Us" : "Get Started"}
        </Button>
      </Link>
    </CardContent>
  </Card>
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
      <div className="flex flex-col mb-8 lg:mb-16 space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
        <Link href="https://app.suggestfeature.com/sign-up" passHref={true}>
          <Button size="lg" asChild className='py-3 px-5 font-medium text-base text-center text-white rounded-lg border border-primary-700 bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-900 h-[13.5]'>
            <div className='flex items-center'>
              Get Started
              <ArrowRight className="ml-2 -mr-1 w-6 h-6" />
            </div>
          </Button>
        </Link>
        <Link href="/demo" passHref={true}>
          <Button variant="outline" className='py-3 px-5 text-base font-medium text-center text-gray-900 rounded-lg border border-gray-300 hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700 dark:focus:ring-gray-800 h-[13.5]' size="lg">
            <div className='flex items-center'>
              Try Demo
              <MousePointerClick className="ml-2 -mr-1 w-6 h-6" />
            </div>
          </Button>
        </Link>
      </div>
      <WistiaEmbed />
    </div>
  </section>
);

const Features = () => {
  const featureData = [
    {
      icon: <svg className="w-5 h-5 text-primary-600 lg:w-6 lg:h-6 dark:text-primary-300" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>,
      title: "Fully open source",
      description: "Export data and switch between self-hosted and cloud-hosted versions of the product. Your data is always yours."
    },
    {
      icon: <svg className="w-5 h-5 text-primary-600 lg:w-6 lg:h-6 dark:text-primary-300" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>,
      title: "Marketing",
      description: "Plan it, create it, launch it. Collaborate seamlessly with all the organization and hit your marketing goals every month with our marketing plan."
    },
  ];

  return (
    <section className="bg-white dark:bg-gray-900">
      <div className="py-8 px-4 mx-auto max-w-screen-xl sm:py-16 lg:px-6">
        <div className="max-w-screen-md mb-8 lg:mb-16">
          <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">Core belief</h2>
          <p className="text-gray-500 sm:text-xl dark:text-gray-400">Our core belief is that your data should always be yours and you should never be vendor locked in and you should always be able to self host the product if required. Open source is in our core belief</p>
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

const Pricing = () => {
  const pricingData = [
    {
      title: "Basic",
      description: "Best option for personal use & for your next project",
      price: 9,
      features: [
        "3 project boards",
        "Up to 3 team members",
        "Unlimited feature requests/bugs",
        "Custom domain",
        "Email support"
      ],
      buttonText: "Get started"
    },
    {
      title: "Pro",
      description: "Relevant for multiple users & extended support",
      price: 29,
      features: [
        "10 project boards",
        "Unlimited team members",
        "Unlimited feature requests/bugs",
        "Custom domain",
        "Email and chat support",
      ],
      buttonText: "Get started"
    },
    {
      title: "Team",
      description: "Best for small to medium sized businesses",
      price: 49,
      features: [
        "Unlimited project boards",
        "Unlimited team members",
        "Unlimited feature requests/bugs",
        "Custom domain",
        "Custom fields",
        "Priority support",
        "Integrations with popular tools"
      ],
      buttonText: "Get started"
    },
    {
      title: "Enterprise",
      description: "Contact us and we'll help you figure it out",
      price: "Custom",
      features: [
        "Unlimited project boards",
        "Unlimited team members",
        "All features from Team plan",
        "Custom domain",
        "Advanced security features (SSO, audit logs)",
        "Custom integrations",
        "On-premise deployment option",
        "SLA guarantees"
      ],
      buttonText: "Contact us"
    }
  ];

  return (
    <section className="bg-white dark:bg-gray-900" id="pricing">
      <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
        <div className="mx-auto max-w-screen-md text-center mb-8 lg:mb-12">
          <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">Build the best features together with your customers</h2>
          <p className="mb-5 font-light text-gray-500 sm:text-xl dark:text-gray-400">Prioritize what&apos;s important to increase MRR and reduce churn. Know what really matters to your customers and make everyone happy</p>
        </div>
        <div className="space-y-6 lg:grid lg:grid-cols-4 sm:gap-4 lg:space-y-0">
          {pricingData.map((tier, index) => (
            <PricingTier key={index} {...tier} />
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
      <Pricing />
    </div>
  );
}
