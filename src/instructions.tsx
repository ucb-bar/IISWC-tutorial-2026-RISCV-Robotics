import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import InstructionsPage from "./components/InstructionsPage";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <InstructionsPage />
  </StrictMode>,
);
