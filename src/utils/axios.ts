import type { AxiosInstance, AxiosRequestConfig } from "axios";
import axios from "axios";
import ServerError from "@/types/serverError";

const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL,

});
const whiteList = ["/auth/login","/auth/token/refresh"]
// 요청 인터셉터
api.interceptors.request.use(
  function (config) {
    if (config.url != null && whiteList.includes(config.url)) {
      return config;
    }
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken || accessToken === undefined) {
      window.location.href = "/auth/login";
    }
    config.headers["Authorization"] = `${accessToken}`;
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 추가
api.interceptors.response.use(
  (response) => {
    console.log("[axiost.tsx.api] response : ",response.data)
    if(response.data.code === "200"){
      console.log("[axiost.tsx.api] success")
      return response.data;
    }

    //200이 아니면 error로 취급
    return Promise.reject(new ServerError(
      response.data.message,
      response.data.code,
      response.data.data
    ));
  },
  async (error) => {
    console.log("[axiost.tsx.api] err : ",error.response.status)
    // 401 오류 발생 시
    if (error.response && error.response.status === 401) {
      // 로컬 스토리지에서 리프레시 토큰 가져오기
      const refreshToken = localStorage.getItem("refreshToken");
      // /auth/token/refresh 엔드포인트로 POST 요청 보내기
      server
        .post("/auth/token/refresh", {
          data: {
            refreshToken: refreshToken,
          },
        })
        .then((response) => {
          console.log("[axiost.tsx.api.response.use.then] refresh : ",response.data)
          // 새 액세스 토큰 저장
          localStorage.setItem("accessToken", response.data.grantType + " " + response.data.accessToken);
          // 새 리프레시 토큰 저장
          localStorage.setItem("refreshToken", response.data.refreshToken);

          // 원래 요청 다시 시도
          error.config.headers[
            "Authorization"
          ] = `Bearer ${response.data.accessToken}`;
          return api(error.config);
        })
        .catch((refreshError) => {
          console.log("[axiost.tsx.api] refresh : ",refreshError)
          // 리프레시 토큰 요청 실패 시 로그인 페이지로 리디렉션
          window.location.href = "/auth/login";
          return Promise.reject(refreshError);
        });
    }

    // 다른 오류 유형은 그대로 전파
    return Promise.reject(error);
  }
);
type HTTPMethod = "get" | "post" | "patch" | "put" | "delete";

const attachMethod =
  (method: HTTPMethod) =>
  (axiosInstance: AxiosInstance) =>
  <T = any>(
    url: string,
    config?: Omit<AxiosRequestConfig, "url" | "method">
  ): Promise<T> =>
    axiosInstance(url, { method, ...config });

export const server = {
  get: attachMethod("get")(api),
  post: attachMethod("post")(api),
  patch: attachMethod("patch")(api),
  put: attachMethod("put")(api),
  delete: attachMethod("delete")(api),
} as const;
