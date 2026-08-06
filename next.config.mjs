/** @type {import('next').NextConfig} */

// `minimumCacheTTL: 0` exists purely for the local image-editing workflow:
// overwrite a file in /public/images under the same name and a plain reload
// shows the new one instead of a stale optimized copy.
//
// It must NOT ship to production. On a hosted deployment (Vercel included) a
// zero TTL means every request re-runs image optimization instead of serving a
// cached variant — slower pages and, on metered plans, a bill for work that
// should have been cached once. Applied in development only.
const isDev = process.env.NODE_ENV === 'development';

const nextConfig = {
  images: {
    ...(isDev ? { minimumCacheTTL: 0 } : {}),
  },
  // LAN access during development (e.g. testing on a phone). Ignored in builds.
  allowedDevOrigins: ['http://10.5.0.2:3000'],
};

export default nextConfig;
