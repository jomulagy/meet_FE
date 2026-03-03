// src/utils/AuthInterceptor.tsx
import React, { ReactNode, useEffect, useState } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";

interface AuthInterceptorProps {
  children?: ReactNode;
}

// 인증이 필요 없는 공개 페이지 목록
const PUBLIC_PATHS = ["/auth/login", "/auth/kakao/redirect"];

const AuthInterceptor: React.FC<AuthInterceptorProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // 초기 렌더링 시 즉시 토큰 체크
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(() => {
    const currentPath = window.location.pathname;
    if (PUBLIC_PATHS.includes(currentPath)) return true;

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      console.log("[AuthInterceptor] Initial check: No token found");
      return false;
    }

    return true;
  });

  useEffect(() => {
    const checkAuth = () => {
      const currentPath = location.pathname;

      // 공개 페이지는 인증 체크 없이 통과
      if (PUBLIC_PATHS.includes(currentPath)) {
        setIsAuthenticated(true);
        return;
      }

      // 토큰 확인
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        console.log("[AuthInterceptor] No token found, redirecting to login");
        setIsAuthenticated(false);
        navigate("/auth/login", { replace: true, state: { from: location } });
        return;
      }

      // 토큰이 있으면 통과
      setIsAuthenticated(true);
    };

    checkAuth();
  }, [location.pathname, navigate, location]);

  // 인증 체크 전이거나 인증 실패 시 로딩 표시
  if (isAuthenticated === null || (isAuthenticated === false && !PUBLIC_PATHS.includes(location.pathname))) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#F2F2F7]">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-[#E5E5EA] border-t-[#5856D6]" />
        <p className="mt-4 text-[13px] text-[#8E8E93]">인증 확인 중...</p>
      </div>
    );
  }

  // 인증 성공 시에만 페이지 렌더링
  return <>{children || <Outlet />}</>;
};

export default AuthInterceptor;
