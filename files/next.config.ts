/** @type {import('next').NextConfig} */
const nextConfig = {
  // aptos-x402 and @aptos-labs/ts-sdk are ESM — Next 15 handles them natively.
  // No transpilePackages or webpack overrides required.
  reactStrictMode: true,
};

export default nextConfig;
