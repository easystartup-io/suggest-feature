import styles from './index.module.css';

const CallToAction = () => {
  return (
    <section className="cta">
      <div className="container">
        <h2>Ready to get started?</h2>
        <a href="#signup" className="button">Sign Up Now</a>
      </div>
    </section>
  );
};
const Testimonials = () => {
  const testimonials = [
    { name: "John Doe", feedback: "This is an amazing product!" },
    { name: "Jane Smith", feedback: "I love using this service." },
  ];

  return (
    <section className="testimonials">
      <div className="container">
        <h2>Testimonials</h2>
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-item">
              <p>{testimonial.feedback}</p>
              <h3>{testimonial.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
const Features = () => {
  const features = [
    { title: "Fully Responsive", description: "Looks great on all devices." },
    { title: "Customizable", description: "Easy to modify for your needs." },
    { title: "High Performance", description: "Fast and optimized." },
  ];

  return (
    <section className="features">
      <div className="container">
        <h2>Features</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-item">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
const Hero = () => {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-content">
          <h1>Build your website the right way</h1>
          <p>Create and grow your business with a modern landing page.</p>
          <a href="#cta" className="button">Get Started</a>
        </div>
        <div className="hero-image">
          <img src="your-hero-image-url" alt="Hero" />
        </div>
      </div>
    </section>
  );
};

const Header = () => {
  return (
    <header className="header">
      <div className="container bg-blue-700">
        <div className="logo">Gray</div>
        <nav className="nav">
          <ul>
            <li><a href="#features">Features</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#testimonials">Testimonials</a></li>
          </ul>
        </nav>
        <a href="#cta" className="button">Sign Up</a>
      </div>
    </header>
  );
};

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <ul className="footer-nav">
          <li><a href="#privacy">Privacy Policy</a></li>
          <li><a href="#terms">Terms of Service</a></li>
        </ul>
        <div className="social-icons">
          <a href="#facebook">Facebook</a>
          <a href="#twitter">Twitter</a>
        </div>
      </div>
    </footer>
  );
};


function App() {
  return (
    <div className="App">
      <Header />
      <Hero />
      <Features />
      <Testimonials />
      <CallToAction />
      <Footer />
    </div>
  );
}
export default App;

