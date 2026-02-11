import { useState } from "react";
import { motion } from "framer-motion";
import { contactAPI } from "../../services/api";

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      setStatus({
        type: "error",
        message: "Please fill in all required fields.",
      });
      return;
    }

    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const response = await contactAPI.submit(formData);
      setStatus({ type: "success", message: response.data.message });
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="name" className="text-slate text-sm font-mono block">
          Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Your name"
          required
          disabled={loading}
          className="w-full font-mono text-sm"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-slate text-sm font-mono block">
          Email *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@email.com"
          required
          disabled={loading}
          className="w-full font-mono text-sm"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="subject" className="text-slate text-sm font-mono block">
          Subject
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          placeholder="Message subject"
          disabled={loading}
          className="w-full font-mono text-sm"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="message" className="text-slate text-sm font-mono block">
          Message *
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Your message..."
          required
          disabled={loading}
          rows={5}
          className="w-full resize-y min-h-[120px] font-mono text-sm"
        />
      </div>

      {status.message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded font-mono text-sm ${
            status.type === "error"
              ? "bg-red-500/10 border border-red-500/30 text-red-400"
              : "bg-green/10 border border-green/30 text-green"
          }`}
        >
          {status.message}
        </motion.div>
      )}

      <motion.button
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-green text-navy font-mono font-semibold rounded transition-all hover:bg-accent-hover disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send Message"}
      </motion.button>
    </form>
  );
};

export default ContactForm;
