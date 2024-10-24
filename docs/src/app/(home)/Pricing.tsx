import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Check } from "lucide-react";
import { cn } from '@/lib/utils';
import CrispButton from '@/components/CrispButton';

const PricingTier = ({ title, price, description, features, highlight, popular }) => (
  <Card className={cn(
    "flex flex-col p-6 mx-auto max-w-lg text-center text-gray-900 bg-white rounded-lg border shadow dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-all duration-300 hover:scale-105",
    highlight ? "border-indigo-500 dark:border-indigo-600 border-2 transform scale-105" : "border-gray-200",
    popular ? "bg-gradient-to-br from-indigo-500 to-blue-600 text-white" : ""
  )}>
    <CardHeader className="relative">
      {popular && (
        <div className="absolute top-0 right-0 px-3 py-1 text-xs font-semibold tracking-wide bg-yellow-300 rounded-bl rounded-tr text-indigo-700">
          🔥 Most Popular
        </div>
      )}
      <h3 className="mb-4 text-2xl font-semibold">{title}</h3>
      <p className={cn("font-light sm:text-lg", popular ? "text-indigo-100" : "text-gray-500 dark:text-gray-400")}>{description}</p>
    </CardHeader>
    <CardContent>
      <div className="flex justify-center items-baseline my-8">
        <span className="mr-2 text-5xl font-extrabold">${price}</span>
        <span className={cn("text-gray-500 dark:text-gray-400", popular ? "text-indigo-100" : "")}>/month</span>
      </div>
      <ul role="list" className="mb-8 space-y-4 text-left">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center space-x-3">
            <Check className={cn("flex-shrink-0 w-5 h-5", popular ? "text-indigo-200" : "text-green-500 dark:text-green-400")} />
            <span className={popular ? "text-indigo-100" : ""}>{feature}</span>
          </li>
        ))}
      </ul>
      <Link href="https://app.suggestfeature.com/sign-up" passHref={true}>
        <Button size="lg"
          className={cn("w-full font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors duration-300",
            popular ? "bg-white text-indigo-600 hover:bg-indigo-100" : "bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700"
          )}>
          Get Started
        </Button>
      </Link>
    </CardContent>
  </Card>
);

const EnterpriseTier = () => (
  <Card className="w-full mt-8 p-6 bg-white rounded-lg border border-gray-200 shadow dark:border-gray-600 dark:bg-gray-800">
    <div className="flex flex-col lg:flex-row items-center justify-between">
      <div className="text-left mb-4 lg:mb-0">
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">Enterprise</h3>
        <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">Contact us and we'll help you figure out the perfect plan for your organization</p>
      </div>
      <div className="flex items-center space-x-4">
        <ul className="flex-shrink-0 space-y-2 text-gray-500 dark:text-gray-400">
          <li className="flex items-center">
            <Check className="mr-2 w-5 h-5 text-green-500" />
            Advanced security features
          </li>
          <li className="flex items-center">
            <Check className="mr-2 w-5 h-5 text-green-500" />
            Custom integrations
          </li>
          <li className="flex items-center">
            <Check className="mr-2 w-5 h-5 text-green-500" />
            On-premise deployment
          </li>
        </ul>
        <CrispButton msg='I have some Enterprise query' />
      </div>
    </div>
  </Card>
);

const Pricing = () => {
  const pricingData = [
    {
      title: "Basic",
      description: "Best option for personal use & for your next project",
      price: 9,
      features: [
        "3 project boards",
        "Up to 10 team members",
        "Unlimited feature requests/bugs",
        "End user custom SSO",
        "Custom domain",
        "Email support"
      ]
    },
    {
      title: "Pro",
      description: "Relevant for multiple users & extended support",
      price: 29,
      highlight: true,
      popular: true,
      features: [
        "10 project boards",
        "Unlimited team members",
        "Unlimited feature requests/bugs",
        "End user custom SSO",
        "Custom domain",
        "Email and chat support"
      ]
    },
    {
      title: "Team",
      description: "Best for small to medium sized businesses",
      price: 49,
      features: [
        "Unlimited project boards",
        "Unlimited team members",
        "Unlimited feature requests/bugs",
        "End user custom SSO",
        "Custom domain",
        "Custom fields",
        "Priority support",
        "Integrations with popular tools"
      ]
    }
  ];

  return (
    <section className="bg-white dark:bg-gray-900" id="pricing">
      <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
        <div className="mx-auto max-w-screen-md text-center mb-8 lg:mb-12">
          <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">
            Build the best features together with your customers
          </h2>
          <p className="mb-5 font-light text-gray-500 sm:text-xl dark:text-gray-400">
            Prioritize what's important to increase MRR and reduce churn. Know what really matters to your customers and make everyone happy
          </p>
        </div>
        <div className="space-y-6 lg:grid lg:grid-cols-3 sm:gap-6 xl:gap-8 lg:space-y-0">
          {pricingData.map((tier, index) => (
            <PricingTier key={index} {...tier} />
          ))}
        </div>
        <EnterpriseTier />
      </div>
    </section>
  );
};

export default Pricing;
