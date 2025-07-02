/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // experimental: {
  //   esmExternals: false
  // },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
  transpilePackages: ['lightweight-charts'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://192.168.1.105:8000/api/:path*'
      }
    ];
  }
};

export default nextConfig;