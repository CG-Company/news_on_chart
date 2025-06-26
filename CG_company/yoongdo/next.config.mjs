/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
