import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { server } from "@/utils/axios";
import FooterNav from "../../components/FooterNav";
import SearchPopup from "../../components/popUp/PlaceSearch";

type VotePlace = { name: string; xPos: string; yPos: string };
type VoteStep = "vote" | "deadline";

const MeetVote = () => {
  const navigate = useNavigate();
  const [hasPrivilege, setHasPrivilege] = useState<boolean | undefined>(undefined);
  const [activeStep, setActiveStep] = useState<VoteStep>("vote");
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [voteTitle, setVoteTitle] = useState<string>("");
  const [voteDate, setVoteDate] = useState<string>("");
  const [voteTime, setVoteTime] = useState<string>("");
  const [votePlace, setVotePlace] = useState<VotePlace>({
    name: "",
    xPos: "",
    yPos: "",
  });
  const [voteContent, setVoteContent] = useState<string>("");
  const [voteDeadline, setVoteDeadline] = useState<string>("");
  const [participationDeadline, setParticipationDeadline] = useState<string>("");

  const isLoading = useMemo(() => hasPrivilege === undefined, [hasPrivilege]);

  useEffect(() => {
    fetchPrevilege();
  }, []);

  useEffect(() => {
    if (hasPrivilege === undefined) {
      return;
    }

    if (!hasPrivilege) {
      window.location.href = "/Unauthorized";
      return;
    }
  }, [hasPrivilege]);

  const fetchPrevilege = async () => {
    await server
      .get("/member/previllege")
      .then((response) => {
        setHasPrivilege(response.data.previllege === "admin");
      })
      .catch(() => {
        setHasPrivilege(false);
      });
  };

  const isSchedulePairIncomplete = useMemo(() => {
    return (voteDate && !voteTime) || (!voteDate && voteTime);
  }, [voteDate, voteTime]);

  const resetVoteForm = () => {
    setVoteTitle("");
    setVoteDate("");
    setVoteTime("");
    setVotePlace({ name: "", xPos: "", yPos: "" });
    setVoteContent("");
  };

  const resetDeadlineForm = () => {
    setVoteDeadline("");
    setParticipationDeadline("");
  };

  const handleNextStep = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!voteTitle.trim()) {
      alert("투표 제목을 입력해 주세요");
      return;
    }

    if (isSchedulePairIncomplete) {
      alert("날짜와 시간은 함께 입력하거나 비워 주세요");
      return;
    }

    setActiveStep("deadline");
  };

  const handlePreviousStep = () => {
    setActiveStep("vote");
  };

  const handleVoteSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!voteDeadline || !participationDeadline) {
      alert("투표 마감일과 참여 여부 마감일을 모두 선택해 주세요");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      title: voteTitle.trim(),
      date: voteDate || null,
      time: voteTime || null,
      place: votePlace.name ? votePlace : null,
      content: voteContent,
      voteDeadline,
      participationDeadline,
    };

    server
      .post("/meet", {
        data: payload,
      })
      .then((response) => {
        const createdMeetId = response.data?.meetId ?? response.data?.id;

        resetVoteForm();
        resetDeadlineForm();
        setActiveStep("vote");

        if (createdMeetId) {
          navigate(`/meet/${createdMeetId}`);
          return;
        }

        alert("투표가 생성되었습니다.");
        navigate("/");
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

  const handlePopupSelect = (location: { x: string; y: string; address: string }) => {
    setVotePlace({
      name: location.address,
      xPos: location.x,
      yPos: location.y,
    });
    setIsPopupOpen(false);
  };

  const renderVoteStep = () => (
    <form className="space-y-6" onSubmit={handleNextStep}>
      <div className="space-y-2 text-left">
        <label className="text-xs text-[#8E8E93] sm:text-sm">투표 제목<span className="ml-1 text-[#FF3B30]">*</span></label>
        <input
          type="text"
          value={voteTitle}
          onChange={(e) => setVoteTitle(e.target.value)}
          placeholder="투표 제목을 입력하세요"
          className="w-full rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-base font-semibold focus:border-[#FFE607] focus:outline-none sm:text-lg"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 text-left sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs text-[#8E8E93] sm:text-sm">날짜</label>
          <input
            type="date"
            value={voteDate}
            onChange={(e) => setVoteDate(e.target.value)}
            className="w-full rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-base font-semibold focus:border-[#FFE607] focus:outline-none sm:text-lg"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-[#8E8E93] sm:text-sm">시간</label>
          <input
            type="time"
            value={voteTime}
            onChange={(e) => setVoteTime(e.target.value)}
            className="w-full rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-base font-semibold focus:border-[#FFE607] focus:outline-none sm:text-lg"
          />
        </div>
      </div>
      {isSchedulePairIncomplete && (
        <p className="text-left text-xs text-[#FF3B30] sm:text-sm">날짜와 시간은 함께 입력해야 합니다.</p>
      )}

      <div className="space-y-2 text-left">
        <label className="text-xs text-[#8E8E93] sm:text-sm">장소</label>
        <div className="relative">
          <input
            type="text"
            readOnly
            value={votePlace.name}
            onFocus={() => setIsPopupOpen(true)}
            onClick={() => setIsPopupOpen(true)}
            placeholder="장소를 선택해 주세요"
            className="w-full cursor-pointer rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-base font-semibold text-left focus:border-[#FFE607] focus:outline-none sm:text-lg"
          />
          {votePlace.name && (
            <button
              type="button"
              onClick={() => setVotePlace({ name: "", xPos: "", yPos: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#514BC7] hover:text-[#1C1C1E] sm:text-sm"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2 text-left">
        <label className="text-xs text-[#8E8E93] sm:text-sm">내용</label>
        <textarea
          value={voteContent}
          onChange={(e) => setVoteContent(e.target.value)}
          placeholder="투표 내용을 입력하세요"
          rows={4}
          className="w-full resize-none rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-sm font-medium focus:border-[#FFE607] focus:outline-none sm:text-base"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 pt-4">
        <button
          type="button"
          onClick={() => navigate("/admin")}
          className="w-full rounded-[16px] bg-[#EAE9FF] px-5 py-3 text-xs font-semibold text-[#4C4ACB] transition hover:bg-[#dcdaf9] sm:text-sm"
        >
          이전
        </button>
        <button
          type="button"
          onClick={resetVoteForm}
          className="w-full rounded-[16px] border border-[#E5E5EA] bg-white px-5 py-3 text-xs font-semibold text-[#1C1C1E] transition hover:border-[#C7C7CC] sm:text-sm"
        >
          초기화
        </button>
        <button
          type="submit"
          className="col-span-2 w-full rounded-[16px] bg-[#5856D6] px-5 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#4C4ACB] disabled:cursor-not-allowed disabled:opacity-70 sm:col-span-1 sm:text-sm"
        >
          다음
        </button>
      </div>
    </form>
  );

  const renderDeadlineStep = () => (
    <form className="space-y-6" onSubmit={handleVoteSubmit}>
      <div className="space-y-2 text-left">
        <label className="text-xs text-[#8E8E93] sm:text-sm">투표 마감일<span className="ml-1 text-[#FF3B30]">*</span></label>
        <input
          type="date"
          value={voteDeadline}
          onChange={(e) => setVoteDeadline(e.target.value)}
          className="w-full rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-base font-semibold focus:border-[#FFE607] focus:outline-none sm:text-lg"
        />
      </div>
      <div className="space-y-2 text-left">
        <label className="text-xs text-[#8E8E93] sm:text-sm">참여 여부 마감일<span className="ml-1 text-[#FF3B30]">*</span></label>
        <input
          type="date"
          value={participationDeadline}
          onChange={(e) => setParticipationDeadline(e.target.value)}
          className="w-full rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-base font-semibold focus:border-[#FFE607] focus:outline-none sm:text-lg"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 pt-4">
        <button
          type="button"
          onClick={handlePreviousStep}
          className="w-full rounded-[16px] bg-[#EAE9FF] px-5 py-3 text-xs font-semibold text-[#4C4ACB] transition hover:bg-[#dcdaf9] sm:text-sm"
        >
          이전
        </button>
        <button
          type="button"
          onClick={resetDeadlineForm}
          className="w-full rounded-[16px] border border-[#E5E5EA] bg-white px-5 py-3 text-xs font-semibold text-[#1C1C1E] transition hover:border-[#C7C7CC] sm:text-sm"
        >
          초기화
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="col-span-2 w-full rounded-[16px] bg-[#5856D6] px-5 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#4C4ACB] disabled:cursor-not-allowed disabled:opacity-70 sm:col-span-1 sm:text-sm"
        >
          {isSubmitting ? "생성 중..." : "투표 생성"}
        </button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#F2F2F7" }}>
      <div className="mx-auto flex w-full max-w-screen-sm flex-col gap-6 px-4 pb-20 pt-8 sm:max-w-screen-md sm:px-6 sm:pb-24 sm:pt-10 lg:max-w-4xl">
        <h1 className="text-left text-2xl font-bold text-[#1C1C1E] sm:text-3xl">회식 투표 생성</h1>

        {isLoading && (
          <div className="rounded-[24px] bg-white p-6 text-center text-[#8E8E93]">
            관리자 권한을 확인하는 중입니다...
          </div>
        )}

        {!isLoading && hasPrivilege && (
          <section className="space-y-4">
            <div className="rounded-[24px] bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between text-xs text-[#8E8E93] sm:text-sm">
                <span>STEP {activeStep === "vote" ? "1" : "2"} / 2</span>
                <span>{activeStep === "vote" ? "투표 생성" : "투표 마감 관리"}</span>
              </div>
              <h2 className="mt-3 text-left text-lg font-semibold text-[#1C1C1E] sm:text-xl">
                {activeStep === "vote" ? "투표 생성" : "투표 마감 관리"}
              </h2>
            </div>

            <div className="rounded-[24px] bg-white p-5 shadow-sm sm:p-6">
              {activeStep === "vote" ? renderVoteStep() : renderDeadlineStep()}
            </div>
          </section>
        )}
      </div>

      <SearchPopup isOpen={isPopupOpen && activeStep === "vote"} onClose={() => setIsPopupOpen(false)} onSelect={handlePopupSelect} />

      <FooterNav />
    </div>
  );
};

export default MeetVote;
