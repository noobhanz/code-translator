import type {
  ApplicationAreaCategory,
  ExternalServiceCategory,
  DataStoreCategory,
} from "@codetranslate/core";

export interface ServiceCatalogEntry {
  name: string;
  packages: string[];
  category: ExternalServiceCategory;
  area?: ApplicationAreaCategory;
  dataStore?: DataStoreCategory;
}

export const SERVICE_CATALOG: ServiceCatalogEntry[] = [
  { name: "OpenAI", packages: ["openai"], category: "ai", area: "ai" },
  { name: "Anthropic", packages: ["@anthropic-ai/sdk"], category: "ai", area: "ai" },
  { name: "Google Gemini", packages: ["@google/generative-ai"], category: "ai", area: "ai" },
  { name: "Mistral", packages: ["@mistralai/mistralai"], category: "ai", area: "ai" },
  { name: "Groq", packages: ["groq-sdk"], category: "ai", area: "ai" },
  { name: "OpenRouter", packages: ["@openrouter/sdk"], category: "ai", area: "ai" },
  { name: "Stripe", packages: ["stripe"], category: "payments", area: "payments" },
  {
    name: "Clerk",
    packages: ["@clerk/nextjs", "@clerk/clerk-react", "@clerk/clerk-sdk-node"],
    category: "auth",
    area: "authentication",
  },
  {
    name: "Auth.js",
    packages: ["next-auth", "@auth/core"],
    category: "auth",
    area: "authentication",
  },
  {
    name: "Supabase",
    packages: ["@supabase/supabase-js"],
    category: "database",
    area: "database",
    dataStore: "hosted-backend",
  },
  {
    name: "Firebase",
    packages: ["firebase", "firebase-admin"],
    category: "database",
    area: "authentication",
    dataStore: "hosted-backend",
  },
  {
    name: "Prisma",
    packages: ["@prisma/client", "prisma"],
    category: "database",
    area: "database",
    dataStore: "data-access-layer",
  },
  {
    name: "Drizzle",
    packages: ["drizzle-orm"],
    category: "database",
    area: "database",
    dataStore: "data-access-layer",
  },
  {
    name: "MongoDB",
    packages: ["mongodb", "mongoose"],
    category: "database",
    area: "database",
    dataStore: "document-database",
  },
  {
    name: "PostgreSQL",
    packages: ["pg", "postgres"],
    category: "database",
    area: "database",
    dataStore: "relational-database",
  },
  {
    name: "MySQL",
    packages: ["mysql", "mysql2"],
    category: "database",
    area: "database",
    dataStore: "relational-database",
  },
  {
    name: "SQLite",
    packages: ["better-sqlite3", "sqlite3"],
    category: "database",
    area: "database",
    dataStore: "local-database",
  },
  { name: "Resend", packages: ["resend"], category: "email", area: "email" },
  { name: "SendGrid", packages: ["@sendgrid/mail"], category: "email", area: "email" },
  { name: "Postmark", packages: ["postmark"], category: "email", area: "email" },
  { name: "Nodemailer", packages: ["nodemailer"], category: "email", area: "email" },
  {
    name: "PostHog",
    packages: ["posthog-js", "posthog-node"],
    category: "analytics",
    area: "analytics",
  },
  {
    name: "Mixpanel",
    packages: ["mixpanel", "mixpanel-browser"],
    category: "analytics",
    area: "analytics",
  },
  {
    name: "Sentry",
    packages: ["@sentry/nextjs", "@sentry/node", "@sentry/react"],
    category: "error-monitoring",
  },
  { name: "Algolia", packages: ["algoliasearch"], category: "other", area: "search" },
];

export const AREA_DISPLAY_NAME: Record<ApplicationAreaCategory, string> = {
  authentication: "Accounts",
  payments: "Payments",
  ai: "AI",
  database: "Data",
  "file-handling": "Files",
  email: "Email",
  analytics: "Analytics",
  search: "Search",
  "user-management": "Users",
  dashboard: "Dashboard",
  settings: "Settings",
  api: "API",
  frontend: "Website",
  admin: "Admin",
  other: "Other",
};

export const AREA_PRIORITY: ApplicationAreaCategory[] = [
  "authentication",
  "dashboard",
  "settings",
  "payments",
  "ai",
  "database",
  "file-handling",
  "email",
  "search",
  "analytics",
  "user-management",
  "admin",
  "api",
  "frontend",
  "other",
];

export function genericAreaDescription(category: ApplicationAreaCategory): string {
  switch (category) {
    case "authentication":
      return "Authentication-related code was detected.";
    case "payments":
      return "Payment-related functionality was detected.";
    case "ai":
      return "The application connects to an AI service.";
    case "database":
      return "The application contains code for storing or retrieving data.";
    case "file-handling":
      return "The application contains file handling or upload functionality.";
    case "email":
      return "The application contains email-related functionality.";
    case "analytics":
      return "The application contains analytics-related code.";
    case "search":
      return "The application contains search-related functionality.";
    case "dashboard":
      return "A dashboard area was detected.";
    case "settings":
      return "A settings area was detected.";
    default:
      return "Related application code was detected.";
  }
}

export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;
