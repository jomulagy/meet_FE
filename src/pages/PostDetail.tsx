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
  votes: Vote[];
  onVote: (voteId: string, optionId: string) => void;
  onEndVote: (voteId: string) => void;
  onAddVote: () => void;
  participationVote: ParticipationVote | null;
  onCreateParticipationVote: () => void;
  onVoteParticipation: (choice: "yes" | "no") => void;
  onEndParticipation: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

type VoteType = "date" | "place" | "text";

type VoteOption = {
  id: string;
  label: string;
  count: number;
};

type Vote = {
  id: string;
  title: string;
  type: VoteType;
  activeYn: "Y" | "N";
  hasVoted: boolean;
  options: VoteOption[];
  myChoiceId?: string;
};

type ParticipationVote = {
  id: string;
  activeYn: "Y" | "N";
  hasVoted: boolean;
  yesCount: number;
  noCount: number;
  myChoice?: "yes" | "no";
};

const voteTypeMeta: Record<VoteType, { label: string; badge: string; icon: string }> = {
  date: {
    label: "날짜 투표",
    badge: "#EEF2FF",
    icon: "fa-regular fa-calendar",
  },
  place: {
    label: "장소 투표",
    badge: "#ECFDF5",
    icon: "fa-solid fa-location-dot",
  },
  text: {
    label: "텍스트 투표",
    badge: "#FFF7ED",
    icon: "fa-regular fa-comment-dots",
  },
};

type VoteCardProps = {
  vote: Vote;
  onVote: (voteId: string, optionId: string) => void;
  onEndVote: (voteId: string) => void;
};

