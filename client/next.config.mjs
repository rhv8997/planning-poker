/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  output: 'export',
  basePath: '/planning-poker',
  assetPrefix: '/planning-poker/',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
