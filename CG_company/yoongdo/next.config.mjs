/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    esmExternals: false
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
  transpilePackages: ['lightweight-charts'],
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || '/api';
    return [
      {
        source: '/api/:path*',
        destination: `${apiBase}/:path*`
      }
    ];
  }
};

export default nextConfig;