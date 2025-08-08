/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n: {
    locales: ["en-US", "en-UK", "ja", "zh", "es", "ar"],
    defaultLocale: "en-US",
    localeDetection: true
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload"
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "X-Frame-Options",
            value: "DENY"
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block"
          },
          {
            key: "Referrer-Policy",
            value: "same-origin"
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline';"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
