// 挂载新标签页的 React 根节点。
import { createRoot } from "react-dom/client";
import App from "./app";
import "./app.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("找不到新标签页挂载节点");
}

createRoot(container).render(<App />);
