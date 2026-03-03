import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-bg-dark border-t border-glass-border pt-16 pb-8">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          {/* Brand Column */}
          <div className="md:col-span-1">
            <Link to="/" className="inline-flex items-center gap-1 group mb-4">
              <span className="font-mono text-text-muted-dark group-hover:text-white transition-colors">&lt;</span>
              <span className="font-mono text-white text-lg font-medium group-hover:text-accent-cyan transition-colors">Medha</span>
              <span className="font-mono text-text-muted-dark group-hover:text-white transition-colors">/&gt;</span>
            </Link>
            <p className="font-sans text-text-muted-dark text-sm max-w-[200px]">
              The Learning OS for Developers
            </p>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="font-mono text-white text-xs uppercase tracking-wider mb-6">Product</h4>
            <div className="flex flex-col gap-4">
              <Link to="/dashboard" className="font-sans text-text-muted-dark text-sm hover:text-white transition-colors">Dashboard</Link>
              <Link to="/career-discovery" className="font-sans text-text-muted-dark text-sm hover:text-white transition-colors">Career Discovery</Link>
              <Link to="/rag-mentor" className="font-sans text-text-muted-dark text-sm hover:text-white transition-colors">AI Mentor</Link>
              <Link to="/learning-paths" className="font-sans text-text-muted-dark text-sm hover:text-white transition-colors">Learning Plan</Link>
              <Link to="/leaderboard" className="font-sans text-text-muted-dark text-sm hover:text-white transition-colors">Leaderboard</Link>
              <Link to="/charcha" className="font-sans text-text-muted-dark text-sm hover:text-white transition-colors">Charcha Forum</Link>
              <Link to="/opportunities" className="font-sans text-text-muted-dark text-sm hover:text-white transition-colors">Opportunities Board</Link>
            </div>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="font-mono text-white text-xs uppercase tracking-wider mb-6">Company</h4>
            <div className="flex flex-col gap-4">
              <Link to="/about" className="font-sans text-text-muted-dark text-sm hover:text-white transition-colors">About Us</Link>
              <Link to="/our-story" className="font-sans text-text-muted-dark text-sm hover:text-white transition-colors">Our Story</Link>
              <Link to="/blog" className="font-sans text-text-muted-dark text-sm hover:text-white transition-colors">Blog</Link>
              <Link to="/outcomes" className="font-sans text-text-muted-dark text-sm group flex items-center gap-2 transition-colors hover:text-white">
                Outcomes Report
                <span className="text-accent-cyan opacity-0 group-hover:opacity-100 transition-opacity text-xs relative -left-2 top-px">←</span>
              </Link>
              <Link to="/contact" className="font-sans text-text-muted-dark text-sm hover:text-white transition-colors">Contact Us</Link>
            </div>
          </div>

          {/* Trust Column */}
          <div>
            <h4 className="font-mono text-white text-xs uppercase tracking-wider mb-6">Trust</h4>
            <div className="flex flex-col gap-4">
              <Link to="/privacy-policy" className="font-sans text-text-muted-dark text-sm hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="font-sans text-text-muted-dark text-sm hover:text-white transition-colors">Terms of Service</Link>
              <Link to="/verify" className="font-sans text-text-muted-dark text-sm group flex items-center gap-2 transition-colors hover:text-white">
                Certificate Verify
                <span className="text-accent-cyan opacity-0 group-hover:opacity-100 transition-opacity text-xs relative -left-2 top-px">←</span>
              </Link>
              <Link to="/how-ai-works" className="font-sans text-text-muted-dark text-sm group flex items-center gap-2 transition-colors hover:text-white">
                How Our AI Works
                <span className="text-accent-cyan opacity-0 group-hover:opacity-100 transition-opacity text-xs relative -left-2 top-px">←</span>
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col items-center justify-center gap-2">
          <p className="font-sans text-text-muted-dark text-sm">
            © {new Date().getFullYear()} Medha. All rights reserved.
          </p>
          <p className="font-sans text-text-muted-dark text-sm flex items-center gap-1">
            Built in India for every developer who deserves a clear path. <span className="text-lg leading-none">🇮🇳</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
