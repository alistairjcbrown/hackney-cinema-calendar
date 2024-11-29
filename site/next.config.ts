import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/hackney-cinema-calendar",
  output: "export",
  reactStrictMode: true,
  sassOptions: {
    silenceDeprecations: ["legacy-js-api"],
  },
};

export default nextConfig;
