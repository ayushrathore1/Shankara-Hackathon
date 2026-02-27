import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SEO = ({
  title,
  description,
  keywords,
  image,
  type = "website",
  canonicalUrl,
  jsonLd,
}) => {
  const location = useLocation();
  const baseUrl = "https://medha.com";
  const currentUrl = canonicalUrl || `${baseUrl}${location.pathname}`;
  const defaultImage = `${baseUrl}/og-image.jpg`; // Ensure you have this image in public/

  const siteTitle =
    "Medha - The Learning Operating System for Engineering Students";
  const fullTitle = title ? `${title} | Medha` : siteTitle;
  const metaDescription =
    description ||
    "Stop learning random tutorials. Start building a real engineering career with structured learning paths, AI-powered roadmaps, and career intelligence.";

  useEffect(() => {
    const upsertMeta = (attrName, attrValue, content) => {
      let tag = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attrName, attrValue);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    const upsertLink = (rel, href) => {
      let link = document.querySelector(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", rel);
        document.head.appendChild(link);
      }
      link.setAttribute("href", href);
    };

    const upsertJsonLd = (id, data) => {
      let script = document.getElementById(id);
      if (!script) {
        script = document.createElement("script");
        script.type = "application/ld+json";
        script.id = id;
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(data);
    };

    // Standard Metadata
    document.title = fullTitle;
    upsertMeta("name", "description", metaDescription);
    if (keywords) {
      upsertMeta("name", "keywords", keywords);
    }
    upsertLink("canonical", currentUrl);

    // Open Graph
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:url", currentUrl);
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", metaDescription);
    upsertMeta("property", "og:image", image || defaultImage);
    upsertMeta("property", "og:site_name", "Medha");

    // Twitter
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:creator", "@ayushrathore_27");
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", metaDescription);
    upsertMeta("name", "twitter:image", image || defaultImage);

    // JSON-LD Structured Data
    if (jsonLd) {
      upsertJsonLd("seo-jsonld", jsonLd);
    }

    // Default Organization Schema
    upsertJsonLd("seo-org-jsonld", {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Medha",
      url: baseUrl,
      logo: `${baseUrl}/logo.png`,
      sameAs: [
        "https://x.com/ayushrathore_27",
        "https://www.linkedin.com/in/ayushrathore1",
        "https://github.com/ayushrathore1",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        email: "engineeratmedha@gmail.com",
        contactType: "customer support",
      },
    });
  }, [
    currentUrl,
    defaultImage,
    fullTitle,
    image,
    jsonLd,
    keywords,
    metaDescription,
    type,
    baseUrl,
  ]);

  return null;
};

export default SEO;