const VoteCard: React.FC<VoteCardProps> = ({ vote, onVote, onEndVote }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const meta = voteTypeMeta[vote.type];
  const total = vote.options.reduce((sum, option) => sum + option.count, 0);
  const resolvedChoice = vote.myChoiceId ?? selectedOption;
  const isActive = vote.activeYn === "Y";

  return (
    <div className="rounded-[22px] border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-2xl"
            style={{ backgroundColor: meta.badge }}
          >
            <i className={`${meta.icon} text-[16px] text-[#1F2937]`} />
          </span>
          <div>
            <p className="text-[12px] font-medium text-[#6B7280]">{meta.label}</p>
            <p className="text-[15px] font-semibold text-[#111827]">{vote.title}</p>
          </div>
        </div>
        <button
          onClick={() => onEndVote(vote.id)}
          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
            isActive ? "bg-[#FEE2E2] text-[#B91C1C]" : "bg-[#E5E7EB] text-[#6B7280]"
          }`}
        >
          {isActive ? "투표 종료" : "종료됨"}
        </button>
      </div>

      {isActive && !vote.hasVoted ? (
        <div className="mt-4 space-y-3">
          {vote.options.map((option) => (
            <label
              key={option.id}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-[13px] font-medium transition ${
                selectedOption === option.id ? "border-[#2563EB] bg-[#EFF6FF]" : "border-[#E5E7EB]"
              }`}
            >
              <input
                type="radio"
                name={`vote-${vote.id}`}
                className="h-4 w-4 text-[#2563EB]"
                checked={selectedOption === option.id}
                onChange={() => setSelectedOption(option.id)}
              />
              <span className="text-[#1F2937]">{option.label}</span>
            </label>
          ))}
          <button
            onClick={() => {
              if (selectedOption) {
                onVote(vote.id, selectedOption);
              }
            }}
            className="w-full rounded-2xl bg-[#2563EB] px-4 py-2 text-[13px] font-semibold text-white shadow-md transition hover:bg-[#1D4ED8]"
          >
            투표하기
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {vote.options.map((option) => {
            const ratio = total > 0 ? Math.round((option.count / total) * 100) : 0;
            const isMine = resolvedChoice === option.id;
            return (
              <div key={option.id} className="rounded-2xl border border-[#E5E7EB] px-4 py-3">
                <div className="flex items-center justify-between text-[13px]">
                  <span className={`font-medium ${isMine ? "text-[#2563EB]" : "text-[#1F2937]"}`}>
                    {option.label}
                    {isMine && <span className="ml-2 text-[11px]">내 선택</span>}
                  </span>
                  <span className="text-[#6B7280]">{option.count}표</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
                  <div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${ratio}%` }} />
                </div>
              </div>
            );
          })}
          <p className="text-[12px] text-[#6B7280]">
            {isActive ? "투표 완료: 내 선택과 전체 결과를 확인합니다." : "투표가 종료되었습니다."}
          </p>
        </div>
      )}
    </div>
  );
};

type ParticipationVoteProps = {
  participationVote: ParticipationVote | null;
  onCreate: () => void;
  onVote: (choice: "yes" | "no") => void;
  onEnd: () => void;
};

const ParticipationVoteSection: React.FC<ParticipationVoteProps> = ({ participationVote, onCreate, onVote, onEnd }) => {
  if (!participationVote) {
    return (
      <div className="rounded-[22px] border border-dashed border-[#CBD5F5] bg-[#F8FAFF] p-5 text-center">
        <p className="text-[13px] font-medium text-[#6B7280]">참여 여부 투표를 아직 만들지 않았습니다.</p>
        <button
          onClick={onCreate}
          className="mt-3 rounded-full bg-[#2563EB] px-4 py-2 text-[12px] font-semibold text-white shadow-md"
        >
          참여여부 투표 생성하기
        </button>
      </div>
    );
  }

  const total = participationVote.yesCount + participationVote.noCount;
  const yesRatio = total > 0 ? Math.round((participationVote.yesCount / total) * 100) : 0;
  const noRatio = total > 0 ? Math.round((participationVote.noCount / total) * 100) : 0;
  const isActive = participationVote.activeYn === "Y";

  return (
    <div className="rounded-[22px] border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[12px] font-medium text-[#6B7280]">참여 여부</p>
          <p className="text-[15px] font-semibold text-[#111827]">이번 모임에 참여할까요?</p>
        </div>
        <button
          onClick={onEnd}
          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
            isActive ? "bg-[#FEE2E2] text-[#B91C1C]" : "bg-[#E5E7EB] text-[#6B7280]"
          }`}
        >
          {isActive ? "투표 종료" : "종료됨"}
        </button>
      </div>

      {isActive && !participationVote.hasVoted ? (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onVote("yes")}
            className="flex-1 rounded-2xl bg-[#2563EB] px-4 py-2 text-[13px] font-semibold text-white"
          >
            참여할게요
          </button>
          <button
            onClick={() => onVote("no")}
            className="flex-1 rounded-2xl border border-[#E5E7EB] px-4 py-2 text-[13px] font-semibold text-[#6B7280]"
          >
            어려워요
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-[#E5E7EB] px-4 py-3">
            <div className="flex items-center justify-between text-[13px]">
              <span className={`font-medium ${participationVote.myChoice === "yes" ? "text-[#2563EB]" : "text-[#1F2937]"}`}>
                참여할게요
                {participationVote.myChoice === "yes" && <span className="ml-2 text-[11px]">내 선택</span>}
              </span>
              <span className="text-[#6B7280]">{participationVote.yesCount}명</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
              <div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${yesRatio}%` }} />
            </div>
          </div>
          <div className="rounded-2xl border border-[#E5E7EB] px-4 py-3">
            <div className="flex items-center justify-between text-[13px]">
              <span className={`font-medium ${participationVote.myChoice === "no" ? "text-[#2563EB]" : "text-[#1F2937]"}`}>
                어려워요
                {participationVote.myChoice === "no" && <span className="ml-2 text-[11px]">내 선택</span>}
              </span>
              <span className="text-[#6B7280]">{participationVote.noCount}명</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
              <div className="h-full rounded-full bg-[#94A3B8]" style={{ width: `${noRatio}%` }} />
            </div>
          </div>
          <p className="text-[12px] text-[#6B7280]">
            {isActive ? "참여 여부를 투표했습니다." : "참여 여부 투표가 종료되었습니다."}
          </p>
        </div>
      )}
    </div>
  );
};

type VoteListProps = {
  votes: Vote[];
  onVote: (voteId: string, optionId: string) => void;
  onEndVote: (voteId: string) => void;
  onAddVote: () => void;
  participationVote: ParticipationVote | null;
  onCreateParticipationVote: () => void;
  onVoteParticipation: (choice: "yes" | "no") => void;
  onEndParticipation: () => void;
  participants: string[];
};

const VoteListSection: React.FC<VoteListProps> = ({
  votes,
  onVote,
  onEndVote,
  onAddVote,
  participationVote,
  onCreateParticipationVote,
  onVoteParticipation,
  onEndParticipation,
  participants,
}) => {
  return (
    <section className="mt-6 rounded-[24px] bg-[#F8FAFF] p-6 shadow-[0_12px_32px_rgba(26,26,26,0.06)]">
      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[#111827]">투표 리스트</h2>
          <p className="text-[12px] text-[#6B7280]">진행 중인 투표와 결과를 확인해요.</p>
        </div>
        <button
          onClick={onAddVote}
          className="rounded-full bg-[#2563EB] px-4 py-2 text-[12px] font-semibold text-white"
        >
          투표 추가
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {votes.map((vote) => (
          <VoteCard key={vote.id} vote={vote} onVote={onVote} onEndVote={onEndVote} />
        ))}
      </div>

      <div className="mt-6 space-y-4">
        <ParticipationVoteSection
          participationVote={participationVote}
          onCreate={onCreateParticipationVote}
          onVote={onVoteParticipation}
          onEnd={onEndParticipation}
        />
        {participationVote?.activeYn === "N" && (
          <div className="rounded-2xl bg-[#EEF2FF] px-4 py-3 text-[13px] font-medium text-[#1E3A8A]">
            현재 참여 인원: {participants.length}명
          </div>
        )}
      </div>
    </section>
  );
};

const MeetingDetailView: React.FC<DetailProps> = ({
  meetInfo,
  formattedDate,
  participants,
  votes,
  onVote,
  onEndVote,
  onAddVote,
  participationVote,
  onCreateParticipationVote,
  onVoteParticipation,
  onEndParticipation,
  onEdit,
  onDelete,
}) => {
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

        <VoteListSection
          votes={votes}
          onVote={onVote}
          onEndVote={onEndVote}
          onAddVote={onAddVote}
          participationVote={participationVote}
          onCreateParticipationVote={onCreateParticipationVote}
          onVoteParticipation={onVoteParticipation}
          onEndParticipation={onEndParticipation}
          participants={participants}
        />

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

const TravelDetailView: React.FC<DetailProps> = ({
  meetInfo,
  formattedDate,
  participants,
  votes,
  onVote,
  onEndVote,
  onAddVote,
  participationVote,
  onCreateParticipationVote,
  onVoteParticipation,
  onEndParticipation,
  onEdit,
  onDelete,
}) => {
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

        <VoteListSection
          votes={votes}
          onVote={onVote}
          onEndVote={onEndVote}
          onAddVote={onAddVote}
          participationVote={participationVote}
          onCreateParticipationVote={onCreateParticipationVote}
          onVoteParticipation={onVoteParticipation}
          onEndParticipation={onEndParticipation}
          participants={participants}
        />

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

const PostDetail: React.FC = () => {
  const { postId } = useParams();
  const navigate = useNavigate();

  const [meetInfo, setMeetInfo] = useState<MeetInfo | null>(null);
  const [formattedDate, setFormattedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [participationVote, setParticipationVote] = useState<ParticipationVote | null>(null);

  useEffect(() => {
    if (!postId) {
      return;
    }

    let cancelled = false;

    const fetchPost = async () =>
      new Promise<MeetInfo>((resolve) => {
        setTimeout(() => {
          resolve({
            id: postId,
            title: "가을 소풍 모임",
            content: "함께 가을 소풍을 준비해요. 일정과 장소 투표를 완료해 주세요!",
            type: "meeting",
            date: {
              value: "2024-10-12",
              time: "14:00",
              editable: "N",
            },
            place: {
              value: "서울숲",
              editable: "N",
              xpos: 127.037,
              ypos: 37.544,
            },
            isAuthor: "true",
            participantsNum: "5",
            participants: ["지윤", "민호", "소라", "현우", "다은"],
          });
        }, 400);
      });

    const fetchVotes = async () =>
      new Promise<Vote[]>((resolve) => {
        setTimeout(() => {
          resolve([
            {
              id: "vote-1",
              title: "희망 날짜 선택",
              type: "date",
              activeYn: "Y",
              hasVoted: false,
              options: [
                { id: "opt-1", label: "10월 12일(토)", count: 2 },
                { id: "opt-2", label: "10월 19일(토)", count: 1 },
                { id: "opt-3", label: "10월 26일(토)", count: 2 },
              ],
            },
            {
              id: "vote-2",
              title: "장소 후보",
              type: "place",
              activeYn: "Y",
              hasVoted: true,
              myChoiceId: "opt-5",
              options: [
                { id: "opt-4", label: "서울숲", count: 3 },
                { id: "opt-5", label: "반포한강공원", count: 4 },
                { id: "opt-6", label: "남산공원", count: 1 },
              ],
            },
            {
              id: "vote-3",
              title: "준비물 의견",
              type: "text",
              activeYn: "N",
              hasVoted: true,
              myChoiceId: "opt-8",
              options: [
                { id: "opt-7", label: "돗자리", count: 5 },
                { id: "opt-8", label: "보드게임", count: 4 },
                { id: "opt-9", label: "간식", count: 6 },
              ],
            },
          ]);
        }, 400);
      });

    const fetchParticipationVote = async () =>
      new Promise<ParticipationVote>((resolve) => {
        setTimeout(() => {
          resolve({
            id: "participation",
            activeYn: "Y",
            hasVoted: false,
            yesCount: 3,
            noCount: 1,
          });
        }, 400);
      });

    const loadDetail = async () => {
      setIsLoading(true);
      try {
        const [postData, voteData, participationData] = await Promise.all([
          fetchPost(),
          fetchVotes(),
          fetchParticipationVote(),
        ]);

        if (cancelled) {
          return;
        }

        setMeetInfo(postData);
        setVotes(voteData);
        setParticipationVote(participationData);

        const meetingDate = postData.date?.value ? new Date(postData.date.value) : null;
        const normalizedDate =
          meetingDate && !Number.isNaN(meetingDate.getTime())
            ? new Intl.DateTimeFormat("ko-KR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              }).format(meetingDate)
            : "날짜 미정";
        setFormattedDate(normalizedDate);
      } catch (error) {
        if (!cancelled) {
          console.error("모임 정보를 불러오는 중 오류가 발생했습니다:", error);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [postId, navigate]);

  const handleEdit = () => {
    if (meetInfo) {
      navigate(`/meet/edit/${meetInfo.id}`);
    }
  };

  const handleDelete = () => {
    if (!postId) {
      return;
    }

    server
      .delete(`/meet?meetId=${postId}`)
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

  const handleVote = (voteId: string, optionId: string) => {
    setVotes((prev) =>
      prev.map((vote) =>
        vote.id === voteId
          ? {
              ...vote,
              hasVoted: true,
              myChoiceId: optionId,
              options: vote.options.map((option) =>
                option.id === optionId ? { ...option, count: option.count + 1 } : option
              ),
            }
          : vote
      )
    );
  };

  const handleEndVote = (voteId: string) => {
    setVotes((prev) => prev.map((vote) => (vote.id === voteId ? { ...vote, activeYn: "N" } : vote)));
  };

  const handleAddVote = () => {
    const nextId = `vote-${votes.length + 1}`;
    setVotes((prev) => [
      ...prev,
      {
        id: nextId,
        title: "추가 의견 수집",
        type: "text",
        activeYn: "Y",
        hasVoted: false,
        options: [
          { id: `${nextId}-opt-1`, label: "간단한 회의", count: 0 },
          { id: `${nextId}-opt-2`, label: "온라인 투표", count: 0 },
          { id: `${nextId}-opt-3`, label: "대면 모임", count: 0 },
        ],
      },
    ]);
  };

  const handleCreateParticipationVote = () => {
    setParticipationVote({
      id: "participation",
      activeYn: "Y",
      hasVoted: false,
      yesCount: 0,
      noCount: 0,
    });
  };

  const handleVoteParticipation = (choice: "yes" | "no") => {
    setParticipationVote((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        hasVoted: true,
        myChoice: choice,
        yesCount: prev.yesCount + (choice === "yes" ? 1 : 0),
        noCount: prev.noCount + (choice === "no" ? 1 : 0),
      };
    });
  };

  const handleEndParticipation = () => {
    setParticipationVote((prev) => (prev ? { ...prev, activeYn: "N" } : prev));
  };

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
        votes={votes}
        onVote={handleVote}
        onEndVote={handleEndVote}
        onAddVote={handleAddVote}
        participationVote={participationVote}
        onCreateParticipationVote={handleCreateParticipationVote}
        onVoteParticipation={handleVoteParticipation}
        onEndParticipation={handleEndParticipation}
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
      votes={votes}
      onVote={handleVote}
      onEndVote={handleEndVote}
      onAddVote={handleAddVote}
      participationVote={participationVote}
      onCreateParticipationVote={handleCreateParticipationVote}
      onVoteParticipation={handleVoteParticipation}
      onEndParticipation={handleEndParticipation}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};

export default PostDetail;
