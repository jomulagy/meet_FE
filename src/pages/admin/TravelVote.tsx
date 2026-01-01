import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { server } from "@/utils/axios";
import FooterNav from "../../components/FooterNav";

const TravelVote = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleVoteSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim()) {
      alert("투표 제목을 입력해 주세요");
      return;
    }

    if (!content.trim()) {
      alert("투표 내용을 입력해 주세요");
      return;
    }

    setIsSubmitting(true);

    server
      .post("/post/create/vote", { data: { title: title.trim(), content: content.trim() } })
      .then(() => {
        alert("여행 투표가 생성되었습니다.");
        navigate("/post/list");
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

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#F2F2F7" }}>
      <div className="mx-auto flex w-full max-w-screen-sm flex-col gap-6 px-4 pb-24 pt-8 sm:max-w-screen-md sm:px-6 sm:pb-28 sm:pt-10 lg:max-w-4xl">
        <header className="space-y-1 text-left sm:space-y-2">
          <h1 className="text-2xl font-bold text-[#1C1C1E] sm:text-3xl">여행 투표 생성</h1>
          <p className="text-[13px] text-[#8E8E93] sm:text-[14px]">
            여행 안내를 투표 형식으로 공유하세요. 마감일 없이 제목과 내용만 입력해요.
          </p>
        </header>

        <form onSubmit={handleVoteSubmit} className="space-y-4">
          <div className="rounded-[18px] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-left text-lg font-semibold text-[#1C1C1E] sm:text-xl">투표 정보</h2>
              <span className="text-[12px] font-medium text-[#8E8E93]">필수</span>
            </div>
            <div className="mt-4 space-y-4 text-left">
              <div className="space-y-2">
                <label className="text-xs text-[#8E8E93] sm:text-sm">투표 제목</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-base font-semibold focus:border-[#FFE607] focus:outline-none sm:text-lg"
                  placeholder="여행 투표 제목을 입력하세요"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#8E8E93] sm:text-sm">투표 내용</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  className="w-full resize-none rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-sm font-medium focus:border-[#FFE607] focus:outline-none sm:text-base"
                  placeholder="여행과 관련된 내용을 입력하세요"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 rounded-[14px] border border-[#E5E5EA] bg-white px-4 py-3 text-[14px] font-semibold text-[#1C1C1E] transition hover:border-[#C7C7CC]"
            >
              이전으로
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-[14px] bg-[#5856D6] px-4 py-3 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#4C4ACB] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "생성 중..." : "투표 생성"}
            </button>
          </div>
        </form>
      </div>

      <FooterNav />
    </div>
  );
};

export default TravelVote;
