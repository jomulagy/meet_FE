// src/App.tsx
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import router from "./utils/router";
import React, { useEffect } from "react";
import AuthInterceptor from "./utils/authInterceptor";
import { NotFound } from "./pages/Exceptions/notFound";

function App() {
  useEffect(() => {
    if (!window.Lenis) {
      return;
    }

    const lenis = new window.Lenis({
      smoothWheel: true,
      lerp: 0.12,
      wheelMultiplier: 1.1,
      touchMultiplier: 1.1,
    });

    let animationFrameId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      animationFrameId = requestAnimationFrame(raf);
    };

    animationFrameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(animationFrameId);
      lenis.destroy();
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthInterceptor />}>
          {router.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>
        <Route path="*" element={<NotFound />} /> // 404 경로 추가
      </Routes>
    </BrowserRouter>
  );
}

export default App;
