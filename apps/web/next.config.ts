import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@openpbx/core', '@openpbx/db', '@openpbx/infra'],
};

export default nextConfig;
