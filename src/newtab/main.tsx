// 挂载新标签页的 React 根节点。
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/components/theme-provider";
import App from "./app";
import "@/index.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("找不到新标签页挂载节点");
}

createRoot(container).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="yew-tab-theme">
      <App />
    </ThemeProvider>
  </StrictMode>
);
