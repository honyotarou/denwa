import type { NextConfig } from 'next';
import { buildSecurityHeaders } from './src/server/security-headers';

const isProduction = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  transpilePackages: ['@openpbx/core', '@openpbx/db', '@openpbx/infra', '@openpbx/ops'],
  serverExternalPackages: ['better-sqlite3'],
  async headers() {
    const security = buildSecurityHeaders(isProduction);
    return [
      {
        source: '/:path*',
        headers: Object.entries(security).map(([key, value]) => ({ key, value })),
      },
    ];
  },
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
    };
    return config;
  },
};

export default nextConfig;
