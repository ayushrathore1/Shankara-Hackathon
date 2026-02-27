import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { faLinkedin } from '@fortawesome/free-brands-svg-icons';
import ContactForm from '../components/forms/ContactForm';

const ContactPage = () => {
  return (
    <main className="bg-bg-base min-h-screen pt-24 pb-16">
      {/* Hero Section */}
      <section className="section text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
            CONTACT US
          </h1>
          <p className="text-text-muted text-lg max-w-2xl mx-auto mb-8">
            We're happy to hear from you.
          </p>
        </motion.div>
      </section>

      {/* Contact Section */}
      <section className="section pt-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col justify-center space-y-8" 
          >
            <div className="card-bento p-8 space-y-8">
                <p className="text-lg text-text-muted">
                    Whether you have questions, feedback, partnership inquiries, or support requests, feel free to reach out.
                </p>

                <div className="space-y-6">
                <div className="flex items-start gap-4 text-text-muted group">
                    <div className="w-10 h-10 rounded-lg bg-bg-elevated border border-border flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                        <FontAwesomeIcon icon={faEnvelope} />
                    </div>
                    <div>
                    <h4 className="text-text-main font-medium text-lg mb-1">Email</h4>
                    <a href="mailto:engineeratmedha@gmail.com" className="text-primary hover:underline">
                        engineeratmedha@gmail.com
                    </a>
                    </div>
                </div>

                <div className="flex items-start gap-4 text-text-muted group">
                    <div className="w-10 h-10 rounded-lg bg-bg-elevated border border-border flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                        <FontAwesomeIcon icon={faLinkedin} />
                    </div>
                    <div>
                    <h4 className="text-text-main font-medium text-lg mb-1">LinkedIn</h4>
                    <a 
                        href="https://www.linkedin.com/in/ayushrathore1" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary hover:underline"
                    >
                        https://www.linkedin.com/in/ayushrathore1
                    </a>
                    </div>
                </div>

                <div className="flex items-start gap-4 text-text-muted group">
                     {/* Using a simple building icon or similar for Company if FontAwesome building icon is not imported, 
                         but since I can't easily see all available icons, I'll stick to a generic container or just text if icon is missing.
                         However, I'll use a placeholder div that looks like an icon container.
                      */}
                    <div className="w-10 h-10 rounded-lg bg-bg-elevated border border-border flex items-center justify-center text-primary font-bold group-hover:bg-primary/10 transition-colors">
                        🏢
                    </div>
                    <div>
                    <h4 className="text-text-main font-medium text-lg mb-1">Company</h4>
                    <p className="text-white">Elytron</p>
                    <p className="text-sm">(Product: Medha)</p>
                    </div>
                </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                    <p className="text-text-muted italic">
                        We aim to respond to all queries within a reasonable timeframe.
                    </p>
                </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="card-bento p-8"
          >
            <h2 className="text-2xl font-heading font-bold text-text-main mb-6">
              Send A Message
            </h2>
            <ContactForm />
          </motion.div>
        </div>
      </section>
    </main>
  );
};

export default ContactPage;
