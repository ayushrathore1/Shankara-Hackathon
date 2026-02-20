import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";
import {
  faTwitter,
  faInstagram,
  faGithub,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons";

const Footer = () => {
  const productLinks = [
    { label: "Careers", path: "/career" },
    { label: "Learning Paths", path: "/learning-paths" },
    { label: "Vault", path: "/vault" },
    { label: "Charcha", path: "/charcha" },
  ];

  // Utility tools accessible from footer
  const toolLinks = [{ label: "Analyzer", path: "/analyzer" }];

  const companyLinks = [
    { label: "About", path: "/about" },
    { label: "Contact", path: "/contact" },
    { label: "Privacy Policy", path: "/privacy-policy" },
    { label: "Terms & Conditions", path: "/terms" },
    { label: "Cookie Policy", path: "/cookie-policy" },
  ];

  const otherProductsLinks = [
    { label: "Medha Revision", href: "https://medha-revision.vercel.app/" },
  ];

  const resourceLinks = [
    { label: "Blogs", path: "/blogs" },
    { label: "Opportunities", path: "/opportunities" },
    {
      label: "Jaipur Internships Guide",
      path: "/resources/jaipur-internships-guide",
    },
  ];

  const learningGuideLinks = [
    { label: "The Vibe Coding Playbook", path: "/learning-guides/vibe-coding" },
  ];

  const socialLinks = [
    {
      icon: faTwitter,
      href: "https://x.com/ayushrathore_27",
      label: "Twitter",
    },
    {
      icon: faInstagram,
      href: "https://www.instagram.com/ayush.rathore27",
      label: "Instagram",
    },
    {
      icon: faGithub,
      href: "https://github.com/ayushrathore1",
      label: "GitHub",
    },
    {
      icon: faLinkedin,
      href: "https://www.linkedin.com/in/ayushrathore1",
      label: "LinkedIn",
    },
  ];

  // Footer links are always clickable; protected routes handle auth gating.

  return (
    <footer className="bg-bg-base border-t border-border pt-16 pb-8">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-16">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link
              to="/"
              className="font-heading font-bold text-xl text-text-main inline-block mb-4"
            >
              <span className="text-primary">&lt;</span>
              <span className="text-metallic">CodeLearnn</span>
              <span className="text-secondary">/&gt;</span>
            </Link>
            <p className="text-text-muted text-sm leading-relaxed mb-6 max-w-sm">
              The Learning Operating System for developers. Structure your
              learning, understand deeply, build your career.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-9 h-9 rounded-lg bg-bg-elevated border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary transition-all shadow-sm"
                >
                  <FontAwesomeIcon icon={social.icon} className="text-sm" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-heading font-semibold text-text-main text-sm uppercase tracking-wider mb-4">
              Product
            </h4>
            <div className="space-y-3">
              {productLinks.map((link, index) => (
                <Link
                  key={index}
                  to={link.path}
                  className="block text-text-muted text-sm hover:text-primary transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Tools Links - Utility tools like Analyzer */}
          <div>
            <h4 className="font-heading font-semibold text-text-main text-sm uppercase tracking-wider mb-4">
              Tools
            </h4>
            <div className="space-y-3">
              {toolLinks.map((link, index) => (
                <Link
                  key={index}
                  to={link.path}
                  className="block text-text-muted text-sm hover:text-primary transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-heading font-semibold text-text-main text-sm uppercase tracking-wider mb-4">
              Company
            </h4>
            <div className="space-y-3">
              {companyLinks.map((link, index) => (
                <Link
                  key={index}
                  to={link.path}
                  className="block text-text-muted text-sm hover:text-primary transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="font-heading font-semibold text-text-main text-sm uppercase tracking-wider mb-4">
              Resources
            </h4>
            <div className="space-y-3">
              {resourceLinks.map((link, index) => (
                <Link
                  key={index}
                  to={link.path}
                  className="block text-text-muted text-sm hover:text-primary transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ))}

              <h4 className="font-heading font-semibold text-text-main text-sm uppercase tracking-wider mt-6 mb-4">
                Learning Guides
              </h4>
              <div className="space-y-3">
                {learningGuideLinks.map((link, index) => (
                  <Link
                    key={index}
                    to={link.path}
                    className="block text-text-muted text-sm hover:text-primary transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <h4 className="font-heading font-semibold text-text-main text-sm uppercase tracking-wider mt-6 mb-4">
                Other
              </h4>
              <div className="space-y-3">
                {otherProductsLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-text-muted text-sm hover:text-primary transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-heading font-semibold text-text-main text-sm uppercase tracking-wider mb-4">
              Newsletter
            </h4>
            <div className="bg-bg-elevated/50 p-4 rounded-xl border border-border/50">
              <p className="text-text-muted text-sm mb-4">
                Get updates on new paths.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const email = e.target.email.value;
                  window.open(
                    `https://supascribe.com/subscribe/HZMknBal8Ccqxhli1c2yImX8PDb2?email=${encodeURIComponent(email)}`,
                    "_blank",
                  );
                }}
                className="flex flex-col gap-3"
              >
                <input
                  type="email"
                  name="email"
                  placeholder="Enter email"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-bg-base border border-border text-text-main placeholder:text-text-dim focus:outline-none focus:border-primary/50 text-sm"
                />
                <button
                  type="submit"
                  className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-bg-base font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-text-dim text-xs font-mono">
            © {new Date().getFullYear()} CodeLearnn. Built by Elytron.
          </p>
          <div className="flex items-center gap-6 text-text-dim text-xs font-mono">
            <a
              href="mailto:engineeratcodelearnn@gmail.com"
              className="hover:text-primary transition-colors flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faEnvelope} />
              engineeratcodelearnn@gmail.com
            </a>
            <span className="flex items-center gap-2">
              <FontAwesomeIcon icon={faMapMarkerAlt} />
              Jaipur, India
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
