import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

import Heading from '@theme/Heading';
import styles from './index.module.css';


function Header() {
  return (
    <header className="header">
      <nav className="navbar">
        <h1 className="logo">Suggest Feature</h1>
        <ul>
          <li><a href="#features">Features</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#cta">Get Started</a></li>
        </ul>
      </nav>
      <div className="hero">
        <h2>Streamline Your Feedback Process</h2>
        <p>Effortlessly manage and prioritize suggestions for your product's future roadmap.</p>
        <a href="#cta" className="cta-button">Get Started for Free</a>
      </div>
    </header>
  );
}

function Features() {
  return (
    <section id="features" className="features">
      <h2>Features</h2>
      <div className="feature-list">
        <div className="feature-item">
          <i className="fas fa-check-circle"></i>
          <h3>Easy Feedback Collection</h3>
          <p>Collect user feedback with minimal effort and without any hassle.</p>
        </div>
        <div className="feature-item">
          <i className="fas fa-road"></i>
          <h3>Roadmap Integration</h3>
          <p>Integrate feedback directly into your product's roadmap.</p>
        </div>
        <div className="feature-item">
          <i className="fas fa-cloud-upload-alt"></i>
          <h3>Hosted and Open Source</h3>
          <p>Use the hosted version or self-host with our open-source solution.</p>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="cta" className="cta">
      <h2>Ready to Streamline Your Feedback?</h2>
      <p>Sign up now and start managing your feedback with ease.</p>
      <a href="#" className="cta-button">Get Started for Free</a>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <p>&copy; 2024 Suggest Feature. All rights reserved.</p>
      <ul>
        <li><a href="/privacy">Privacy Policy</a></li>
        <li><a href="/terms">Terms of Service</a></li>
        <li><a href="/contact-us">Contact Us</a></li>
      </ul>
    </footer>
  );
}


export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Suggest feature is an amazing tool to Collect user pain points">
      <Header />
      <Features />
      <CTA />
    </Layout>
  );
}
