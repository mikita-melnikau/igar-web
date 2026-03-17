// eslint-disable-next-line @typescript-eslint/no-require-imports
const { WEBSITE } = require("./app/constants/constants.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/upload/:path*",
        destination: `${WEBSITE}/upload/:path*`,
      },
      {
        source: "/local/templates/:path*",
        destination: `${WEBSITE}/local/templates/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
