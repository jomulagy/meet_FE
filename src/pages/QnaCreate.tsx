import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { server } from "@/utils/axios";
import FooterNav from "../components/FooterNav";

const QnaCreate: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});

  const validate = () => {
    const nextErrors: { title?: string; content?: string } = {};

    if (!title.trim()) {
      nextErrors.title = "제목을 입력해 주세요.";
    }

    if (content.trim().length < 10) {
      nextErrors.content = "내용은 10글자 이상 입력해 주세요.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    server
      .post("/post/create/question", {
        data: { title: title.trim(), content: content.trim() },
      })
      .then(() => {
        alert("Q&A가 등록되었습니다.");
        navigate("/post/list");
      })
      .catch(() => {
        alert("Q&A 등록에 실패했습니다.");
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div className="min-h-screen w-full bg-[#F2F2F7]" style={{ paddingBottom: "80px" }}>
      <main className="mx-auto flex w-full max-w-screen-sm flex-col gap-6 px-4 pb-10 pt-8 sm:max-w-screen-md sm:px-6 lg:max-w-4xl">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold text-[#1C1C1E] sm:text-3xl">Q&A 작성하기</h1>
          <p className="text-[13px] text-[#8E8E93] sm:text-[14px]">
            궁금한 내용을 입력하면 답변을 받을 수 있어요.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-[18px] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-left text-lg font-semibold text-[#1C1C1E] sm:text-xl">
                질문 내용
              </h2>
              <span className="text-[12px] font-medium text-[#8E8E93]">필수</span>
            </div>

            <div className="mt-4 space-y-4 text-left">
              <div className="space-y-2">
                <label className="text-xs text-[#8E8E93] sm:text-sm">제목</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 text-base font-semibold focus:outline-none sm:text-lg ${
                    errors.title
                      ? "border-[#FF6B6B] bg-[#FFF5F5]"
                      : "border-[#E5E5EA] bg-[#F9F9FB] focus:border-[#5856D6]"
                  }`}
                  placeholder="질문 제목을 입력하세요"
                />
                {errors.title && <p className="text-[12px] text-[#FF6B6B]">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs text-[#8E8E93] sm:text-sm">내용</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  className={`w-full resize-none rounded-xl border px-4 py-3 text-sm font-medium focus:outline-none sm:text-base ${
                    errors.content
                      ? "border-[#FF6B6B] bg-[#FFF5F5]"
                      : "border-[#E5E5EA] bg-[#F9F9FB] focus:border-[#5856D6]"
                  }`}
                  placeholder="10글자 이상 입력해 주세요."
                />
                {errors.content && (
                  <p className="text-[12px] text-[#FF6B6B]">{errors.content}</p>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-[#5856D6] px-6 py-4 text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(88,86,214,0.35)] transition hover:bg-[#4B49C6] disabled:cursor-not-allowed disabled:bg-[#C7C7CC]"
          >
            작성하기
          </button>
        </form>
      </main>

      <FooterNav />
    </div>
  );
};

export default QnaCreate;
