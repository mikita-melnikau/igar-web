// eslint-disable-next-line @typescript-eslint/no-require-imports
const { config } = require("./config");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  async rewrites() {
    return [
      {
        source: "/upload/:path*",
        destination: `${config.SOURCE_WEBSITE}/upload/:path*`,
      },
      {
        source: "/local/templates/:path*",
        destination: `${config.SOURCE_WEBSITE}/local/templates/:path*`,
      },
    ];
  },

  env: {
    BUILD_ID: process.env.NEXT_PUBLIC_APP_VERSION || "dev-" + Date.now(),
  },
};

module.exports = nextConfig;
