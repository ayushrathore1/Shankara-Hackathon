import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUp,
  faCopy,
  faCheck,
  faShare,
  faBuilding,
  faEnvelope,
  faFileAlt,
  faLightbulb,
  faUsers,
  faGraduationCap,
  faChevronDown,
  faChevronUp,
  faBookmark,
  faRocket,
  faPhone,
  faGlobe,
  faExternalLinkAlt,
} from "@fortawesome/free-solid-svg-icons";
import {
  faTwitter,
  faLinkedinIn,
  faWhatsapp,
} from "@fortawesome/free-brands-svg-icons";

// Company data with full contact information
const companies = [
  {
    id: 1,
    name: "Synarion IT Solutions",
    why: "Synarion offers web, app, ERP and digital solutions and runs Synarion Academy — a training arm that frequently hosts internships and practical training. They have a dedicated internship page and are known for structured programs.",
    bestFor:
      "Beginners in web/mobile development, students needing formal internship certificates.",
    style:
      "Structured training + small project; mentorship and certificate at completion.",
    website: "https://www.synarionit.com/",
    internshipPage: "https://www.synarionit.com/internship.html",
    email: "hr@synarionit.com",
    linkedin: null,
    phones: [],
    emailTemplate: `Subject: Internship Application – <Your Name> (University timeline: <DD/MM/YYYY> to <DD/MM/YYYY>)

Hello HR Team,

My name is <Your Name>, a <year> year <branch> student at <college>. My university has approved an internship/training period from <start date DD/MM/YYYY> to <end date DD/MM/YYYY>, and I am applying for an internship at Synarion IT Solutions / Synarion Academy during this timeframe.

I am currently learning: <list basics — e.g., HTML, CSS, JavaScript, Python>. I am keen to gain hands-on exposure and follow your training curriculum.

Please find my resume attached. I would appreciate any guidance on next steps or required registration.

Thank you for your time.
Regards,
<Your Name> | <Phone> | <Email>`,
    resumeFocus:
      "One page. Highlight college, coursework, small projects, and any online course certificates. Mention willingness to attend training sessions.",
  },
  {
    id: 2,
    name: "Synarion Academy",
    why: "The dedicated training arm of Synarion IT, their academy runs formal internship/training programs and bootcamps. Perfect for structured learners who prefer a curriculum-based approach with clear milestones.",
    bestFor: "Absolute beginners who want taught training plus certificate.",
    style: "Formal training program with curriculum and certification.",
    website: "https://synarionacademy.com/",
    internshipPage: null,
    email: "hr@synarionit.com",
    linkedin: null,
    phones: [],
    emailTemplate: `Hello Team,

I am <Your Name>, <year> year student at <college>. My university permits internship from <DD/MM/YYYY> to <DD/MM/YYYY>. I would like to enroll in Synarion Academy's internship/training program for practical exposure.

Please let me know the registration steps.

Regards, <Your Name>`,
    resumeFocus:
      "Emphasize learning goals, and state you're available full-time during specified dates.",
  },
  {
    id: 3,
    name: "Groot Software",
    why: "Groot Software has a dedicated internship registration form on their website, making the application process straightforward. They accept trainees and have a structured onboarding process for interns.",
    bestFor: "Students ready to register and follow onboarding.",
    style: "Form-based registration with structured onboarding.",
    website: "https://grootsoftware.com/",
    internshipPage: "https://grootsoftware.com/internship-registration-form/",
    email: null,
    linkedin: "https://www.linkedin.com/company/grootsoftware/",
    phones: ["+91 9610967825"],
    emailTemplate: `Hello,

I have submitted the internship registration form on your website. I am <Your Name>, a <year> year student at <college>. My university-approved internship period is <DD/MM/YYYY> to <DD/MM/YYYY>. I am learning <skills> and would like to join Groot Software as an intern.

Please let me know if any documents or tests are required.

Thanks, <Your Name> | <Phone>`,
    resumeFocus:
      "Link to the form in the email (if possible) and include GitHub link or sample code (even one simple repo).",
  },
  {
    id: 4,
    name: "True Value Infosoft",
    why: "An enterprise mobile & web solutions firm with a clear careers page and explicit email instructions for internship applications. They provide corporate exposure with a formal process that prepares you for professional environments.",
    bestFor: "Students who want corporate exposure and formal process.",
    style: "Corporate internship with formal application process.",
    website: "https://truevalueinfosoft.com/",
    internshipPage: "https://truevalueinfosoft.com/careers.html",
    email: "hr@truevalueinfosoft.com",
    linkedin: "https://www.linkedin.com/company/true-value-infosoft-p-limited/",
    phones: ["+91 9057801818", "+91 9145848379"],
    emailTemplate: `Subject: Internship Application - <Your Name> (Internship Date: <DD/MM/YYYY> to <DD/MM/YYYY>)

Dear HR Team,

I am <Your Name>, a <year> year <branch> student at <college>. My university allows an internship from <start date DD/MM/YYYY> to <end date DD/MM/YYYY>. I wish to apply for an internship at True Value Infosoft to gain hands-on experience in <mention area e.g., mobile/web development>.

I have basic knowledge of <skills>. Attached is my resume.

Thank you for considering my application.

Sincerely,
<Your Name> | <Phone> | <Email>`,
    resumeFocus:
      "Clean layout, mention college approval dates, and a short line about objective (what you want to learn at True Value).",
  },
  {
    id: 5,
    name: "BR Softech",
    why: "BR Softech works in exciting domains like game development, blockchain, and mobile apps. They list careers and open roles regularly, making them ideal for students curious about emerging technologies.",
    bestFor:
      "Students interested in mobile, game dev, or multiple disciplines.",
    style: "Diverse tech exposure across game dev, blockchain, and mobile.",
    website: "https://www.brsoftech.com/",
    internshipPage: "https://www.brsoftech.com/br-careers.html",
    email: null,
    linkedin: "https://www.linkedin.com/company/br-softech/",
    phones: ["+91 7821055537"],
    emailTemplate: `Hello Team,

I am <Your Name>, <year> year student at <college>. My university-approved internship window is <DD/MM/YYYY> to <DD/MM/YYYY>. I am interested in an internship at BR Softech in <area e.g., mobile/game development>.

Attached is my resume. I am eager to learn and contribute.

Regards, <Your Name> | <Phone>`,
    resumeFocus:
      'Show small experiments (even simple game prototypes or app screenshots) and a short "What I want to learn" statement.',
  },
  {
    id: 6,
    name: "KDK Software",
    why: "KDK specializes in taxation and accounting software, offering unique exposure to the FinTech domain. Great for students interested in software for finance or those with a commerce+CS background.",
    bestFor:
      "Students with interest in FinTech or those from mixed commerce+CS backgrounds.",
    style: "FinTech focused with accounting/finance domain exposure.",
    website: "https://www.kdksoftware.com/",
    internshipPage: "https://www.kdksoftware.com/careers.php",
    email: null,
    linkedin: "https://www.linkedin.com/company/kdksoftwareindia/",
    phones: ["+91 9314517671", "+91 9314614930"],
    emailTemplate: `Subject: Internship Request – <Your Name> (Dates: <DD/MM/YYYY> to <DD/MM/YYYY>)

Hello HR,

I am <Your Name>, <year> year student from <college>. I am interested in an internship at KDK Software to learn product development focused on accounting/finance domains. My university's internship period is from <start> to <end>.

Resume attached.

Regards, <Your Name>`,
    resumeFocus:
      "Logical thinking, Excel or basic DB knowledge, any coursework related to finance, and coursework projects.",
  },
  {
    id: 7,
    name: "Pratham Software Inc (PSI)",
    why: "PSI focuses on digital products and AI/ML-enabled solutions. They regularly post open positions and are open to taking motivated trainees interested in cutting-edge technology.",
    bestFor:
      "Students with curiosity in product engineering and emerging tech.",
    style: "Product engineering with AI/ML exposure opportunities.",
    website: "https://www.thepsi.com/",
    internshipPage: "https://www.thepsi.com/careers/open-positions/",
    email: null,
    linkedin: "https://www.linkedin.com/company/pratham-software-inc/",
    phones: [],
    emailTemplate: `Hello Hiring Team,

I am <Your Name>, a <year> year <branch> student at <college>. My college permits internship from <DD/MM/YYYY> to <DD/MM/YYYY>. I'd like to apply for an internship at PSI to gain exposure to product engineering.

Attached: resume. Thank you.

Best, <Your Name>`,
    resumeFocus:
      "Problem solving, online course badges, and any hobby projects.",
  },
  {
    id: 8,
    name: "Techno Softwares",
    why: "A general web and software development company with a dedicated careers page. They're well-suited for students looking to strengthen their web development fundamentals in a professional setting.",
    bestFor: "Students learning web stacks.",
    style: "Web development focused internship.",
    website: "https://technosoftwares.com/",
    internshipPage: "https://technosoftwares.com/careers/",
    email: null,
    linkedin: null,
    phones: ["+91 8955008744"],
    emailTemplate: `Hello Team,

I'm <Your Name>, <year> year student at <college>. University-approved internship: <start DD/MM/YYYY> to <end DD/MM/YYYY>. I would like to intern at Techno Softwares, focusing on web development.

Resume attached. Regards, <Your Name>`,
    resumeFocus:
      "Link to any hosted demo (GitHub Pages, simple live site), mention basic tech learned.",
  },
  {
    id: 9,
    name: "KisTechno Software",
    why: "KIS Techno explicitly lists internship & training programs on their website. They have a career page dedicated to internships and accept college students looking for structured training.",
    bestFor: "Students needing training with placement-oriented structure.",
    style: "Training program with placement orientation.",
    website: "https://www.kistechnosoftware.in/",
    internshipPage: "https://www.kistechnosoftware.in/career#",
    email: "hr@kistechnosoftware.in",
    linkedin: "https://www.linkedin.com/company/kistechnosoftware/",
    phones: ["+91 8278617951"],
    emailTemplate: `Hello HR,

I am <Your Name>, a <year> year student at <college>. My internship window is <DD/MM/YYYY> to <DD/MM/YYYY>. Please consider me for the internship/training program at KIS Techno Software.

Attached: resume.

Thanks, <Your Name>`,
    resumeFocus: "Education, availability dates, and eagerness to learn.",
  },
  {
    id: 10,
    name: "The Web Pino",
    why: "A small, agile web development shop perfect for close-mentorship internships. In a smaller team, you'll get more hands-on experience and direct feedback from senior developers.",
    bestFor: "Beginners who want hands-on, small-team mentorship.",
    style: "Small team with close mentorship and hands-on learning.",
    website: "https://thewebpino.com/",
    internshipPage: null,
    email: "thewebpino@gmail.com",
    linkedin: null,
    phones: ["+91 7733833874", "+91 7014660763"],
    emailTemplate: `Hello,

I am <Your Name>, <year> year student at <college>. My internship dates allowed by college: <DD/MM/YYYY> to <DD/MM/YYYY>. I would like to apply for internship at The Web Pino to learn web development.

Regards, <Your Name> | <Phone>`,
    resumeFocus:
      "Showability — links to any small HTML/CSS/JS demos or coursework.",
  },
  {
    id: 11,
    name: "Provis Technologies",
    why: "Provis specializes in SaaS & web maintenance with a dedicated careers page. They're open to trainees and offer exposure to both development and operations aspects of software.",
    bestFor:
      "Students wanting SaaS exposure, maintenance, and basic backend work.",
    style: "SaaS and web maintenance with backend exposure.",
    website: "https://provistechnologies.com/",
    internshipPage: "https://provistechnologies.com/careers/",
    email: "hr@provistechnologies.com",
    linkedin: null,
    phones: ["+91 9024846380"],
    emailTemplate: `Subject: Internship Application – <Your Name> (Internship dates: <DD/MM/YYYY> to <DD/MM/YYYY>)

Hello HR,

I am <Your Name>, a <year> year student at <college>. My university allows an internship from <start> to <end>. I would like to intern with Provis Technologies in <area>.

Resume attached.

Regards, <Your Name>`,
    resumeFocus: "Willingness to learn operations and basic backend skills.",
  },
  {
    id: 12,
    name: "Softtech India",
    why: "A local web/app/digital marketing company with a clear careers page and contact information. Good for students who want diverse exposure across development and marketing.",
    bestFor: "Students interested in web dev, app dev, or digital marketing.",
    style: "Web/app development and digital marketing exposure.",
    website: "https://softtechindia.in/",
    internshipPage: "https://softtechindia.in/career.php",
    email: null,
    linkedin: null,
    phones: ["+91 9928895249"],
    emailTemplate: `Hello Team,

I am <Your Name>, <year> year student at <college>. My internship window is <DD/MM/YYYY> to <DD/MM/YYYY>. I am interested in an internship at Softtech India (area: <web/dev/marketing>).

Resume attached.

Sincerely, <Your Name>`,
    resumeFocus:
      "If applying for marketing, show social posts or small campaigns; for dev, show simple projects.",
  },
  {
    id: 13,
    name: "Compucom Software Ltd",
    why: "A larger, established firm with learning & e-governance offerings. They may accept interns for product/learning roles and provide exposure to enterprise-grade systems and processes.",
    bestFor:
      "Students seeking exposure to enterprise systems and product-based work.",
    style: "Enterprise systems and e-governance product exposure.",
    website: "https://compucom.co.in/",
    internshipPage: null,
    email: "ctg@compucom.co.in",
    linkedin: null,
    phones: ["+91 9829018135"],
    emailTemplate: `Subject: Internship Application – <Your Name> (Internship dates: <DD/MM/YYYY> to <DD/MM/YYYY>)

Dear HR,

I am <Your Name>, a <year> year student at <college>. My college has approved internship dates from <start> to <end>. I would like to apply for an internship at Compucom Software Ltd.

Attached: resume.

Regards, <Your Name>`,
    resumeFocus:
      "Professional tone and clarity, list any coursework and preferred mentor areas.",
  },
  {
    id: 14,
    name: "KPIS (Krishnapadam IT Solutions)",
    why: "A local IT solutions provider with a dedicated careers page. They offer small-team internships where you'll get quick feedback loops and hands-on project experience.",
    bestFor:
      "Students who want hands-on small projects and quick learning loops.",
    style: "Small team with quick learning cycles.",
    website: "https://www.kpis.in/",
    internshipPage: "https://www.kpis.in/career",
    email: "hr@kpis.in",
    linkedin: "https://www.linkedin.com/company/krishnapadamitsolution/",
    phones: ["+91 9024077981"],
    emailTemplate: `Hello HR,

I am <Your Name>, <year> year student from <college>. University-approved internship window: <DD/MM/YYYY> to <DD/MM/YYYY>. Please consider me for an internship at KPIS. Resume attached.

Thanks, <Your Name>`,
    resumeFocus:
      "Practical eagerness; show any class projects and exact availability dates.",
  },
  {
    id: 15,
    name: "Modern Software Technologies",
    why: "A software development firm with a solid LinkedIn presence. They're suitable for web & product internships and follow standard software engineering practices.",
    bestFor:
      "Students who want exposure to standard software engineering tasks.",
    style: "Standard software engineering practices and web/product work.",
    website: "https://modernsoftwaretechnologies.com/",
    internshipPage: null,
    email: null,
    linkedin:
      "https://www.linkedin.com/company/modern-software-technologies/about/",
    phones: ["+91 9462280393"],
    emailTemplate: `Hello Team,

I am <Your Name>, <year> year student at <college>. I am available for internship from <DD/MM/YYYY> to <DD/MM/YYYY> and would like to intern at Modern Software Technologies.

Attached is my resume.

Regards, <Your Name>`,
    resumeFocus:
      "Clear list of skills and one short sentence about what you want to learn.",
  },
  {
    id: 16,
    name: "Regex Software",
    why: "Regex runs dedicated training and industrial internship programs. They're beginner-friendly with explicit internship tracks, making them ideal for students who need structured curriculum and certification.",
    bestFor:
      "Beginners and students requiring certification and structured curriculum.",
    style: "Industrial internship program with certification.",
    website: "https://regexsoftware.com/",
    internshipPage:
      "https://regexsoftware.com/industrial-internship-training-programs/",
    email: null,
    linkedin: "https://www.linkedin.com/company/regexsoftware/",
    phones: ["+91 9602880219"],
    emailTemplate: `Hello Regex Team,

I am <Your Name>, <year> year student at <college>. My university allows internships between <DD/MM/YYYY> and <DD/MM/YYYY>. I want to enroll in your industrial internship program to gain practical skills.

Resume attached.

Thanks, <Your Name>`,
    resumeFocus: "Education details and clear internship dates.",
  },
  {
    id: 17,
    name: "Ecuzen Software",
    why: "A local software firm good for small-team training roles. You'll get direct mentoring and hands-on app/web work with close supervision from experienced developers.",
    bestFor: "Students wanting hands-on app/web work and mentoring.",
    style: "Small team with mentoring and hands-on app/web work.",
    website: "https://www.ecuzen.com/",
    internshipPage: null,
    email: null,
    linkedin: "https://www.linkedin.com/company/ecuzensoftware/",
    phones: ["+91 9549166444"],
    emailTemplate: `Hello HR,

I am <Your Name>, a <year> year student at <college>. My college-approved internship period: <DD/MM/YYYY> to <DD/MM/YYYY>. I would like to intern at Ecuzen Software.

Please advise next steps.

Regards, <Your Name>`,
    resumeFocus: "Short, clear, and show availability dates.",
  },
  {
    id: 18,
    name: "ProtoCloud Technologies",
    why: "ProtoCloud focuses on cloud/web solutions and is open to intern inquiries via LinkedIn messages or email. Great for students interested in cloud technologies and backend development.",
    bestFor: "Students interested in cloud and backend basics.",
    style: "Cloud and backend exposure with web solutions.",
    website: "https://protocloudtechnologies.com/",
    internshipPage: null,
    email: "hr@protocloudtechnologies.com",
    linkedin: "https://www.linkedin.com/company/protocloud-tech/",
    phones: ["+91 7878552382"],
    emailTemplate: `Hello HR,

I am <Your Name>, <year> year student at <college>. My internship window is <DD/MM/YYYY> to <DD/MM/YYYY>. I would like to intern at ProtoCloud to learn cloud and backend basics.

Regards, <Your Name>`,
    resumeFocus:
      "Mention availability dates and interest in cloud, Linux, basic shell, or APIs.",
  },
  {
    id: 19,
    name: "CoherentLab",
    why: "CoherentLab focuses on product engineering with a dedicated careers page. They accept intern applications and offer project-based learning opportunities in a professional environment.",
    bestFor: "Students interested in product and project exposure.",
    style: "Product engineering with project-based learning.",
    website: "https://www.coherentlab.com/",
    internshipPage: "https://www.coherentlab.com/career",
    email: "hr@coherentlab.com",
    linkedin: "https://www.linkedin.com/company/coherentlab/",
    phones: ["+91 7878739383"],
    emailTemplate: `Hello HR,

I am <Your Name>, a <year> year student at <college>. My university permits internships from <DD/MM/YYYY> to <DD/MM/YYYY>. I'd like to apply for internship at CoherentLab, focusing on product development basics.

Resume attached.

Thanks, <Your Name>`,
    resumeFocus:
      "Mention availability dates and interest in product development.",
  },
];

