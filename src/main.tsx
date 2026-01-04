import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app/App";
import { bootstrapApp } from "./app/bootstrap";
import "./app/styles.css";

const root = document.getElementById("root");

if (root) {
  bootstrapApp();
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
