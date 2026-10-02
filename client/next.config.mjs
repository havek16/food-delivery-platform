/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: new URL("../", import.meta.url).pathname,
  images: {
    // Product art is generated on the server (no CDN yet); paths stay relative
    // so Next's optimizer would have nothing remote to fetch.
    remotePatterns: [],
    unoptimized: true,
  },
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
    return [
      {
        source: "/api/:path*",
        destination: `${apiBase}/:path*`,
      },
    ];
  },
};

export default nextConfig;