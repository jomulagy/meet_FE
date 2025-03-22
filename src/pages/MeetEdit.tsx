import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { server } from "@/utils/axios";
import FooterNav from "../components/FooterNav";
import SearchPopup from "../components/popUp/PlaceSearch"; // 팝업 컴포넌트

const MeetEdit: React.FC = () => {
  const navigate = useNavigate();
  const { meetId } = useParams(); //meetId 가져오기

  // 초기 상태를 빈 문자열이나 빈 객체로 설정
  const [title, setTitle] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [place, setPlace] = useState<{ name: string; xPos: string | null; yPos: string | null, type: string}>({
    name: "", 
    xPos: "", 
    yPos: "",
    type: ""
  }); // 선택된 장소
  const [content, setContent] = useState<string>("");
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false); // 팝업 상태

  //meetId가 있을 경우 데이터 가져오기
  useEffect(() => {
    if (meetId) {
      // 비동기 데이터 가져오기
      server
        .get(`/meet?meetId=${meetId}`) //meetId에 해당하는 정보 get
        .then((response) => {
          setTitle(response.data.title || "");
          setDate(response.data.date?.value || "");
          setTime(response.data.date?.time || "");
          setPlace({
            name: response.data.place?.name || "",
            xPos: response.data.place?.xPos || "",
            yPos: response.data.place?.yPos || "",
            type : response.data.place?.type
          });
          setContent(response.data.content || "");
        })
        .catch((error) => {
          if (error.code === "403") {
            navigate("/Unauthorized");
          } else if (error.code === "404") {
            navigate("/not-found");
          }
        });
    } else {
      navigate("/not-found"); //meetId가 없으면 
    }
  }, [meetId]);

  //폼 제출 헨들러
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    //제목 값이 비어있지 않은지 확인하고 submit
    if (!title.trim()) {
      alert("제목을 입력해 주세요");
      return; // 제목이 없으면 제출하지 않음
    }

    //place 객체가 올바르게 채워졌는지 확인
    if (!place.name || !place.xPos || !place.yPos) {
      alert("장소 정보를 정확하게 입력해 주세요");
      return;
    }

    //서버로 데이터를 전송
    server
      .put(`/meet?meetId=${meetId}`, {
        data: {
          title,
          content,
          date,
          time,
          place, //place 객체를 그대로 전달
        },
      })
      .then(() => {
        navigate(`/meet/${meetId}`); //저장 성공 하면 모임 상세로 가는 navigate
      })
      .catch((error) => {
        console.error(error);
        if (error.code === "403") {
          navigate("/Unauthorized");
        } else if (error.code === "404") {
          navigate("/not-found");
        }
      });
  };

  //장소선택
  const handlePopupSelect = (location: { x: string | null; y: string | null; address: string, type: string }) => {
    setPlace({
      name: location.address, //선택된 장소명
      xPos: location.x , //xPos 값
      yPos: location.y , //yPos 값 이렇게 하는 게 맞나?
      type : location.type
    });
    setIsPopupOpen(false);
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ backgroundColor: "#F2F2F7" }}
    >
      <div className="flex flex-col items-start m-8">
        <h1 className="text-2xl font-bold pl-4 mb-4">모임 정보 수정</h1>
        <form
          className="w-full bg-white p-6 rounded-[24px] space-y-2"
          onSubmit={handleSubmit}
        >
          <div>
            <label className="block text-[13px] text-[#8E8E93] text-left">
              제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 block w-full text-[18px] font-bold bg-transparent"
            />
          </div>

          <div>
            <label className="block text-[13px] text-[#8E8E93] text-left">
              날짜
            </label>
            <input
              id="dateInput"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-2 mt-2 block w-full text-[18px] font-bold bg-transparent"
            />
          </div>

          <div>
            <label className="block text-[13px] text-[#8E8E93] text-left">
              시간
            </label>
            <input
              id="timeInput"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-2 block w-full text-[18px] font-bold bg-transparent"
            />
          </div>

          <div>
            <label className="block text-[13px] text-[#8E8E93] text-left">
              위치
            </label>
            <div className="flex items-center justify-between mt-2">
              <span
                className={`text-[18px] font-bold ${place.name ? "text-black" : "text-gray-400"
                  }`}
              >
                {place.name || "장소를 선택해주세요"}
              </span>
              <button
                type="button"
                onClick={() => setIsPopupOpen(true)}
                className="text-[#8E8E93] bg-transparent p-0"
              >
                <i className="fa-solid fa-search"></i> 검색
              </button>
            </div>
          </div>


          <div>
            <label className="block text-[13px] text-[#8E8E93] text-left">
              내용
            </label>
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-2 pl-2 block w-full text-[18px] font-bold bg-transparent"
            />
          </div>
        </form>
        <button
          type="submit"
          className="w-full h-[55px] bg-[#FFE607] p-2 mt-6 rounded-[24px] text-black text-[16px] font-bold"
          onClick={handleSubmit}
        >
          저장하기
        </button>
      </div>

      {/* 팝업 컴포넌트 추가 */}
      <SearchPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)} // 팝업 닫기
        onSelect={handlePopupSelect} // 장소 선택 핸들러
      />

      <FooterNav />
    </div>
  );
};

export default MeetEdit;
