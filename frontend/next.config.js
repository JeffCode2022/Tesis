/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  async rewrites() {
    console.log('[NEXT.JS] Configurando rewrites para API');
    return [
      {
        source: '/api/medical-records/validation/validate',
        destination: 'http://localhost:8000/api/medical-records/validation/validate/',
      },
      {
        source: '/api/medical-records/validation/validate/',
        destination: 'http://localhost:8000/api/medical-records/validation/validate/',
      },
      {
        source: '/api/medical-records/validation/test_prediction',
        destination: 'http://localhost:8000/api/medical-records/validation/test_prediction/',
      },
      {
        source: '/api/medical-records/validation/test_prediction/',
        destination: 'http://localhost:8000/api/medical-records/validation/test_prediction/',
      },
      {
        source: '/api/medical-records/validation/:path*',
        destination: 'http://localhost:8000/api/medical-records/validation/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: 'http://localhost:3000' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ]
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
}

module.exports = nextConfig 