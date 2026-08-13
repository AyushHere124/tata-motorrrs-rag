
export interface WebsiteSource {
  url: string;
  category:
    | "official"
    | "history"
    | "products"
    | "future-mobility"
    | "financial"
    | "sustainability"
    | "csr"
    | "community"
    | "news"
    | "reference";
}

const urls: WebsiteSource[] = [
  // ==========================
  // Official Website
  // ==========================

  {
    url: "https://www.tatamotors.com/",
    category: "official",
  },

  {
    url: "https://www.tatamotors.com/organisation/about-us/",
    category: "official",
  },

  {
    url: "https://www.tatamotors.com/organisation/our-history/",
    category: "history",
  },

  {
    url: "https://www.tatamotors.com/our-business/",
    category: "products",
  },

  {
    url: "https://www.tatamotors.com/future-of-mobility/",
    category: "future-mobility",
  },

  {
    url: "https://www.tatamotors.com/investors/",
    category: "financial",
  },

  {
    url: "https://www.tatamotors.com/newsroom/",
    category: "news",
  },

  // ==========================
  // Sustainability & CSR
  // ==========================

  {
    url: "https://www.tatamotors.com/corporate-responsibility/",
    category: "csr",
  },

  {
    url: "https://www.tatamotors.com/corporate-responsibility/planet-resilience/",
    category: "sustainability",
  },

  {
    url: "https://www.tatamotors.com/corporate-responsibility/working-with-communities/",
    category: "community",
  },

  {
    url: "https://www.tatamotors.com/corporate-responsibility/governance/",
    category: "csr",
  },

  // ==========================
  // Reference
  // ==========================

  {
    url: "https://en.wikipedia.org/wiki/Tata_Motors",
    category: "reference",
  },
];

export default urls;

