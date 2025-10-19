import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { server } from "@/utils/axios";
import FooterNav from "../components/FooterNav";
import voteHero from "../assets/img/vote.png";
import calender from "../assets/img/calender.png";

type MeetInfo = {
  id: string;
  title: string;
  date: string | null;
  place: string | null;
};

const MeetList: React.FC = () => {
  const [meetList, setMeetList] = useState<MeetInfo[]>([]);
  const navigate = useNavigate();
  const hasMeetings = useMemo(() => meetList.length > 0, [meetList]);

  useEffect(() => {
    const fetchMeetList = async () => {
        server
          .get(`/meet/list`)
          .then((response) => {
            setMeetList(response.data);
          })
          .catch((error) => {
            console.error(error);
            navigate("/not-found");
          });
    };
  
    fetchMeetList();
  }, [navigate]);

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ backgroundColor: "#F2F2F7", paddingBottom: "80px" }}
    >
      <main className="flex-1 px-6 pt-10 pb-8">
        <section className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#6358FF] via-[#7A6CFF] to-[#A68BFF] px-6 pb-8 pt-7 text-white shadow-lg">
          <div className="relative z-[1] flex flex-col gap-3">
            <span className="w-fit rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold tracking-wide">
              새로운 만남의 시작
            </span>
            <h1 className="text-[22px] font-bold leading-snug">
              지금 어울릴 모임을
              <br />
              찾아보세요
            </h1>
            <p className="text-[13px] text-white/80">
              원하는 주제의 모임을 골라
              <br />
              함께하는 즐거움을 경험해보세요.
            </p>
          </div>
          <img
            src={voteHero}
            alt="투표 아이콘"
            className="absolute -bottom-3 -right-2 w-32 opacity-90"
          />
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-[#1C1C1E]">모임 목록</h2>
            <span className="text-[12px] font-medium text-[#8E8E93]">
              최신순
            </span>
          </div>
          {hasMeetings ? (
            <ul className="flex flex-col gap-4">
              {meetList.map((meet) => (
                <li key={meet.id}>
                  <Link
                    to={`/meet/${meet.id}`}
                    className="group flex w-full items-center justify-between gap-4 rounded-[22px] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(26,26,26,0.08)] transition-all duration-200 hover:shadow-[0_12px_30px_rgba(26,26,26,0.12)]"
                  >
                    <div className="flex items-start gap-4">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2F2F7] text-[#5856D6]">
                        <img
                          src={calender}
                          alt="달력"
                          className="h-6 w-6"
                        />
                      </span>
                      <div className="flex flex-col gap-1">
                        <h3 className="text-[15px] font-semibold text-[#1C1C1E] group-hover:text-[#5856D6]">
                          {meet.title}
                        </h3>
                        <div className="flex flex-col text-[12px] text-[#8E8E93]">
                          <span>
                            {meet.date && meet.date.trim().length > 0
                              ? meet.date
                              : "날짜 미정"}
                          </span>
                          <span>
                            {meet.place && meet.place.trim().length > 0
                              ? meet.place
                              : "장소 미정"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <i className="fa-solid fa-chevron-right text-[18px] text-[#AEAEB2] transition-colors group-hover:text-[#5856D6]"></i>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-[22px] bg-white px-6 py-10 text-center text-[#8E8E93] shadow-inner">
              <i className="fa-regular fa-calendar-plus mb-3 text-4xl"></i>
              <p className="text-[14px] font-medium">아직 참여 가능한 모임이 없어요.</p>
              <p className="mt-1 text-[12px] text-[#AEAEB2]">
                새롭게 등록되는 모임을 기다려주세요!
              </p>
            </div>
          )}
        </section>
      </main>

      <FooterNav />
    </div>
  );
};

export default MeetList;
