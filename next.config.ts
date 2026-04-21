/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Zvýšime limit na 10 MB (alebo viac podľa potreby)
    },
  },
};

export default nextConfig;