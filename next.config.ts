import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    // Adaugă reguli pentru a gestiona modulele Node.js care nu sunt disponibile în browser.
    // Acest lucru este necesar pentru a preveni erorile de compilare când anumite pachete
    // încearcă să acceseze API-uri specifice serverului în mediul client.
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        stream: false,
        fs: false,
      };
    }

    return config;
  },
};

export default nextConfig;