const universalRules = [
  {
    icon: faEnvelope,
    title: "Always include exact timeline",
    description:
      'Include the exact approved internship timeline from your college/university in the first paragraph. Example: "My university has approved an internship period from 01/06/2026 to 31/07/2026."',
  },
  {
    icon: faFileAlt,
    title: "One-page resume only",
    description:
      "Include: name, college, branch & year, mobile, email, university-approved dates, a short objective (1 line), 2–3 skills, and 1–2 small projects (or course assignments).",
  },
  {
    icon: faUsers,
    title: "Be honest & humble",
    description:
      "State what you know and what you want to learn. Companies appreciate honesty and eagerness to learn.",
  },
  {
    icon: faLightbulb,
    title: "Follow-up politely",
    description:
      "If no reply, send a polite follow-up after 7–10 days; include the original message below your follow-up for context.",
  },
  {
    icon: faBookmark,
    title: "Proper attachments",
    description: "Attach your resume as PDF named <YourName_Resume.pdf>.",
  },
  {
    icon: faRocket,
    title: "Predictable subject line",
    description:
      'Keep it exact: "Internship Application - <Your Name> - <start DD/MM/YYYY> to <end DD/MM/YYYY>"',
  },
];

// Company Card Component
const CompanyCard = ({ company, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyTemplate = () => {
    navigator.clipboard.writeText(company.emailTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative">
      {/* Glow effect - hidden on mobile for performance */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-secondary/20 to-primary/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden md:block" />

      <div className="relative bg-bg-elevated border border-border rounded-2xl overflow-hidden">
        {/* Header - Always visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-6 md:p-8 text-left flex items-start gap-5 hover:bg-bg-base/50 transition-colors touch-action-manipulation"
          style={{ touchAction: "manipulation" }}
        >
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-bg-base font-bold text-xl shrink-0">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl md:text-2xl font-bold text-text-primary group-hover:text-secondary transition-colors leading-snug">
              {company.name}
            </h3>
            <p className="text-text-secondary text-base mt-2 line-clamp-2 leading-relaxed">
              {company.why}
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-secondary/10 text-secondary border border-secondary/20">
                <FontAwesomeIcon icon={faGraduationCap} className="text-xs" />
                {company.bestFor.split(",")[0]}
              </span>
            </div>
          </div>
          <FontAwesomeIcon
            icon={isExpanded ? faChevronUp : faChevronDown}
            className="text-text-tertiary mt-2 transition-transform"
          />
        </button>

        {/* Expanded content - CSS transition for instant response */}
        <div
          className={`overflow-hidden transition-all duration-200 ease-out ${
            isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
          }`}
          style={{ willChange: isExpanded ? "max-height, opacity" : "auto" }}
        >
          {isExpanded && (
            <div className="px-6 md:px-8 pb-8 space-y-6 border-t border-border pt-6">
              {/* Best For */}
              <div>
                <h4 className="text-base font-semibold text-secondary mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faUsers} />
                  Best For
                </h4>
                <p className="text-text-secondary text-base leading-relaxed">
                  {company.bestFor}
                </p>
              </div>

              {/* Internship Style */}
              <div>
                <h4 className="text-base font-semibold text-primary mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faBuilding} />
                  Internship Style
                </h4>
                <p className="text-text-secondary text-base leading-relaxed">
                  {company.style}
                </p>
              </div>

              {/* Email Template */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-semibold text-green-400 flex items-center gap-2">
                    <FontAwesomeIcon icon={faEnvelope} />
                    Email Template
                  </h4>
                  <button
                    onClick={copyTemplate}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/10 text-secondary text-sm font-medium hover:bg-secondary/20 transition-colors"
                  >
                    <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
                    {copied ? "Copied!" : "Copy Template"}
                  </button>
                </div>
                <pre className="bg-bg-base p-5 rounded-xl text-sm text-text-secondary overflow-x-auto whitespace-pre-wrap font-mono border border-border leading-relaxed">
                  {company.emailTemplate}
                </pre>
              </div>

              {/* Resume Focus */}
              <div>
                <h4 className="text-base font-semibold text-amber-400 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faFileAlt} />
                  Resume Focus
                </h4>
                <p className="text-text-secondary text-base leading-relaxed">
                  {company.resumeFocus}
                </p>
              </div>

              {/* Contact Information - Blog Style */}
              <div className="bg-bg-base rounded-xl border border-border p-5">
                <h4 className="text-base font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                  <FontAwesomeIcon icon={faGlobe} />
                  Contact & Links
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Website */}
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated hover:bg-secondary/10 border border-border hover:border-secondary/30 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <FontAwesomeIcon
                          icon={faGlobe}
                          className="text-blue-400"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-text-primary group-hover:text-secondary transition-colors">
                          Website
                        </div>
                        <div className="text-xs text-text-tertiary truncate">
                          {
                            company.website
                              .replace("https://", "")
                              .replace("http://", "")
                              .split("/")[0]
                          }
                        </div>
                      </div>
                      <FontAwesomeIcon
                        icon={faExternalLinkAlt}
                        className="text-text-tertiary text-xs"
                      />
                    </a>
                  )}

                  {/* Internship/Careers Page */}
                  {company.internshipPage && (
                    <a
                      href={company.internshipPage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated hover:bg-green-500/10 border border-border hover:border-green-500/30 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <FontAwesomeIcon
                          icon={faGraduationCap}
                          className="text-green-400"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-text-primary group-hover:text-green-400 transition-colors">
                          Internship Page
                        </div>
                        <div className="text-xs text-text-tertiary">
                          Apply here directly
                        </div>
                      </div>
                      <FontAwesomeIcon
                        icon={faExternalLinkAlt}
                        className="text-text-tertiary text-xs"
                      />
                    </a>
                  )}

                  {/* Email */}
                  {company.email && (
                    <a
                      href={`mailto:${company.email}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated hover:bg-amber-500/10 border border-border hover:border-amber-500/30 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <FontAwesomeIcon
                          icon={faEnvelope}
                          className="text-amber-400"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-text-primary group-hover:text-amber-400 transition-colors">
                          Email HR
                        </div>
                        <div className="text-xs text-text-tertiary truncate">
                          {company.email}
                        </div>
                      </div>
                    </a>
                  )}

                  {/* LinkedIn */}
                  {company.linkedin && (
                    <a
                      href={company.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated hover:bg-[#0A66C2]/10 border border-border hover:border-[#0A66C2]/30 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#0A66C2]/20 flex items-center justify-center">
                        <FontAwesomeIcon
                          icon={faLinkedinIn}
                          className="text-[#0A66C2]"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-text-primary group-hover:text-[#0A66C2] transition-colors">
                          LinkedIn
                        </div>
                        <div className="text-xs text-text-tertiary">
                          Connect & message
                        </div>
                      </div>
                      <FontAwesomeIcon
                        icon={faExternalLinkAlt}
                        className="text-text-tertiary text-xs"
                      />
                    </a>
                  )}

                  {/* Phone Numbers */}
                  {company.phones &&
                    company.phones.length > 0 &&
                    company.phones.map((phone, idx) => (
                      <a
                        key={idx}
                        href={`tel:${phone.replace(/\s/g, "")}`}
                        className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated hover:bg-purple-500/10 border border-border hover:border-purple-500/30 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <FontAwesomeIcon
                            icon={faPhone}
                            className="text-purple-400"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-text-primary group-hover:text-purple-400 transition-colors">
                            Call/WhatsApp
                          </div>
                          <div className="text-xs text-text-tertiary">
                            {phone}
                          </div>
                        </div>
                      </a>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const JaipurInternshipsGuide = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [copied, setCopied] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setShowScrollTop(window.scrollY > 500);

          // Reading progress - simplified calculation
          const scrollTop = window.scrollY;
          const docHeight =
            document.documentElement.scrollHeight - window.innerHeight;
          if (docHeight > 0) {
            setReadingProgress(Math.min(100, (scrollTop / docHeight) * 100));
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const shareUrl = encodeURIComponent(window.location.href);
  const shareTitle = encodeURIComponent(
    "Internship & Training Opportunities in Jaipur — A Curated List for Early-Year Students",
  );

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-bg-elevated z-50">
        <div
          className="h-full bg-linear-to-r from-secondary to-primary transition-[width] duration-100"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Floating Share Sidebar - Desktop only */}
      <aside
        className="fixed left-8 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-3 animate-fade-in-left"
        style={{ animationDelay: "300ms" }}
      >
        <span className="text-xs text-text-tertiary font-medium mb-2 text-center">
          Share
        </span>
        <a
          href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-text-secondary hover:text-[#1DA1F2] hover:border-[#1DA1F2]/50 transition-all hover:scale-110"
        >
          <FontAwesomeIcon icon={faTwitter} />
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-text-secondary hover:text-[#0A66C2] hover:border-[#0A66C2]/50 transition-all hover:scale-110"
        >
          <FontAwesomeIcon icon={faLinkedinIn} />
        </a>
        <a
          href={`https://wa.me/?text=${shareTitle}%20${shareUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-text-secondary hover:text-[#25D366] hover:border-[#25D366]/50 transition-all hover:scale-110"
        >
          <FontAwesomeIcon icon={faWhatsapp} />
        </a>
        <button
          onClick={copyLink}
          className={`w-10 h-10 rounded-full bg-bg-elevated border border-border flex items-center justify-center transition-all hover:scale-110 ${
            copied
              ? "text-green-400 border-green-400/50"
              : "text-text-secondary hover:text-secondary hover:border-secondary/50"
          }`}
        >
          <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
        </button>
      </aside>

      {/* Scroll to top button - CSS only for instant response */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-40 w-12 h-12 rounded-full bg-gradient-to-r from-secondary to-primary text-bg-base shadow-lg shadow-secondary/25 flex items-center justify-center active:scale-95 transition-all duration-150 ${
          showScrollTop
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-75 pointer-events-none"
        }`}
        style={{
          touchAction: "manipulation",
          willChange: "transform, opacity",
        }}
        aria-hidden={!showScrollTop}
      >
        <FontAwesomeIcon icon={faArrowUp} />
      </button>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 overflow-hidden">
        {/* Background effects - hidden on mobile for performance */}
        <div className="absolute inset-0 pointer-events-none hidden md:block">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[128px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Badge */}
          <div className="flex justify-center mb-8 animate-fade-in-up">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-secondary to-primary text-bg-base shadow-lg">
              <FontAwesomeIcon icon={faGraduationCap} />
              For 1st & 2nd Year Students
            </span>
          </div>

          {/* Title */}
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-center text-text-primary mb-6 max-w-4xl mx-auto leading-tight animate-fade-in-up"
            style={{ animationDelay: "50ms" }}
          >
            Internship & Training Opportunities in{" "}
            <span className="text-gradient">Jaipur</span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-xl md:text-2xl text-text-secondary text-center max-w-3xl mx-auto mb-10 leading-relaxed animate-fade-in-up"
            style={{ animationDelay: "100ms" }}
          >
            A curated list of companies that run training/internship programs or
            accept junior trainees. Complete with email templates, resume tips,
            and application strategies.
          </p>

          {/* Stats */}
          <div
            className="flex flex-wrap justify-center gap-8 mb-12 animate-fade-in-up"
            style={{ animationDelay: "150ms" }}
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary">
                {companies.length}
              </div>
              <div className="text-sm text-text-tertiary">Companies Listed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {companies.length}
              </div>
              <div className="text-sm text-text-tertiary">Email Templates</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-400">6</div>
              <div className="text-sm text-text-tertiary">Universal Rules</div>
            </div>
          </div>

          {/* Mobile Share - instant tap response */}
          <div className="flex justify-center gap-4 lg:hidden">
            <a
              href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-text-secondary active:scale-95 transition-transform duration-75"
              style={{ touchAction: "manipulation" }}
            >
              <FontAwesomeIcon icon={faTwitter} className="text-lg" />
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-text-secondary active:scale-95 transition-transform duration-75"
              style={{ touchAction: "manipulation" }}
            >
              <FontAwesomeIcon icon={faLinkedinIn} className="text-lg" />
            </a>
            <a
              href={`https://wa.me/?text=${shareTitle}%20${shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-text-secondary active:scale-95 transition-transform duration-75"
              style={{ touchAction: "manipulation" }}
            >
              <FontAwesomeIcon icon={faWhatsapp} className="text-lg" />
            </a>
            <button
              onClick={copyLink}
              style={{ touchAction: "manipulation" }}
              className={`w-12 h-12 rounded-full bg-bg-elevated border border-border flex items-center justify-center active:scale-95 transition-transform duration-75 ${
                copied ? "text-green-400" : "text-text-secondary"
              }`}
            >
              <FontAwesomeIcon
                icon={copied ? faCheck : faCopy}
                className="text-lg"
              />
            </button>
          </div>
        </div>
      </section>

      {/* Universal Rules Section */}
      <section className="py-16 bg-bg-elevated/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Universal Application <span className="text-gradient">Rules</span>
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
              Follow these rules every time you apply. They&apos;ll
              significantly increase your chances of getting a response.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {universalRules.map((rule, index) => (
              <div key={index} className="group relative">
                {/* Glow effect - hidden on mobile */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-secondary/20 to-primary/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden md:block" />
                <div className="relative bg-bg-elevated border border-border rounded-2xl p-6 md:p-8 h-full">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center mb-5 md:group-hover:scale-110 transition-transform">
                    <FontAwesomeIcon
                      icon={rule.icon}
                      className="text-secondary text-xl"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-3">
                    {rule.title}
                  </h3>
                  <p className="text-text-secondary text-base leading-relaxed">
                    {rule.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Companies List Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Companies & <span className="text-gradient">Templates</span>
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
              Click on any company to expand and view the email template, resume
              tips, and more details.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-5">
            {companies.map((company, index) => (
              <CompanyCard key={company.id} company={company} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        {/* Background blur - hidden on mobile for performance */}
        <div className="absolute inset-0 pointer-events-none hidden md:block">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[128px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-6">
              Ready to Start <span className="text-gradient">Applying</span>?
            </h2>
            <p className="text-xl text-text-secondary mb-10 leading-relaxed">
              Remember: Consistency is key. Apply to multiple companies, follow
              up politely, and keep improving your skills while you wait for
              responses.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={copyLink}
                style={{ touchAction: "manipulation" }}
                className="inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 rounded-xl bg-gradient-to-r from-secondary to-primary text-bg-base font-semibold md:hover:shadow-[0_0_40px_-5px_var(--secondary-glow)] active:scale-95 transition-all duration-75 text-sm md:text-base"
              >
                <FontAwesomeIcon icon={faShare} />
                Share This Guide
              </button>
              <a
                href="https://wa.me/?text=Check%20out%20this%20amazing%20internship%20guide%20for%20Jaipur%20companies!"
                target="_blank"
                rel="noopener noreferrer"
                style={{ touchAction: "manipulation" }}
                className="inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 rounded-xl bg-bg-elevated border border-border text-text-primary font-semibold hover:border-secondary/50 active:scale-95 transition-all duration-75 text-sm md:text-base"
              >
                <FontAwesomeIcon icon={faWhatsapp} />
                Share on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-text-tertiary text-sm">
              Curated with ❤️ for early-year students in Jaipur
            </p>
            <p className="text-text-tertiary text-xs mt-2">
              © {new Date().getFullYear()} Medha. Coming Soon.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default JaipurInternshipsGuide;