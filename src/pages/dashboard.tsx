import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // useNavigate 훅 추가
import FooterNav from "../components/FooterNav";
import checkPhone from "../assets/img/check_phone.png";
import { server } from "@/utils/axios";

export const Dashboard = () => {
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  const fetchUserName = () => {
    server
      .get("/member", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })
      .then((response) => {
        if (response.data && response.data.name) {
          setUserName(response.data.name);
        } else {
          console.error("예상치 못한 응답 구조:", response.data);
        }
      })
      .catch((error) => {
        console.error("유저 정보를 불러오는 중 오류가 발생했습니다:", error);
      });
  };

  // const Buttonhandler = () => {
  //   window.location.href = 
  // }

  // 컴포넌트가 마운트될 때 사용자 이름을 가져옴
  useEffect(() => {
    fetchUserName();
  }, []); // 빈 배열로 설정하여 컴포넌트가 처음 렌더링될 때만 실행
  const handleCreateMeeting = () => {
    navigate(`/meet/create`); // '/meet/create'로 이동
  };

  return (
    <div 
      className="min-h-screen w-full flex flex-col"
      style={{ backgroundColor: "#F2F2F7", paddingBottom: "80px", position: 'relative' }}
    > 
      <h2 
        style={{ 
          fontWeight: 'bold', 
          fontSize: '24px',
          whiteSpace: 'nowrap', 
          position: 'absolute', 
          width: 'auto', 
          height: '30px', 
          top: '79px', 
          left: '15px', 
          marginLeft: '12',
          opacity: 1
        }}
      >
        🙋🏻‍♂️ {userName}님, 안녕하세요
      </h2>
      <div className="p-9 m-8 flex flex-col h-[337px] bg-white rounded-[23px] space-y-2" style={{ marginTop: '100px', position: 'relative', top: '40px' }}>
        <h1 className="text-[25px] font-bold text-black text-left">
          일정과 장소를 제안하고<br></br>
          투표를 시작하세요
        </h1>
        <div className="flex justify-center items-center h-screen">
          <img src={checkPhone} className="w-[92px] h-[109px]" alt="Check Phone" />
        </div>
        <button className="rounded-[20px] font-bold p-7 text-center flex items-center justify-center" style={{ 
          width: '282px', 
          height: '53px', 
          opacity: 1,
          backgroundColor: '#F2F2F7',
          color: '#000000',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
        }}
        onClick={handleCreateMeeting}
        >
          모임 생성하기 &gt;
        </button>
      </div>
      <FooterNav />
    </div>
  );
};
