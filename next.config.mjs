/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Don't hold optimized copies of local images. When you overwrite a file
    // in /public/images (same name), a normal reload will pick up the new one
    // instead of serving a stale cached version. (Tune/remove for production.)
    minimumCacheTTL: 0,
  },
  allowedDevOrigins: ['http://10.5.0.2:3000'],
};

export default nextConfig;
