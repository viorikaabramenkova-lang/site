import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { polyfill } from "mobile-drag-drop";
import "mobile-drag-drop/default.css";

// Polyfill HTML5 Drag and Drop for mobile/touch devices
polyfill({
  dragImageCenterOnTouch: true,
});

// Optionally prevent overscroll on iOS during drag
window.addEventListener("touchmove", function() {}, {passive: false});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
