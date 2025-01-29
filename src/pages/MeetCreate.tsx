import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import FooterNav from "../components/FooterNav";
import { server } from "@/utils/axios";
import SearchPopup from "../components/popUp/PlaceSearch"; // 팝업 컴포넌트

const MeetCreate: React.FC = () => {
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [place, setPlace] = useState<{ name: string; xPos: string; yPos: string }>({
        name: "",
        xPos: "",
        yPos: "",
    }); // 장소 정보
    const [content, setContent] = useState("");
    const [isDateTimeDisabled, setIsDateTimeDisabled] = useState<boolean>(false);
    const [isPlaceDisabled, setIsPlaceDisabled] = useState<boolean>(false);
    const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false); // 팝업 상태
    const navigate = useNavigate();

    const today = new Date();
    today.setHours(0, 0, 0, 0);  // 오늘 날짜의 시간 부분을 00:00:00으로 설정
    const todayISOString = today.toLocaleDateString("en-CA");  // "YYYY-MM-DD" 형식으로 변환 (로컬 시간대)


    const handleCreate = () => {
        if (!title) {
            alert("제목은 필수 입력 항목입니다.");
            return;
        }
        if (!isDateTimeDisabled && (!date || !time)) {
            alert("날짜와 시간은 필수 입력 항목입니다.");
            return;
        }
        if (!isPlaceDisabled && !place.name) {
            alert("장소는 필수 입력 항목입니다.");
            return;
        }

        // type을 체크박스 상태에 따라 설정
        // const type = isDateTimeDisabled || isPlaceDisabled ? "Routine" : "CUSTOM";

        const payload = {
            title,
            type: "CUSTOM", 
            date: date || null,
            time: time || null,
            place: isPlaceDisabled
                ? null
                : place,
            content,
        };

        server
            .post("/meet", {
                data: payload,
            })
            .then(() => {
                alert("만남이 생성되었습니다!");
                navigate("/");
            })
            .catch((error) => {
                console.error(error);
                if (error.code === "403") {
                    navigate("/Unauthorized");
                } else if (error.code === "404") {
                    navigate("/not-found");
                } else {
                    alert("만남 생성에 실패했습니다.");
                }
            });
    };

    const handlePopupSelect = (location: { x: string; y: string; address: string }) => {
        setPlace({
            name: location.address,
            xPos: location.x,
            yPos: location.y,
        });
        setIsPopupOpen(false);
    };

    return (
        <div className="min-h-screen w-full flex flex-col" style={{ backgroundColor: "#F2F2F7" }}>
            <div className="flex flex-col items-start m-8 pb-16 space-y-4">
                <h1 className="text-2xl font-bold pl-4">모임 생성</h1>
                <div className="w-full bg-white p-6 rounded-[24px] space-y-6 text-left">
                    <div>
                        <label className="text-sm text-[#8E8E93] flex items-center">
                            제목<span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-2 block w-full text-[18px] font-bold bg-transparent"
                            placeholder="제목을 입력하세요"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-[#8E8E93] flex items-center justify-between">
                            <span>날짜<span className="text-red-500 ml-1">*</span></span>
                            <span style={{ fontSize: "14px" }}>
                                투표 하기
                                <input
                                    type="checkbox"
                                    className="ml-2 transform scale-125"
                                    checked={isDateTimeDisabled}
                                    onChange={() => setIsDateTimeDisabled(!isDateTimeDisabled)}
                                />
                            </span>
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className={`mt-2 block w-full text-[18px] font-bold 
                            ${isDateTimeDisabled ? "bg-gray-300 text-gray-400" : date ? "text-black" : "text-gray-400 bg-transparent"}`}
                            disabled={isDateTimeDisabled}
                            min={todayISOString}
                            placeholder="날짜를 선택하세요"
                        />
                        <div className="mt-4">
                            <label className="text-sm text-[#8E8E93] flex items-center justify-between">
                                <span>시간<span className="text-red-500 ml-1">*</span></span>
                            </label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className={`mt-2 block w-full text-[18px] font-bold 
                                ${isDateTimeDisabled ? "bg-gray-300 text-gray-400" : time ? "text-black" : "text-gray-400 bg-transparent"}`}
                                disabled={isDateTimeDisabled}
                                placeholder="시간을 선택하세요"
                            />
                        </div>
                    </div>


                    <div>
                        <label className="text-sm text-[#8E8E93] flex items-center justify-between">
                            <span>위치<span className="text-red-500 ml-1">*</span></span>
                            <span style={{ fontSize: "14px" }}>
                                투표 하기
                                <input
                                    type="checkbox"
                                    className="ml-2 transform scale-125"
                                    checked={isPlaceDisabled}
                                    onChange={() => setIsPlaceDisabled(!isPlaceDisabled)}
                                />
                            </span>
                        </label>
                        <div
                            className={`flex items-center justify-between mt-2 ${isPlaceDisabled ? "bg-gray-300" : "bg-transparent"
                                }`}
                        >
                            <span
                                className={`text-[18px] font-bold ${place.name ? "text-black" : "text-gray-400"
                                    }`}
                            >
                                {isPlaceDisabled ? "투표를 위해 장소를 비워두세요" : place.name || "장소를 선택해주세요"}
                            </span>
                            <button
                                type="button"
                                onClick={() => !isPlaceDisabled && setIsPopupOpen(true)}
                                className="text-[#8E8E93] bg-transparent p-0"
                                disabled={isPlaceDisabled}
                            >
                                <i className="fa-solid fa-search"></i> 검색
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm text-[#8E8E93] flex items-center">
                            내용
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => {
                                if (e.target.value.length <= 200) {
                                    setContent(e.target.value);
                                }
                            }}
                            className="mt-2 block w-full text-[18px] font-bold bg-transparent"
                            rows={4}
                            placeholder="내용을 입력하세요"
                        />
                        <p className="text-right text-sm text-[#8E8E93]">
                            {content.length}/200
                        </p>
                    </div>

                </div>
                <button
                    onClick={handleCreate}
                    className="w-full px-4 py-3 bg-[#FFE607] rounded-[24px] text-black font-bold"
                >
                    생성하기
                </button>
            </div>

            {/* 장소 검색 팝업 */}
            <SearchPopup
                isOpen={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
                onSelect={handlePopupSelect}
            />

            <FooterNav />
        </div>
    );
};

export default MeetCreate;
