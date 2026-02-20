import { motion } from "framer-motion";

const AboutPage = () => {
  return (
    <div className="pt-24 pb-16 px-4 md:px-8 max-w-4xl mx-auto relative overflow-hidden">
      <div className="absolute inset-0 bg-tech-about pointer-events-none z-0" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold mb-8 text-white">About CodeLearnn</h1>

        <div className="space-y-12 text-gray-300">
          <section>
            <p className="text-lg leading-relaxed mb-6">
              CodeLearnn is a career discovery and learning pathway platform
              built for a world where skills evolve faster than traditional
              education systems.
            </p>
            <p className="leading-relaxed">
              Instead of creating new courses, CodeLearnn structures the vast
              amount of free learning content already available across the
              internet and YouTube into clear, goal-oriented learning paths
              aligned with real careers. The platform helps users explore career
              options, understand required skills, follow structured learning
              journeys, practice through projects, track progress, and build a
              living profile that reflects real proof-of-work rather than just
              certificates.
            </p>
          </section>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Why We Built It
              </h2>
              <p className="mb-4 text-gray-400">
                As students and learners ourselves, we experienced:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-neon-green mt-1">✗</span>
                  <span>Career confusion</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-neon-green mt-1">✗</span>
                  <span>Unstructured online learning</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-neon-green mt-1">✗</span>
                  <span>
                    Difficulty understanding what skills actually matter
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-neon-green mt-1">✗</span>
                  <span>A gap between learning and real employability</span>
                </li>
              </ul>
              <p className="mt-4 font-medium text-white">
                CodeLearnn was created to solve this problem at a system level.
              </p>
            </div>

            <div className="bg-white/5 p-6 rounded-xl border border-white/10 flex flex-col justify-center">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Our Vision
              </h2>
              <blockquote className="text-xl italic text-gray-300 border-l-4 border-neon-green pl-4 mb-4">
                "To build career infrastructure for a fast-changing world."
              </blockquote>
              <p>
                A system that continuously adapts as technology evolves and
                supports lifelong learning, career switching, and skill
                validation.
              </p>
            </div>
          </div>

          <section className="bg-black/40 p-8 rounded-2xl border border-white/5">
            <h2 className="text-2xl font-semibold text-white mb-4">Company</h2>
            <p className="mb-2 text-lg">
              <span className="font-bold text-white">Elytron</span> is the
              company behind CodeLearnn, focused on building long-term,
              impact-driven technology solutions for education and
              employability.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default AboutPage;
