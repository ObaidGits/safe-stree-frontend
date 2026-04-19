import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const backendUrl = process.env.VITE_WS_URL;

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: backendUrl,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
