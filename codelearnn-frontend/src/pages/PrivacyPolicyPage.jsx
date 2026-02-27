import React from 'react';
import { motion } from 'framer-motion';

const PrivacyPolicyPage = () => {
  return (
    <div className="pt-24 pb-16 px-4 md:px-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold mb-2 text-white">
          Privacy Policy
        </h1>
        <p className="text-gray-400 mb-8">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="space-y-8 text-gray-300">
          <section>
            <p className="mb-4">
              At Elytron, we respect your privacy and are committed to protecting the personal information of users of our product, Medha. This Privacy Policy explains how we collect, use, store, and safeguard information when you access or use the Medha platform.
            </p>
            <p>
              By using Medha, you agree to the practices described in this Privacy Policy.
            </p>
          </section>

          {/* Section 1: Information We Collect */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Information We Collect</h2>
            <p className="mb-4">We collect only the information necessary to provide and improve the platform.</p>
            
            <h3 className="text-xl font-medium text-white mb-2">a. Personal Information</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Name and email address</li>
              <li>Account and profile details voluntarily provided by you</li>
              <li>Learning preferences, career interests, and saved progress</li>
            </ul>

            <h3 className="text-xl font-medium text-white mb-2">b. Usage & Technical Information</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Device and browser information</li>
              <li>IP address</li>
              <li>Pages visited, features used, and interaction data</li>
              <li>Performance and diagnostic data for reliability and security</li>
            </ul>

            <h3 className="text-xl font-medium text-white mb-2">c. User-Generated Content</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Learning progress and completed learning paths</li>
              <li>Skill assessments and scores</li>
              <li>Project submissions, collaboration data, and feedback</li>
              <li>Profile information generated through platform usage</li>
            </ul>
          </section>

          {/* Section 2: How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
            <p className="mb-4">We use collected information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, operate, and maintain the Medha platform</li>
              <li>Personalize learning paths and career recommendations</li>
              <li>Track learning progress and skill development</li>
              <li>Enable collaboration, project sharing, and profile creation</li>
              <li>Improve platform performance, reliability, and security</li>
              <li>Communicate important updates, support responses, and service notices</li>
            </ul>
            <p className="mt-4 font-medium text-neon-green/80">We do not sell, rent, or trade user data.</p>
          </section>

          {/* Section 3: Third-Party Content & External Resources */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Third-Party Content & External Resources</h2>
            <p className="mb-4">
              Medha organizes and recommends publicly available learning resources, including content hosted on third-party platforms such as YouTube.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Medha does not host, store, download, reproduce, or modify third-party content.</li>
              <li>All third-party content remains hosted on its original platforms.</li>
              <li>Ownership and rights remain with the original creators or rights holders.</li>
              <li>External platforms operate under their own privacy policies and terms.</li>
              <li>Users are encouraged to review third-party policies before engaging with external content.</li>
            </ul>
          </section>

          {/* Section 4: Use of YouTube API Services */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Use of YouTube API Services</h2>
            <p className="mb-4">
              Medha uses the YouTube Data API, provided by Google LLC, to access publicly available video metadata for content analysis, recommendation, and learning path structuring.
            </p>
            <p className="mb-4">By using Medha, you acknowledge and agree that:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Medha uses YouTube API Services in accordance with the YouTube API Services Terms of Service.</li>
              <li>Medha's use and transfer of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements.</li>
              <li>Medha does not store, download, or host YouTube videos.</li>
              <li>Video playback, where applicable, occurs only through YouTube's official embedded player or by redirecting users to YouTube.</li>
              <li>Medha does not block advertisements, modify playback, or bypass YouTube platform safeguards.</li>
              <li>Ownership and rights of all YouTube content remain with the original creators and YouTube.</li>
            </ul>
            <p className="mb-2">You may review:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Google Privacy Policy: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-neon-green hover:underline">https://policies.google.com/privacy</a></li>
              <li>YouTube Terms of Service: <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="text-neon-green hover:underline">https://www.youtube.com/t/terms</a></li>
            </ul>
          </section>

          {/* Section 5: Data Accessed via YouTube API */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Data Accessed via YouTube API</h2>
            <p className="mb-4">Using the YouTube Data API, Medha may access publicly available metadata, including:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Video titles and descriptions</li>
              <li>Channel names</li>
              <li>View counts, likes, and comment counts</li>
              <li>Publish dates</li>
              <li>Public comments (where applicable)</li>
            </ul>
            <p className="mb-2">This data is used solely to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Analyze content quality and relevance</li>
              <li>Determine freshness or outdatedness</li>
              <li>Recommend appropriate learning resources</li>
              <li>Improve learning path accuracy and user experience</li>
            </ul>
          </section>

          {/* Section 6: Storage & Use of YouTube Data */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Storage & Use of YouTube Data</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Medha stores only the minimum metadata necessary to provide its services.</li>
              <li>YouTube data is not used for advertising, marketing, resale, or unauthorized profiling.</li>
              <li>Cached data is refreshed or removed in compliance with YouTube API policies.</li>
              <li>No private or non-public YouTube account data is accessed or stored.</li>
            </ul>
          </section>

          {/* Section 7: User Data & YouTube API Limitations */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. User Data & YouTube API Limitations</h2>
            <p className="mb-4">Medha does not:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Access private YouTube account information</li>
              <li>Access watch history, subscriptions, or playlists</li>
              <li>Post, upload, or modify content on behalf of users</li>
              <li>Modify or interact with YouTube user accounts</li>
            </ul>
            <p>A YouTube account login is not required to use Medha's core features.</p>
          </section>

          {/* Section 8: Data Security */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Data Security</h2>
            <p>
              We implement reasonable technical and organizational measures to protect user information from unauthorized access, loss, misuse, or alteration. However, no online system can guarantee absolute security.
            </p>
          </section>

          {/* Section 9: User Rights */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. User Rights</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Access or update your personal information</li>
              <li>Request deletion of your account and associated data</li>
              <li>Withdraw consent where applicable</li>
            </ul>
            <p>
              Requests may be submitted by contacting: <a href="mailto:engineeratmedha@gmail.com" className="text-neon-green hover:underline">engineeratmedha@gmail.com</a>
            </p>
          </section>

          {/* Section 10: Independence & Disclaimer */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Independence & Disclaimer</h2>
            <p className="mb-4">
              Medha is an independent platform and is not affiliated with, endorsed by, or sponsored by YouTube or Google.
            </p>
            <p>
              Any analysis, scoring, or recommendations provided by Medha represent independent assessments and do not reflect the opinions or positions of YouTube, Google, or content creators.
            </p>
          </section>

          {/* Section 11: Updates to This Privacy Policy */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Updates to This Privacy Policy</h2>
            <p>
              This Privacy Policy may be updated periodically to reflect changes in technology, legal requirements, platform functionality, or third-party policies. Continued use of Medha after updates constitutes acceptance of the revised Privacy Policy.
            </p>
          </section>

          {/* Section 12: Contact */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">12. Contact</h2>
            <p>
              For privacy-related questions or concerns, please contact: <a href="mailto:engineeratmedha@gmail.com" className="text-neon-green hover:underline">engineeratmedha@gmail.com</a>
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default PrivacyPolicyPage;
