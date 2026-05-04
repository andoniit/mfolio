import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ag-ui/client", "@ag-ui/core", "@ag-ui/encoder", "@ag-ui/proto"],
  webpack: function (config, context) {
    config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
    };
    return config;
},

};

export default nextConfig;
