import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ลบ output: 'export' ออกเพื่อให้ Vercel ทำ SSR ได้
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
