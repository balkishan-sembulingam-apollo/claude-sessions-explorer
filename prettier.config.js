/**
 * Prettier configuration.
 *
 * Values left unset fall back to Prettier's defaults, which already encode
 * sensible best practices. Only the Tailwind plugin (class sorting) and a
 * couple of explicit, team-friendly defaults are declared here.
 *
 * @see https://prettier.io/docs/options
 * @type {import("prettier").Config}
 */
const config = {
  // Match Prettier's defaults explicitly so the intent is self-documenting.
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 80,
  tabWidth: 2,

  // Auto-sort Tailwind classes. Pointing at the CSS entry lets the plugin
  // resolve the v4 theme and any custom utilities defined there.
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindStylesheet: "./app/app.css",
};

export default config;
