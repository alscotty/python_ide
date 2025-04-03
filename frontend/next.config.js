/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // Format: {NEXT_PUBLIC_API_URL}:8000/:path*
        // Example: http://localhost:8000/execute or http://54.215.251.174:8000/execute
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost'}:8000/:path*`
      }
    ];
  },
  // Allow cross-origin requests in development
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'development' ? '*' : process.env.NEXT_PUBLIC_FRONTEND_URL || '*'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig; 