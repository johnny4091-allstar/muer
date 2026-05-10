/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://streamzone.example.com",
  generateRobotsTxt: true,
  exclude: ["/admin/*", "/api/*", "/messages/*", "/settings/*"],
  robotsTxtOptions: {
    policies: [
      { userAgent: "*", allow: "/" },
      { userAgent: "*", disallow: ["/admin/", "/api/", "/messages/"] },
    ],
  },
};
