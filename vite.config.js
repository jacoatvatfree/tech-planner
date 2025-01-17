import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.PORT) || 5173,
    host: true, // This allows the server to be accessible from any device on the network
    strictPort: true, // This makes Vite fail if the port is already in use
  },
});
