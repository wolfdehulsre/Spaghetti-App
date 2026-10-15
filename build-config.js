const fs = require("node:fs");
const path = require("node:path");
const env = { ...process.env };
const envFile = path.join(__dirname, ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && !match[1].startsWith("#") && env[match[1]] === undefined) env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}
const required = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "GROUP_ID"];
const missing = required.filter((key) => !env[key]);
if (missing.length) {
  console.error("Missing configuration: " + missing.join(", ") + ". Copy .env.example to .env and fill these values.");
  process.exit(1);
}
const config = { supabaseUrl: env.SUPABASE_URL, supabaseAnonKey: env.SUPABASE_ANON_KEY, groupId: env.GROUP_ID, geoapifyApiKey: env.GEOAPIFY_API_KEY || "" };
fs.writeFileSync(path.join(__dirname, "runtime-config.js"), "window.APP_CONFIG = " + JSON.stringify(config) + ";\n", { encoding: "utf8", mode: 0o600 });
console.log("Wrote runtime-config.js. It contains public, browser-restricted keys; never add a service-role key.");

