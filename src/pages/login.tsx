import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { server } from "@/utils/axios";

const rest_api_key = import.meta.env.VITE_REST_API_KEY; //REST API KEY
const redirect_uri = import.meta.env.VITE_BASE_URL + "/auth/kakao/redirect"; //Redirect URI
const clientSecret = import.meta.env.VITE_CLIENT_SECRET;

export const Login = () => {
  // oauth 요청 URL
  const kakaoURL = `https://kauth.kakao.com/oauth/authorize?client_id=${rest_api_key}&redirect_uri=${redirect_uri}&response_type=code&scope=friends,account_email,profile_nickname,talk_message`;
  const handleLogin = () => {
    window.location.href = kakaoURL;
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col justify-center"
      style={{ backgroundColor: "#F2F2F7" }}
    >
      <div className="h-[350px] flex flex-col justify-between mx-6">
        <h2 className="font-bold text-[32px] text-left text-black leading-[1.3]">
          간편로그인 후 <br />
          이용이 <br />
          가능합니다
        </h2>
        <button
          onClick={handleLogin}
          className="w-full h-[55px] bg-[#FFE607] hover:bg-[#FFE607] rounded-[30px] text-black font-bold text-[16px] flex justify-center items-center"
        >
          <i className="fa-solid fa-comment mr-3 text-[25px]"></i>
          카카오로 계속하기
        </button>
      </div>
    </div>
  );
};

type KakaoTokens = {
  accessToken: string;
  refreshToken?: string;
};

export const KakaoCode = () => {
  const code = new URL(window.location.href).searchParams.get("code");
  const [kakaoTokens, setKakaoTokens] = useState<KakaoTokens | null>(null);
  const [isRequestingToken, setIsRequestingToken] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (code && !isRequestingToken && !kakaoTokens) {
      setIsRequestingToken(true);
      console.log("use effect executed", code, kakaoTokens);
      const fetchToken = async () => {
        const postUrl = "https://kauth.kakao.com/oauth/token";

        // URLSearchParams를 사용하여 데이터 인코딩
        const params = new URLSearchParams();
        params.append("grant_type", "authorization_code");
        params.append("client_id", rest_api_key);
        params.append("redirect_uri", redirect_uri);
        params.append("code", code);
        params.append(
          "scope",
          "friends,account_email,profile_nickname,talk_message"
        );
        params.append("client_secret", clientSecret);

        try {
          const response = await axios.post(postUrl, params, {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          });
          console.log("Token received:", response.data);
          setKakaoTokens({
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
          });
        } catch (error) {
          console.error("Error fetching token:", error);
        } finally {
          setIsRequestingToken(false);
        }
      };
      fetchToken();
    }
  }, [code, kakaoTokens, isRequestingToken]);

  useEffect(() => {
    if (kakaoTokens?.accessToken) {
      console.log("trying to connect backend server...");
      server
        .post("/auth/login", {
          data: {
            accessToken: `Bearer ${kakaoTokens.accessToken}`,
            refreshToken: kakaoTokens.refreshToken,
          },
        })
        .then((response) => {
          localStorage.setItem(
            "accessToken",
            response.data.grantType + " " + response.data.accessToken
          );
          localStorage.setItem("refreshToken", response.data.refreshToken);

          // 사용자 권한 확인
          return server.get("/member/previllege");
        })
        .then((privilegeResponse) => {
          const privilege = privilegeResponse.data.previllege;

          if (privilege === "admin" || privilege === "accepted") {
            navigate("/");
          }
        })
        .catch((error) => {
          if (error.code === "403") {
            navigate("/Unauthorized");
          }
        });
    }
  }, [kakaoTokens, navigate]);

  return <></>;
};
