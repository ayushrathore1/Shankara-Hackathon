import React from 'react';
import { motion } from 'framer-motion';

const TermsPage = () => {
  return (
    <div className="pt-24 pb-16 px-4 md:px-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold mb-2 text-white">
          Terms & Conditions
        </h1>
        <p className="text-gray-400 mb-8">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="space-y-8 text-gray-300">
          <section>
            <p className="mb-4">
              These Terms and Conditions govern your use of Medha, a product owned and operated by Elytron. By accessing or using the platform, you agree to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Platform Purpose</h2>
            <p className="mb-4">Medha provides:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Career discovery and guidance</li>
              <li>Structured learning paths using publicly available content</li>
              <li>Skill tracking, project collaboration, and profile creation</li>
            </ul>
            <p className="font-medium text-neon-green/80">
              The platform does not guarantee employment, certifications, or job placement outcomes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. User Responsibilities</h2>
            <p className="mb-4">By using Medha, you agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate information</li>
              <li>Use the platform for lawful and educational purposes only</li>
              <li>Not misuse, scrape, reverse-engineer, or disrupt platform functionality</li>
              <li>Respect other users and community guidelines</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Intellectual Property</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Medha’s platform design, systems, structure, and branding belong to Elytron</li>
              <li>Users retain ownership of their original projects and submissions</li>
              <li>Third-party learning content remains the property of its respective owners</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Accounts & Access</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Users are responsible for maintaining the confidentiality of their accounts</li>
              <li>Elytron reserves the right to suspend or terminate accounts for misuse or policy violations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Disclaimer & Limitation of Liability</h2>
            <p className="mb-4">Medha is provided “as is”. Elytron is not liable for:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Learning outcomes or career decisions</li>
              <li>External content accuracy</li>
              <li>Losses resulting from reliance on platform recommendations</li>
            </ul>
            <p>Users are encouraged to apply independent judgment.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Modifications to Service</h2>
            <p>
              We may modify, suspend, or discontinue parts of the platform at any time to improve functionality or security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Governing Law</h2>
            <p>
              These Terms are governed by the laws applicable in India, without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Contact</h2>
            <p>
              For any questions regarding these terms, please contact us at: <a href="mailto:engineeratmedha@gmail.com" className="text-neon-green hover:underline">engineeratmedha@gmail.com</a>
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default TermsPage;
