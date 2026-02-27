import React from 'react';
import { motion } from 'framer-motion';

const CookiePolicyPage = () => {
  return (
    <div className="pt-24 pb-16 px-4 md:px-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold mb-2 text-white">
          Cookie Policy
        </h1>
        <p className="text-gray-400 mb-8">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="space-y-8 text-gray-300">
          <section>
            <p className="mb-4">
              This Cookie Policy explains how Elytron uses cookies and similar technologies on Medha to provide, improve, and secure the platform.
            </p>
            <p className="font-medium text-white">
              By continuing to use Medha, you agree to the use of cookies as described in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. What Are Cookies?</h2>
            <p>
              Cookies are small text files stored on your device when you visit a website. They help websites remember user preferences, enhance functionality, and analyze usage patterns to improve user experience.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Cookies</h2>
            <p className="mb-4">Medha uses cookies for the following purposes:</p>
            
            <h3 className="text-xl font-medium text-white mb-2">a. Essential Cookies</h3>
            <p className="mb-2">These cookies are required for basic platform functionality, including:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>User authentication and session management</li>
              <li>Security and fraud prevention</li>
              <li>Page navigation and core features</li>
            </ul>
            <p className="mb-4 text-sm text-gray-400">Without these cookies, the platform may not function properly.</p>

            <h3 className="text-xl font-medium text-white mb-2">b. Performance & Analytics Cookies</h3>
            <p className="mb-2">These cookies help us understand how users interact with Medha by collecting anonymized usage data such as:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Pages visited</li>
              <li>Time spent on the platform</li>
              <li>Feature usage patterns</li>
            </ul>
            <p className="mb-4 text-sm text-gray-400">This information helps us improve platform performance, usability, and learning experience.</p>

            <h3 className="text-xl font-medium text-white mb-2">c. Functional Cookies</h3>
            <p className="mb-2">Functional cookies allow the platform to:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Remember user preferences</li>
              <li>Maintain learning progress and saved paths</li>
              <li>Improve personalized experiences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Third-Party Cookies</h2>
            <p>
              Medha may use limited third-party services (such as analytics or embedded content platforms) that set their own cookies. We do not control these cookies and recommend reviewing the privacy policies of those third-party services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Managing Cookies</h2>
            <p className="mb-4">
              You can control or disable cookies through your browser settings. Please note that disabling certain cookies may affect platform functionality and user experience.
            </p>
            <p className="mb-2">Common browser settings allow you to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Delete existing cookies</li>
              <li>Block future cookies</li>
              <li>Receive alerts before cookies are stored</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Data Protection & Privacy</h2>
            <p>
              Cookies do not store sensitive personal information such as passwords. Any data collected through cookies is handled in accordance with our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Updates to This Cookie Policy</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes in technology, law, or platform functionality. Continued use of Medha after updates constitutes acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Contact</h2>
            <p>
              If you have questions about our use of cookies, please contact: <a href="mailto:engineeratmedha@gmail.com" className="text-neon-green hover:underline">engineeratmedha@gmail.com</a>
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default CookiePolicyPage;
