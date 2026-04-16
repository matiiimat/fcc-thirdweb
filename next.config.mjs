/** @type {import('next').NextConfig} */
const nextConfig = {
  // fixes wallet connect dependency issue https://docs.walletconnect.com/web3modal/nextjs/about#extra-configuration
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "imagedelivery.net" },
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "**.farcaster.xyz" },
    ],
  },
};

export default nextConfig;
