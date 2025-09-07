
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },
  experimental: {
    allowedDevOrigins: [
      'https://*.cluster-va5f6x3wzzh4stde63ddr3qgge.cloudworkstations.dev',
      'http://*.cluster-va5f6x3wzzh4stde63ddr3qgge.cloudworkstations.dev',
    ],
  },
};

export default nextConfig;
