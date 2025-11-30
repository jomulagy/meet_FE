import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { server } from "@/utils/axios";
import SearchPopup from "../components/popUp/PlaceSearch";
import FooterNav from "../components/FooterNav";

type VotePlace = { name: string; xPos: string; yPos: string };

const VoteManage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const initialState = (state as { title?: string; budget?: string }) || {};

  const [title, setTitle] = useState<string>(initialState.title || "");
  const [budget, setBudget] = useState<string>(initialState.budget || "");
  const [month, setMonth] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [place, setPlace] = useState<VotePlace>({ name: "", xPos: "", yPos: "" });
  const [dates, setDates] = useState<string[]>([""]);
  const [participation, setParticipation] = useState<"yes" | "no">("yes");
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [isClosed, setIsClosed] = useState<boolean>(false);
  const [isPlacePickerOpen, setIsPlacePickerOpen] = useState<boolean>(false);

  const travelDateBounds = useMemo(() => {
    if (!month) {
      return null;
    }

    const [year, monthValue] = month.split("-");
    const lastDay = new Date(Number(year), Number(monthValue), 0).getDate();

    return {
      min: `${month}-01`,
      max: `${month}-${String(lastDay).padStart(2, "0")}`,
    };
  }, [month]);

  const hasValidDates = useMemo(() => dates.some((date) => date.trim() !== ""), [dates]);

  const handlePopupSelect = (location: { x: string; y: string; address: string }) => {
    setPlace({ name: location.address, xPos: location.x, yPos: location.y });
    setIsPlacePickerOpen(false);
  };

  const handleVoteSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim()) {
      alert("투표 제목을 입력해 주세요");
      return;
    }

    if (!budget.trim()) {
      alert("사용 예산을 입력해 주세요");
      return;
    }

    if (!month || !duration.trim() || !place.name || !hasValidDates) {
      alert("필수 정보를 모두 입력해 주세요");
      return;
    }

    setIsSubmitting(true);

    const sanitizedDates = dates.filter((date) => date.trim());

    const payload = {
      title: title.trim(),
      budget: budget.trim(),
      month,
      duration: duration.trim(),
      place,
      dates: sanitizedDates,
      participation,
      comment,
    };

    server
      .post("/meet/travel", { data: payload })
      .then(() => {
        alert("투표가 생성되었습니다. 참여 페이지로 이동합니다.");
        navigate("/meet/list");
      })
      .catch((error) => {
        if (error.code === "403") {
          navigate("/Unauthorized");
        } else if (error.code === "404") {
          navigate("/not-found");
        } else {
          alert("투표 생성에 실패했습니다.");
        }
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleCloseVote = () => {
    if (isClosed) {
      return;
    }

    if (!window.confirm("투표를 종료하시겠습니까?")) {
      return;
    }

    setIsClosing(true);

    server
      .post("/meet/travel/end", { data: { title, month } })
      .finally(() => {
        setIsClosing(false);
        setIsClosed(true);
      });
  };

  const handleTravelDateChange = (index: number, value: string) => {
    setDates((prev) => prev.map((date, idx) => (idx === index ? value : date)));
  };

  const addTravelDateField = () => {
    setDates((prev) => [...prev, month ? `${month}-01` : ""]);
  };

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#F2F2F7" }}>
      <div className="mx-auto flex w-full max-w-screen-sm flex-col gap-6 px-4 pb-24 pt-8 sm:max-w-screen-md sm:px-6 sm:pb-28 sm:pt-10 lg:max-w-4xl">
        <header className="space-y-2 text-left sm:space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#1C1C1E] sm:text-3xl">투표 설정</h1>
            <button
              type="button"
              onClick={handleCloseVote}
              disabled={isClosed || isClosing}
              className={`rounded-[14px] px-4 py-2 text-sm font-semibold transition-colors sm:text-base ${
                isClosed ? "bg-[#F3F4F6] text-[#9CA3AF]" : "bg-[#FF3B30] text-white hover:bg-[#e63228]"
              } disabled:cursor-not-allowed`}
            >
              {isClosed ? "종료됨" : isClosing ? "종료 중..." : "투표 종료"}
            </button>
          </div>
          <p className="text-sm text-[#636366] sm:text-base">
            항목별로 정보를 입력한 뒤 저장하세요. 투표 종료 버튼을 누르면 추가 수정이 제한됩니다.
          </p>
        </header>

        <section className="space-y-4">
          <div className="rounded-[24px] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-left text-lg font-semibold text-[#1C1C1E] sm:text-xl">기본 정보</h2>
            <p className="mt-1 text-left text-xs text-[#636366] sm:text-sm">관리자 페이지에서 입력한 정보는 여기에서 다시 수정할 수 있습니다.</p>
            <div className="mt-4 grid grid-cols-1 gap-4 text-left sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs text-[#8E8E93] sm:text-sm">투표 제목<span className="ml-1 text-[#FF3B30]">*</span></label>
                <input
                  type="text"
                  value={title}
                  disabled={isClosed}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-base font-semibold focus:border-[#FFE607] focus:outline-none disabled:cursor-not-allowed disabled:opacity-70 sm:text-lg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#8E8E93] sm:text-sm">사용 예산<span className="ml-1 text-[#FF3B30]">*</span></label>
                <input
                  type="number"
                  min="0"
                  value={budget}
                  disabled={isClosed}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-base font-semibold focus:border-[#FFE607] focus:outline-none disabled:cursor-not-allowed disabled:opacity-70 sm:text-lg"
                />
              </div>
            </div>
          </div>

          <div className="rounded-[24px] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between text-xs text-[#8E8E93] sm:text-sm">
              <span>항목 1</span>
              <span>년/월 · 기간</span>
            </div>
            <h3 className="mt-2 text-left text-lg font-semibold text-[#1C1C1E] sm:text-xl">여행 일정 범위</h3>
            <p className="mt-1 text-left text-xs text-[#636366] sm:text-sm">여행 예정 월과 기본 체류 기간을 입력하세요.</p>
            <div className="mt-4 grid grid-cols-1 gap-4 text-left sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs text-[#8E8E93] sm:text-sm">년/월<span className="ml-1 text-[#FF3B30]">*</span></label>
                <input
                  type="month"
                  value={month}
                  disabled={isClosed}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-base font-semibold focus:border-[#FFE607] focus:outline-none disabled:cursor-not-allowed disabled:opacity-70 sm:text-lg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#8E8E93] sm:text-sm">기간<span className="ml-1 text-[#FF3B30]">*</span></label>
                <input
                  type="text"
                  value={duration}
                  disabled={isClosed}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="예: 2박 3일"
                  className="w-full rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-base font-semibold focus:border-[#FFE607] focus:outline-none disabled:cursor-not-allowed disabled:opacity-70 sm:text-lg"
                />
              </div>
            </div>
          </div>

          <div className="rounded-[24px] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between text-xs text-[#8E8E93] sm:text-sm">
              <span>항목 2</span>
              <span>장소</span>
            </div>
            <h3 className="mt-2 text-left text-lg font-semibold text-[#1C1C1E] sm:text-xl">여행 장소</h3>
            <p className="mt-1 text-left text-xs text-[#636366] sm:text-sm">장소 검색 팝업을 활용해 이동할 도시나 지역을 선택하세요.</p>
            <div className="mt-4 space-y-2 text-left">
              <label className="text-xs text-[#8E8E93] sm:text-sm">예정지<span className="ml-1 text-[#FF3B30]">*</span></label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={place.name}
                  disabled={isClosed}
                  onClick={() => setIsPlacePickerOpen(true)}
                  onFocus={() => setIsPlacePickerOpen(true)}
                  placeholder="장소를 선택해 주세요"
                  className="w-full cursor-pointer rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-base font-semibold text-left focus:border-[#FFE607] focus:outline-none disabled:cursor-not-allowed disabled:opacity-70 sm:text-lg"
                />
                {place.name && !isClosed && (
                  <button
                    type="button"
                    onClick={() => setPlace({ name: "", xPos: "", yPos: "" })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#636366] hover:text-[#1C1C1E] sm:text-sm"
                  >
                    초기화
                  </button>
                )}
              </div>
              <p className="text-left text-[11px] text-[#8E8E93] sm:text-xs">필드를 선택하면 장소 검색 팝업이 열립니다.</p>
            </div>
          </div>

          <div className="rounded-[24px] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between text-xs text-[#8E8E93] sm:text-sm">
              <span>항목 3</span>
              <span>날짜 후보</span>
            </div>
            <h3 className="mt-2 text-left text-lg font-semibold text-[#1C1C1E] sm:text-xl">가능 날짜</h3>
            <p className="mt-1 text-left text-xs text-[#636366] sm:text-sm">선택한 월에서 갈 수 있는 날짜를 모아보세요.</p>
            <div className="mt-4 space-y-3">
              {dates.map((date, index) => (
                <div key={`date-${index}`} className="space-y-2 text-left">
                  <label className="text-xs text-[#8E8E93] sm:text-sm">날짜 {index + 1}</label>
                  <input
                    type="date"
                    value={date}
                    disabled={isClosed}
                    min={travelDateBounds?.min}
                    max={travelDateBounds?.max}
                    onChange={(e) => handleTravelDateChange(index, e.target.value)}
                    className="w-full rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-base font-semibold focus:border-[#FFE607] focus:outline-none disabled:cursor-not-allowed disabled:opacity-70 sm:text-lg"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addTravelDateField}
                disabled={isClosed}
                className="w-full rounded-[12px] border border-dashed border-[#E5E5EA] bg-white px-4 py-3 text-sm font-semibold text-[#3A3A3C] transition-colors hover:border-[#FFE607] hover:text-black disabled:cursor-not-allowed disabled:opacity-70"
              >
                날짜 추가
              </button>
              {!month && (
                <p className="text-left text-[11px] text-[#FF3B30] sm:text-xs">여행 예정 월을 먼저 선택하면 해당 월만 선택할 수 있습니다.</p>
              )}
            </div>
          </div>

          <div className="rounded-[24px] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between text-xs text-[#8E8E93] sm:text-sm">
              <span>항목 4</span>
              <span>참여/댓글</span>
            </div>
            <h3 className="mt-2 text-left text-lg font-semibold text-[#1C1C1E] sm:text-xl">참여 여부</h3>
            <p className="mt-1 text-left text-xs text-[#636366] sm:text-sm">참여 가능 여부와 의견을 기록하세요. 댓글로 세부 의견을 남길 수 있습니다.</p>
            <div className="mt-4 space-y-4 text-left">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setParticipation("yes")}
                  disabled={isClosed}
                  className={`rounded-[14px] px-4 py-3 text-sm font-semibold transition-colors sm:text-base ${
                    participation === "yes" ? "bg-[#FFE607] text-black" : "bg-white text-[#3A3A3C] border border-[#E5E5EA]"
                  } disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  참여 가능
                </button>
                <button
                  type="button"
                  onClick={() => setParticipation("no")}
                  disabled={isClosed}
                  className={`rounded-[14px] px-4 py-3 text-sm font-semibold transition-colors sm:text-base ${
                    participation === "no" ? "bg-[#FFE607] text-black" : "bg-white text-[#3A3A3C] border border-[#E5E5EA]"
                  } disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  참여 어려움
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-[#8E8E93] sm:text-sm">의견 / 댓글</label>
                <textarea
                  value={comment}
                  disabled={isClosed}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="여행지 제안, 이동 수단, 예산 등 의견을 남겨주세요"
                  rows={4}
                  className="w-full resize-none rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-sm font-medium focus:border-[#FFE607] focus:outline-none disabled:cursor-not-allowed disabled:opacity-70 sm:text-base"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="sticky bottom-0 left-0 right-0 -mx-4 bg-[#F2F2F7] pb-16 pt-4 sm:-mx-6 sm:pb-16 sm:pt-6">
          <div className="mx-auto flex w-full max-w-screen-sm flex-col gap-3 px-4 sm:max-w-screen-md sm:px-6 lg:max-w-4xl">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-[16px] border border-[#E5E5EA] bg-white px-5 py-3 text-xs font-semibold text-[#1C1C1E] transition-colors hover:border-[#FFE607] hover:text-black sm:px-6 sm:text-sm"
            >
              관리자 페이지로 돌아가기
            </button>
            <form onSubmit={handleVoteSubmit}>
              <button
                type="submit"
                disabled={isSubmitting || isClosed}
                className="w-full rounded-[16px] bg-[#FFE607] px-5 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:px-6 sm:text-base"
              >
                {isClosed ? "투표가 종료되었습니다" : isSubmitting ? "저장 중..." : "투표 저장"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <SearchPopup isOpen={isPlacePickerOpen} onClose={() => setIsPlacePickerOpen(false)} onSelect={handlePopupSelect} />

      <FooterNav />
    </div>
  );
};

export default VoteManage;
