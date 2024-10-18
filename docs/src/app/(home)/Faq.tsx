import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Zap, Infinity, BookOpen, Headset, CreditCard, Users, Building, Lock, Rocket, PieChart, Puzzle, Globe, ArrowUpCircle, Repeat, DollarSign, RefreshCw, MessageCircleMore } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const faqData = {
  "General": [
    {
      question: "What can I use Suggest Feature for?",
      answer: "Suggest Feature is your all-in-one solution for managing user feedback, feature requests, product roadmaps, and changelogs. It's perfect for SaaS companies, product teams, and any business looking to align their product development with user needs and communicate effectively with their audience.",
      icon: <Zap className="w-6 h-6 text-primary-600" />
    },
    {
      question: "Is there a limit on team members or feature requests?",
      answer: "Absolutely not! We offer unlimited team members, feature requests, and changelog entries across all our plans. We believe in providing you with the flexibility to grow your team and manage your product without artificial constraints.",
      icon: <Infinity className="w-6 h-6 text-primary-600" />
    },
    {
      question: "Where can I find the documentation?",
      answer: "Our comprehensive documentation is always available at docs.suggestfeature.com. It covers everything from getting started to advanced features and API integration. We continuously update it to ensure you have the most current information at your fingertips.",
      icon: <BookOpen className="w-6 h-6 text-primary-600" />
    },
  ],
  "Features": [
    {
      question: "How does the roadmap feature work?",
      answer: "Our interactive roadmap feature allows you to visually communicate your product's future direction. You can easily create, organize, and update items, set timeframes, and change statuses. Your users can see what's planned, what's in progress, and what's been launched, fostering transparency and engagement.",
      icon: <Rocket className="w-6 h-6 text-primary-600" />
    },
    {
      question: "What kind of analytics does Suggest Feature offer? (🚀 Upcoming)",
      answer: "We provide robust analytics to help you make data-driven decisions. You can track user engagement, popular feature requests, voting trends, and more. Our intuitive dashboards give you clear insights into what your users want, helping you prioritize your development efforts effectively.",
      icon: <PieChart className="w-6 h-6 text-primary-600" />
    },
    {
      question: "How does the voting system work?",
      answer: "Our voting system allows users to upvote feature requests they find valuable. This helps you gauge user interest and prioritize development. You can customize voting settings, such as allowing users to allocate multiple votes or setting voting periods.",
      icon: <ArrowUpCircle className="w-6 h-6 text-primary-600" />
    },
  ],
  "Integration & Support": [
    {
      question: "What kind of support do you offer?",
      answer: "We pride ourselves on providing best-in-class support. Our dedicated team is always available to assist you, whether you need help with setup, have questions about features, or need strategic advice on managing user feedback. We're committed to your success!",
      icon: <Headset className="w-6 h-6 text-primary-600" />
    },
    {
      question: "Can Suggest Feature integrate with other tools?",
      answer: "Absolutely! We offer a wide range of integrations with popular tools like Jira, Trello, Slack, and many more. Our API also allows for custom integrations, ensuring Suggest Feature fits seamlessly into your existing workflow.",
      icon: <Puzzle className="w-6 h-6 text-primary-600" />
    },
    {
      question: "Can I migrate data from other platforms to Suggest Feature?",
      answer: "Certainly! We offer comprehensive migration support to help you transition smoothly from other platforms. Our team will assist you in importing your existing feature requests, user data, and other relevant information, ensuring you don't lose any valuable feedback during the switch. We can import data from popular platforms like Canny, Productboard and any other tool that provides an export feature.",
      icon: <Repeat className="w-6 h-6 text-primary-600" />
    },
  ],
  "Pricing & Plans": [
    {
      question: "How does the free trial work?",
      answer: "We offer a generous 7-day free trial on all our plans. You get full access to all features, allowing you to thoroughly explore how Suggest Feature can revolutionize your product management process. No credit card is required to start your trial.",
      icon: <CreditCard className="w-6 h-6 text-primary-600" />
    },
    {
      question: "What's your pricing model?",
      answer: "We offer flexible, transparent pricing to suit businesses of all sizes. Our plans are based on your needs, with options ranging from startups to enterprises. All plans come with unlimited users and requests. For detailed pricing, please check our pricing page. Remember, we offer a 7-day free trial for all plans!",
      icon: <DollarSign className="w-6 h-6 text-primary-600" />
    },
    {
      question: "Can I upgrade, downgrade, or cancel my plan anytime?",
      answer: "Absolutely! We believe in giving you full control over your subscription. You can upgrade or downgrade your plan at any time from your account settings, and the changes will take effect immediately. If you decide to upgrade, you'll be charged the prorated difference for the remainder of your billing cycle. For downgrades, the new lower price will apply to your next billing cycle. You can also cancel your subscription at any time – there are no long-term commitments. If you cancel, you'll retain access to your plan until the end of your current billing period.",
      icon: <RefreshCw className="w-6 h-6 text-primary-600" />
    },
    {
      question: "Is Suggest Feature suitable for enterprises?",
      answer: "Definitely! Our Enterprise plan is designed to meet the complex needs of large organizations. It includes advanced security features, custom integrations, dedicated support, and the option for on-premise deployment. We're equipped to handle the scale and specific requirements of enterprise clients.",
      icon: <Building className="w-6 h-6 text-primary-600" />
    },
  ],
  "Security & Collaboration": [
    {
      question: "How secure is my data with Suggest Feature?",
      answer: "We take data security very seriously. All data is encrypted in transit and at rest. We employ industry-standard security practices, regular audits, and offer features like SSO and audit logs in our higher-tier plans. Your data's security is our top priority. You can also self host Suggest Feature on your own servers with our support.",
      icon: <Lock className="w-6 h-6 text-primary-600" />
    },
    {
      question: "Can I invite my team to collaborate?",
      answer: "Absolutely! We encourage team collaboration. You can invite unlimited team members to your Suggest Feature account. Each member can be assigned specific roles and permissions, ensuring smooth teamwork while maintaining proper access control.",
      icon: <Users className="w-6 h-6 text-primary-600" />
    },
    {
      question: "Is Suggest Feature available in multiple languages? (🚀 Upcoming)",
      answer: "Yes! We support multiple languages, allowing you to manage feedback from users around the globe. You can set up localized feedback boards, ensuring clear communication with your international user base. We will auto translate the user content to the user's preferred language",
      icon: <Globe className="w-6 h-6 text-primary-600" />
    },
  ],
};

