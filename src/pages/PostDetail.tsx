import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FooterNav from "../components/FooterNav";
import { server } from "@/utils/axios";

type MeetInfo = {
  id: string;
  title: string;
  content: string;
  type: string;
  date: {
    value: string;
    time: string;
    editable: string;
  } | null;
  place: {
    value: string;
    editable: string;
    xpos: number;
    ypos: number;
  } | null;
  isAuthor: string;
  participantsNum: string;
  participants: string[];
};

type DetailProps = {
  meetInfo: MeetInfo;
  formattedDate: string | null;
  participants: string[];
  onEdit: () => void;
  onDelete: () => void;
};

const MeetingDetailView: React.FC<DetailProps> = ({ meetInfo, formattedDate, participants, onEdit, onDelete }) => {
  const detailSections = [
    {
      label: "날짜",
      value: formattedDate ?? "날짜 미정",
      icon: "fa-regular fa-calendar",
    },
    {
      label: "시간",
      value: meetInfo.date?.time ? meetInfo.date.time : "시간 미정",
      icon: "fa-regular fa-clock",
    },
    {
      label: "장소",
      value: meetInfo.place?.value ? meetInfo.place.value : "장소 미정",
      icon: "fa-solid fa-location-dot",
    },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#F2F2F7]" style={{ paddingBottom: "80px" }}>
      <header className="bg-white px-6 pt-6 pb-5 shadow-[0_6px_20px_rgba(0,0,0,0.05)]">
        <span className="rounded-full bg-[#E1F0FF] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#1E3A8A]">모임 정보</span>
        <h1 className="mt-3 text-[23px] font-bold leading-tight text-[#111827]">{meetInfo.title}</h1>
        <p className="mt-2 text-[13px] text-[#4B5563]">
          {participants.length > 0 ? `${participants.length}명이 참여 중` : "아직 참여자가 없습니다."}
        </p>
      </header>

      <main className="flex-1 px-6 pb-10 pt-8">
        <section className="rounded-[24px] bg-white p-6 shadow-[0_12px_32px_rgba(26,26,26,0.08)]">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
            <h2 className="text-[15px] font-semibold text-[#111827]">기본 정보</h2>
            <span className="text-[12px] font-medium text-[#6B7280]">모임 세부사항</span>
          </div>
          <div className="mt-5 flex flex-col gap-4">
            {detailSections.map((section) => (
              <div key={section.label} className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F1FF] text-[#1E3A8A]">
                  <i className={`${section.icon} text-[18px]`}></i>
                </span>
                <div className="flex flex-col">
                  <span className="text-[12px] font-medium text-[#6B7280]">{section.label}</span>
                  <span className="text-[15px] font-semibold text-[#111827]">{section.value}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-[#F8FAFF] p-4">
            <span className="text-[12px] font-medium text-[#6B7280]">소개</span>
            <p className="mt-2 text-[14px] leading-relaxed text-[#1F2937]">
              {meetInfo.content ? meetInfo.content : "등록된 소개가 없습니다."}
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-[24px] bg-white p-6 shadow-[0_12px_32px_rgba(26,26,26,0.06)]">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
            <h2 className="text-[15px] font-semibold text-[#111827]">참여자</h2>
            <span className="text-[12px] font-medium text-[#6B7280]">{participants.length}명</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {participants.length > 0 ? (
              participants.map((participant) => (
                <span key={participant} className="rounded-full bg-[#E1F0FF] px-3 py-1 text-[12px] font-medium text-[#1E3A8A]">
                  {participant}
                </span>
              ))
            ) : (
              <p className="text-[13px] text-[#6B7280]">참여자가 아직 없습니다.</p>
            )}
          </div>
        </section>

        {meetInfo.isAuthor === "true" && (
          <div className="mt-8 flex gap-3">
            <button
              onClick={onEdit}
              className="flex-1 rounded-[24px] bg-[#2563EB] px-4 py-3 text-[14px] font-semibold text-white shadow-md transition hover:bg-[#1D4ED8]"
            >
              수정하기
            </button>
            <button
              onClick={onDelete}
              className="flex-1 rounded-[24px] bg-[#FF3B30] px-4 py-3 text-[14px] font-semibold text-white shadow-md transition hover:shadow-lg"
            >
              삭제하기
            </button>
          </div>
        )}
      </main>

      <FooterNav />
    </div>
  );
};

const TravelDetailView: React.FC<DetailProps> = ({ meetInfo, formattedDate, participants, onEdit, onDelete }) => {
  const detailSections = [
    {
      label: "확정일",
      value: formattedDate ?? "날짜 미정",
      icon: "fa-regular fa-calendar-check",
    },
    {
      label: "예산",
      value: meetInfo.content || "예산 정보가 없습니다.",
      icon: "fa-solid fa-wallet",
    },
    {
      label: "장소",
      value: meetInfo.place?.value ? meetInfo.place.value : "장소 미정",
      icon: "fa-solid fa-location-dot",
    },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#F2F2F7]" style={{ paddingBottom: "80px" }}>
      <header className="bg-white px-6 pt-6 pb-5 shadow-[0_6px_20px_rgba(0,0,0,0.05)]">
        <span className="rounded-full bg-[#FEF3C7] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#92400E]">여행 투표</span>
        <h1 className="mt-3 text-[23px] font-bold leading-tight text-[#111827]">{meetInfo.title}</h1>
        <p className="mt-2 text-[13px] text-[#4B5563]">
          {participants.length > 0 ? `${participants.length}명이 의견을 남겼습니다.` : "아직 참여자가 없습니다."}
        </p>
      </header>

      <main className="flex-1 px-6 pb-10 pt-8">
        <section className="rounded-[24px] bg-white p-6 shadow-[0_12px_32px_rgba(26,26,26,0.08)]">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
            <h2 className="text-[15px] font-semibold text-[#111827]">여행 정보</h2>
            <span className="text-[12px] font-medium text-[#6B7280]">투표 결과</span>
          </div>
          <div className="mt-5 flex flex-col gap-4">
            {detailSections.map((section) => (
              <div key={section.label} className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF7ED] text-[#EA580C]">
                  <i className={`${section.icon} text-[18px]`}></i>
                </span>
                <div className="flex flex-col">
                  <span className="text-[12px] font-medium text-[#6B7280]">{section.label}</span>
                  <span className="text-[15px] font-semibold text-[#111827]">{section.value}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[24px] bg-white p-6 shadow-[0_12px_32px_rgba(26,26,26,0.06)]">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
            <h2 className="text-[15px] font-semibold text-[#111827]">참여자</h2>
            <span className="text-[12px] font-medium text-[#6B7280]">{participants.length}명</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {participants.length > 0 ? (
              participants.map((participant) => (
                <span key={participant} className="rounded-full bg-[#FEF3C7] px-3 py-1 text-[12px] font-medium text-[#92400E]">
                  {participant}
                </span>
              ))
            ) : (
              <p className="text-[13px] text-[#6B7280]">참여자가 아직 없습니다.</p>
            )}
          </div>
        </section>

        {meetInfo.isAuthor === "true" && (
          <div className="mt-8 flex gap-3">
            <button
              onClick={onEdit}
              className="flex-1 rounded-[24px] bg-[#2563EB] px-4 py-3 text-[14px] font-semibold text-white shadow-md transition hover:bg-[#1D4ED8]"
            >
              수정하기
            </button>
            <button
              onClick={onDelete}
              className="flex-1 rounded-[24px] bg-[#FF3B30] px-4 py-3 text-[14px] font-semibold text-white shadow-md transition hover:shadow-lg"
            >
              삭제하기
            </button>
          </div>
        )}
      </main>

      <FooterNav />
    </div>
  );
};

const MeetDetail: React.FC = () => {
  const { meetId } = useParams();
  const navigate = useNavigate();

  const [meetInfo, setMeetInfo] = useState<MeetInfo | null>(null);
  const [formattedDate, setFormattedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!meetId) {
      return;
    }

    let redirected = false;

    const normalizeDate = (value?: string | null) => {
      if (!value) return null;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return null;
      }
      date.setHours(0, 0, 0, 0);
      return date;
    };

    const loadDetail = async () => {
      setIsLoading(true);
      try {
        const [placeResponse, scheduleResponse, participationResponse] = await Promise.all([
          server.get(`/meet/place?meetId=${meetId}`),
          server.get(`/meet/schedule?meetId=${meetId}`),
          server.get(`/meet/participate?meetId=${meetId}`),
        ]);

        const now = new Date();
        const placeVoteEnd = normalizeDate(placeResponse.data?.endDate ?? null);
        const scheduleVoteEnd = normalizeDate(scheduleResponse.data?.endDate ?? null);
        const participationEnd = normalizeDate(participationResponse.data?.endDate ?? null);

        if ((placeVoteEnd && now < placeVoteEnd) || (scheduleVoteEnd && now < scheduleVoteEnd)) {
          redirected = true;
          navigate(`/meet/vote/${meetId}`, { replace: true });
          return;
        }

        if (participationEnd && now < participationEnd) {
          redirected = true;
          navigate(`/meet/join/${meetId}`, { replace: true });
          return;
        }

        const detailResponse = await server.get(`/meet?meetId=${meetId}`);
        const data = detailResponse.data;

        if (typeof data.participants === "string") {
          try {
            data.participants = JSON.parse(data.participants.replace(/'/g, '"'));
          } catch (parseError) {
            console.error("참여자 데이터 파싱 오류:", parseError);
            data.participants = [];
          }
        }

        setMeetInfo(data);
        const meetingDate = data.date?.value ? new Date(data.date.value) : null;
        const normalizedDate =
          meetingDate && !Number.isNaN(meetingDate.getTime())
            ? new Intl.DateTimeFormat("ko-KR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              }).format(meetingDate)
            : "날짜 미정";
        setFormattedDate(normalizedDate);
      } catch (error: any) {
        if (error?.code === "403") {
          redirected = true;
          navigate("/Unauthorized");
        } else if (error?.code === "404") {
          redirected = true;
          navigate("/not-found");
        } else {
          console.error("모임 정보를 불러오는 중 오류가 발생했습니다:", error);
        }
      } finally {
        if (!redirected) {
          setIsLoading(false);
        }
      }
    };

    void loadDetail();

    return () => {
      redirected = true;
    };
  }, [meetId, navigate]);

  const handleEdit = () => {
    if (meetInfo) {
      navigate(`/meet/edit/${meetInfo.id}`);
    }
  };

  const handleDelete = () => {
    if (!meetId) {
      return;
    }

    server
      .delete(`/meet?meetId=${meetId}`)
      .then(() => {
        navigate("/");
      })
      .catch((error) => {
        if (error.code === "403") {
          navigate("/Unauthorized");
        } else if (error.code === "404") {
          navigate("/not-found");
        }
      });
  };

  const participants = useMemo(() => {
    if (!meetInfo) {
      return [] as string[];
    }

    return Array.isArray(meetInfo.participants) ? meetInfo.participants : [];
  }, [meetInfo]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F2F2F7]">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-[#E5E5EA] border-t-[#1E3A8A]" />
        <p className="mt-4 text-[13px] text-[#8E8E93]">모임 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (!meetInfo) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F2F2F7] text-center">
        <p className="text-[14px] font-medium text-[#1C1C1E]">모임 정보를 불러오지 못했습니다.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 rounded-full bg-[#1E3A8A] px-5 py-2 text-[12px] font-semibold text-white shadow-md"
        >
          이전 페이지로 돌아가기
        </button>
      </div>
    );
  }

  if (meetInfo.type === "travel") {
    return (
      <TravelDetailView
        meetInfo={meetInfo}
        formattedDate={formattedDate}
        participants={participants}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <MeetingDetailView
      meetInfo={meetInfo}
      formattedDate={formattedDate}
      participants={participants}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};

export default MeetDetail;
