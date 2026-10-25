import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App";
import store from "./redux/store";
import "./styles/global.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
    throw new Error("The root element was not found.");
}

createRoot(rootElement).render(
    <React.StrictMode>
        <Provider store={store}>
            <App />
        </Provider>
    </React.StrictMode>
);
