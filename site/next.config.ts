import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/hackney-cinema-calendar",
  trailingSlash: true,
  output: "export",
  reactStrictMode: true,
  sassOptions: {
    silenceDeprecations: ["legacy-js-api"],
  },
};

export default nextConfig;
