import React from "react";
import { Link } from "react-router-dom";
import FooterNav from "../components/FooterNav";
import voteHero from "../assets/img/vote.png";

export const Home: React.FC = () => {
  return (
    <div
      className="min-h-screen w-full flex flex-col bg-[#F2F2F7]"
      style={{ paddingBottom: "80px" }}
    >
      <header className="px-6 pt-6 pb-4">
        <span className="text-[18px] font-extrabold uppercase tracking-[0.3em] text-[#1E3A8A]">
          변색모
        </span>
        <h1 className="mt-2 text-[26px] font-bold leading-[1.2] text-[#1C1C1E]">
          최고의 모임을 완성하세요
        </h1>
        <p className="mt-3 text-[13px] text-[#636366]">
          날짜와 장소, 참여 여부까지 한 곳에서 관리하는
          <br />
          스마트 모임 운영 도구입니다.
        </p>
      </header>

      <section className="px-6">
        <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#1E88E5] via-[#42A5F5] to-[#64B5F6] px-6 pb-5 pt-4 text-white shadow-lg">
          <div className="relative z-[1] flex flex-col gap-3">
            <span className="w-fit rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold tracking-wide">
              새로운 만남의 시작
            </span>
            <h2 className="text-[22px] font-bold leading-snug">
              지금 어울릴 모임을
              <br />
              찾아보세요
            </h2>
            <p className="text-[13px] text-white/80">
              원하는 주제의 모임을 골라 함께하는 즐거움을 경험해보세요.
            </p>
            <Link
              to="/meet/list"
              className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-[12px] font-semibold text-[#1E3A8A] shadow-md transition hover:shadow-lg"
            >
              모임 둘러보기
              <i className="fa-solid fa-arrow-right text-[12px]"></i>
            </Link>
          </div>
          <img
            src={voteHero}
            alt="투표 아이콘"
            className="absolute -bottom-3 -right-2 w-32 opacity-90"
          />
        </div>
      </section>

      <section className="px-6 mt-10 flex flex-col gap-4 text-[#1C1C1E]">
        <h3 className="text-[15px] font-semibold">이렇게 활용해보세요</h3>
        <div className="grid gap-4">
          <article className="rounded-[22px] bg-white p-5 shadow-[0_8px_24px_rgba(26,26,26,0.06)]">
            <h4 className="text-[14px] font-semibold text-[#1E3A8A]">모임 준비</h4>
            <p className="mt-2 text-[13px] text-[#636366]">
              일정과 장소 투표를 동시에 받아보고, 구성원들의 참여 여부를 한눈에 확인하세요.
            </p>
          </article>
          <article className="rounded-[22px] bg-white p-5 shadow-[0_8px_24px_rgba(26,26,26,0.06)]">
            <h4 className="text-[14px] font-semibold text-[#1E3A8A]">모임 운영</h4>
            <p className="mt-2 text-[13px] text-[#636366]">
              투표 결과를 기반으로 최적의 일정과 장소를 선택하고, 모임 정보를 실시간으로 공유할 수 있습니다.
            </p>
          </article>
        </div>
      </section>

      <FooterNav />
    </div>
  );
};

export default Home;

export { default as Admin } from "./admin";
export { Login as Login, KakaoCode as KakaoCode } from "./login";
export { Dashboard } from "./dashboard";
export { NotFound } from "./Exceptions/notFound";
export { Unauthorized } from "./Exceptions/Unauthorized";
export { default as MeetList } from "./MeetList";
export { default as MeetDetail } from "./MeetDetail";
export { default as MeetEdit } from "./MeetEdit";
export { default as VotePage } from "./VotePage";
export { default as JoinVotePage } from "./JoinVotePage";
export { default as MeetCreate } from "./MeetCreate";
