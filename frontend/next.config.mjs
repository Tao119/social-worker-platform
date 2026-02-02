/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel deployment configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
