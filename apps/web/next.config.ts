import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@openpbx/core', '@openpbx/db', '@openpbx/infra'],
  serverExternalPackages: ['better-sqlite3'],
  webpack: (config) => {
    // workspace packages use TS ESM paths (*.js → *.ts); Webpack needs this alias
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
    };
    return config;
  },
};

export default nextConfig;