const FAQ = () => {

  const CrispButton = dynamic(
    () => import('@/components/CrispButton')
  )

  return (
    <section className="py-16 px-4 bg-gray-50" id='faq'>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">Frequently Asked Questions</h2>
        <p className="text-center text-gray-600">
          Quick answers to questions you may have about Suggest Feature and billing. Can&apos;t find what you&apos;re looking for? Check out our documentation.
        </p>
        <div className="flex justify-center space-x-4 mt-4 mb-8">
          <Link href="https://docs.suggestfeature.com/suggest-feature"
            target="_blank"
          >
            <Button variant="outline">
              Documentation
            </Button>
          </Link>
          <CrispButton />
        </div>

        {Object.entries(faqData).map(([category, questions], categoryIndex) => (
          <div key={categoryIndex} className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">{category}</h3>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {questions.map((item, index) => (
                <AccordionItem key={index} value={`item-${categoryIndex}-${index}`} className="border border-gray-200 rounded-lg overflow-hidden">
                  <AccordionTrigger className="flex items-center justify-between w-full px-6 py-4 text-left bg-white hover:bg-gray-50 transition-all">
                    <div className="flex items-center">
                      {item.icon}
                      <span className="ml-3 font-medium text-gray-900">{item.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4 bg-white">
                    <p className="text-gray-600">{item.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>
    </section>
  );
};
export default FAQ;
