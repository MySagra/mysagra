import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4300',
      },
      {
        protocol: 'http',
        hostname: 'mysagra-api',
        port: '4300',
      }
    ]
  }
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);