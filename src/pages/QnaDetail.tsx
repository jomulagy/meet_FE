import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { server } from "@/utils/axios";
import FooterNav from "../components/FooterNav";

type QnaDetail = {
  id: string;
  title: string;
  content: string;
};

const QnaDetailPage: React.FC = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [qnaDetail, setQnaDetail] = useState<QnaDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    if (!postId) {
      navigate("/not-found");
      return;
    }

    setIsLoading(true);

    server
      .get(`/post/${postId}`)
      .then((response) => {
        const payload = response.data?.data ?? response.data;
        setQnaDetail({
          id: String(payload?.id ?? postId),
          title: payload?.title ?? "",
          content: payload?.content ?? "",
        });
      })
      .catch(() => {
        navigate("/not-found");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [navigate, postId]);

  return (
    <div className="min-h-screen w-full bg-[#F2F2F7]" style={{ paddingBottom: "120px" }}>
      <main className="mx-auto flex w-full max-w-screen-sm flex-col gap-6 px-4 pb-8 pt-8 sm:max-w-screen-md sm:px-6 lg:max-w-4xl">
        {isLoading && (
          <div className="rounded-[18px] bg-white p-6 text-center text-[#8E8E93]">
            Q&A 정보를 불러오는 중입니다...
          </div>
        )}

        {!isLoading && qnaDetail && (
          <section className="rounded-[18px] bg-white p-6 shadow-sm">
            <span className="text-[12px] font-semibold text-[#5856D6]">Q&A</span>
            <h1 className="mt-2 text-[20px] font-bold text-[#1C1C1E]">{qnaDetail.title}</h1>
            <p className="mt-4 whitespace-pre-line text-[14px] text-[#3A3A3C]">
              {qnaDetail.content}
            </p>
          </section>
        )}
      </main>

      <div className="fixed bottom-20 left-0 right-0 z-20 border-t border-[#E5E5EA] bg-white px-6 py-4 shadow-[0_-8px_24px_rgba(26,26,26,0.08)]">
        <div className="mx-auto flex w-full max-w-screen-sm flex-col gap-3 sm:max-w-screen-md lg:max-w-4xl">
          <label className="text-[12px] font-semibold text-[#8E8E93]">답변 작성</label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-sm font-medium text-[#1C1C1E] focus:border-[#5856D6] focus:outline-none"
            placeholder="답변을 입력해 주세요."
          />
          <button
            type="button"
            className="w-full rounded-full bg-[#5856D6] px-6 py-3 text-[14px] font-semibold text-white transition hover:bg-[#4B49C6]"
          >
            답변 등록
          </button>
        </div>
      </div>

      <FooterNav />
    </div>
  );
};

export default QnaDetailPage;
