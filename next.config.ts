import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // jsPDF ships a Node.js bundle that uses Worker from fflate/node.cjs,
  // which breaks SSR. Force Turbopack to always use the browser UMD build.
  turbopack: {
    resolveAlias: {
      jspdf: "./node_modules/jspdf/dist/jspdf.umd.min.js",
    },
  },
};

export default nextConfig;
