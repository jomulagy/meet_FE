import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FooterNav from "../components/FooterNav";

type PostDetail = {
  id: string;
  title: string;
  content: string;
  authorName: string;
  createdAt: string;
  isAuthor: boolean;
};

type VoteOption = {
  id: string;
  label: string;
  count: number;
  voted: boolean;
};

type VoteType = "date" | "place" | "text";

type Vote = {
  id: string;
  title: string;
  type: VoteType;
  activeYn: "Y" | "N";
  hasVoted: boolean;
  options: VoteOption[];
};

type ParticipationVote = {
  id: string;
  activeYn: "Y" | "N";
  hasVoted: boolean;
  yesCount: number;
  noCount: number;
  participantCount: number;
};

const fetchPostDetail = async (postId: string): Promise<PostDetail> => {
  await new Promise((resolve) => setTimeout(resolve, 350));
  return {
    id: postId,
    title: "팀 빌딩 회의 일정 잡기",
    content: "이번 주 금요일까지 가능한 시간과 장소를 투표해주세요.",
    authorName: "지민",
    createdAt: "2024-05-20 14:30",
    isAuthor: true,
  };
};

const fetchVoteList = async (): Promise<Vote[]> => {
  await new Promise((resolve) => setTimeout(resolve, 350));
  return [
    {
      id: "vote-1",
      title: "회의 날짜 투표",
      type: "date",
      activeYn: "Y",
      hasVoted: false,
      options: [
        { id: "d1", label: "5/25(토)", count: 4, voted: false },
        { id: "d2", label: "5/26(일)", count: 2, voted: false },
        { id: "d3", label: "5/27(월)", count: 6, voted: false },
      ],
    },
    {
      id: "vote-2",
      title: "회의 장소 투표",
      type: "place",
      activeYn: "Y",
      hasVoted: true,
      options: [
        { id: "p1", label: "강남역 스터디룸", count: 5, voted: false },
        { id: "p2", label: "홍대 카페", count: 3, voted: true },
        { id: "p3", label: "온라인", count: 4, voted: false },
      ],
    },
    {
      id: "vote-3",
      title: "공지용 메시지 톤 투표",
      type: "text",
      activeYn: "N",
      hasVoted: true,
      options: [
        { id: "t1", label: "포멀", count: 8, voted: true },
        { id: "t2", label: "캐주얼", count: 5, voted: false },
        { id: "t3", label: "친근함", count: 2, voted: false },
      ],
    },
  ];
};

const fetchParticipationVote = async (): Promise<ParticipationVote | null> => {
  await new Promise((resolve) => setTimeout(resolve, 250));
  return {
    id: "participation-1",
    activeYn: "Y",
    hasVoted: false,
    yesCount: 4,
    noCount: 1,
    participantCount: 0,
  };
};

const typeBadge = {
  date: "bg-[#E0F2FE] text-[#0369A1]",
  place: "bg-[#ECFDF3] text-[#047857]",
  text: "bg-[#FEF3C7] text-[#92400E]",
};

const VoteOptionList: React.FC<{ options: VoteOption[]; highlightVoted?: boolean }> = ({ options, highlightVoted }) => (
  <div className="mt-4 flex flex-col gap-3">
    {options.map((option) => (
      <div
        key={option.id}
        className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-[13px] font-medium transition ${
          highlightVoted && option.voted
            ? "border-[#1D4ED8] bg-[#EFF6FF] text-[#1E3A8A]"
            : "border-[#E5E7EB] bg-white text-[#374151]"
        }`}
      >
        <span>{option.label}</span>
        <span className="text-[12px] font-semibold text-[#6B7280]">{option.count}표</span>
      </div>
    ))}
  </div>
);

const ActiveVoteBefore: React.FC<{ vote: Vote }> = ({ vote }) => (
  <div className="mt-4 rounded-2xl border border-dashed border-[#CBD5F5] bg-[#F8FAFF] p-4">
    <p className="text-[13px] font-medium text-[#1E3A8A]">투표를 진행해주세요.</p>
    <div className="mt-3 flex flex-col gap-3">
      {vote.options.map((option) => (
        <label key={option.id} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-[13px] text-[#374151]">
          <input type="radio" name={`vote-${vote.id}`} className="h-4 w-4 text-[#2563EB]" />
          {option.label}
        </label>
      ))}
    </div>
    <button className="mt-4 w-full rounded-2xl bg-[#2563EB] py-2 text-[13px] font-semibold text-white">투표하기</button>
  </div>
);

const ActiveVoteAfter: React.FC<{ vote: Vote }> = ({ vote }) => (
  <div className="mt-4 rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
    <p className="text-[13px] font-medium text-[#111827]">내가 선택한 항목과 전체 결과</p>
    <VoteOptionList options={vote.options} highlightVoted />
  </div>
);

const ClosedVote: React.FC<{ vote: Vote }> = ({ vote }) => (
  <div className="mt-4 rounded-2xl border border-[#E5E7EB] bg-[#F3F4F6] p-4">
    <p className="text-[13px] font-medium text-[#6B7280]">투표가 종료되었습니다.</p>
    <VoteOptionList options={vote.options} />
  </div>
);

const VoteCard: React.FC<{ vote: Vote; onEnd: (id: string) => void }> = ({ vote, onEnd }) => {
  const typeLabel = vote.type === "date" ? "날짜" : vote.type === "place" ? "장소" : "텍스트";

  return (
    <div className="rounded-[22px] bg-white p-5 shadow-[0_12px_32px_rgba(26,26,26,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${typeBadge[vote.type]}`}>
            {typeLabel} 투표
          </span>
          <h3 className="mt-2 text-[16px] font-semibold text-[#111827]">{vote.title}</h3>
        </div>
        <button
          onClick={() => onEnd(vote.id)}
          className="rounded-full border border-[#E5E7EB] px-3 py-1 text-[11px] font-semibold text-[#6B7280]"
        >
          투표 종료
        </button>
      </div>

      {vote.activeYn === "Y" ? (vote.hasVoted ? <ActiveVoteAfter vote={vote} /> : <ActiveVoteBefore vote={vote} />) : <ClosedVote vote={vote} />}
    </div>
  );
};

const ParticipationVoteCard: React.FC<{
  vote: ParticipationVote;
  onEnd: () => void;
}> = ({ vote, onEnd }) => {
  if (vote.activeYn === "N") {
    return (
      <div className="rounded-[22px] bg-white p-5 shadow-[0_12px_32px_rgba(26,26,26,0.08)]">
        <div className="flex items-start justify-between">
          <div>
            <span className="inline-flex rounded-full bg-[#FEE2E2] px-3 py-1 text-[11px] font-semibold text-[#991B1B]">참여여부 투표 종료</span>
            <h3 className="mt-2 text-[16px] font-semibold text-[#111827]">참여여부 결과</h3>
          </div>
          <button
            onClick={onEnd}
            className="rounded-full border border-[#E5E7EB] px-3 py-1 text-[11px] font-semibold text-[#6B7280]"
          >
            종료됨
          </button>
        </div>
        <div className="mt-4 rounded-2xl border border-[#E5E7EB] bg-[#F3F4F6] p-4">
          <div className="flex justify-between text-[13px] text-[#374151]">
            <span>참여</span>
            <span className="font-semibold">{vote.yesCount}명</span>
          </div>
          <div className="mt-2 flex justify-between text-[13px] text-[#374151]">
            <span>불참</span>
            <span className="font-semibold">{vote.noCount}명</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[22px] bg-white p-5 shadow-[0_12px_32px_rgba(26,26,26,0.08)]">
      <div className="flex items-start justify-between">
        <div>
          <span className="inline-flex rounded-full bg-[#DBEAFE] px-3 py-1 text-[11px] font-semibold text-[#1D4ED8]">참여여부 투표</span>
          <h3 className="mt-2 text-[16px] font-semibold text-[#111827]">참여 가능 여부</h3>
        </div>
        <button
          onClick={onEnd}
          className="rounded-full border border-[#E5E7EB] px-3 py-1 text-[11px] font-semibold text-[#6B7280]"
        >
          투표 종료
        </button>
      </div>

      {vote.hasVoted ? (
        <div className="mt-4 rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
          <p className="text-[13px] font-medium text-[#111827]">내가 선택한 항목과 전체 결과</p>
          <div className="mt-3 flex flex-col gap-2 text-[13px] text-[#374151]">
            <div className="flex justify-between">
              <span>참여</span>
              <span className="font-semibold">{vote.yesCount}명</span>
            </div>
            <div className="flex justify-between">
              <span>불참</span>
              <span className="font-semibold">{vote.noCount}명</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-[#CBD5F5] bg-[#F8FAFF] p-4">
          <p className="text-[13px] font-medium text-[#1E3A8A]">참여 여부를 선택해주세요.</p>
          <div className="mt-3 flex flex-col gap-3">
            <label className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-[13px] text-[#374151]">
              <input type="radio" name="participation" className="h-4 w-4 text-[#2563EB]" />
              참여
            </label>
            <label className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-[13px] text-[#374151]">
              <input type="radio" name="participation" className="h-4 w-4 text-[#2563EB]" />
              불참
            </label>
          </div>
          <button className="mt-4 w-full rounded-2xl bg-[#2563EB] py-2 text-[13px] font-semibold text-white">투표하기</button>
        </div>
      )}
    </div>
  );
};

const PostDetailPage: React.FC = () => {
  const { postId } = useParams();
  const navigate = useNavigate();

  const [postDetail, setPostDetail] = useState<PostDetail | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [participationVote, setParticipationVote] = useState<ParticipationVote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadDetail = async () => {
      if (!postId) return;
      setLoading(true);

      const [postResponse, voteResponse, participationResponse] = await Promise.all([
        fetchPostDetail(postId),
        fetchVoteList(),
        fetchParticipationVote(),
      ]);

      if (!isMounted) return;
      setPostDetail(postResponse);
      setVotes(voteResponse);
      setParticipationVote(participationResponse);
      setLoading(false);
    };

    void loadDetail();

    return () => {
      isMounted = false;
    };
  }, [postId]);

  const handleEndVote = (voteId: string) => {
    setVotes((prev) =>
      prev.map((vote) =>
        vote.id === voteId
          ? {
              ...vote,
              activeYn: "N",
            }
          : vote,
      ),
    );
  };

  const handleAddVote = () => {
    setVotes((prev) => [
      {
        id: `vote-${prev.length + 1}`,
        title: "새로운 투표",
        type: "text",
        activeYn: "Y",
        hasVoted: false,
        options: [
          { id: "new-1", label: "옵션 1", count: 0, voted: false },
          { id: "new-2", label: "옵션 2", count: 0, voted: false },
        ],
      },
      ...prev,
    ]);
  };

  const handleCreateParticipationVote = () => {
    setParticipationVote({
      id: "participation-2",
      activeYn: "Y",
      hasVoted: false,
      yesCount: 0,
      noCount: 0,
      participantCount: 0,
    });
  };

  const handleEndParticipationVote = () => {
    setParticipationVote((prev) =>
      prev
        ? {
            ...prev,
            activeYn: "N",
            participantCount: prev.yesCount,
          }
        : prev,
    );
  };

  const participantCountText = useMemo(() => {
    if (!participationVote || participationVote.activeYn !== "N") return null;
    return `참여 인원: ${participationVote.participantCount}명`;
  }, [participationVote]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F2F2F7]">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-[#E5E5EA] border-t-[#1E3A8A]" />
        <p className="mt-4 text-[13px] text-[#8E8E93]">게시글 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (!postDetail) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F2F2F7] text-center">
        <p className="text-[14px] font-medium text-[#1C1C1E]">게시글 정보를 불러오지 못했습니다.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 rounded-full bg-[#1E3A8A] px-5 py-2 text-[12px] font-semibold text-white shadow-md"
        >
          이전 페이지로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F2F2F7] pb-[90px]">
      <header className="bg-white px-6 pt-6 pb-5 shadow-[0_6px_20px_rgba(0,0,0,0.05)]">
        <span className="rounded-full bg-[#E1F0FF] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#1E3A8A]">게시글 상세</span>
        <h1 className="mt-3 text-[23px] font-bold leading-tight text-[#111827]">{postDetail.title}</h1>
        <div className="mt-2 flex items-center gap-2 text-[12px] text-[#6B7280]">
          <span>{postDetail.authorName}</span>
          <span>•</span>
          <span>{postDetail.createdAt}</span>
        </div>
        <p className="mt-3 text-[14px] text-[#374151]">{postDetail.content}</p>
      </header>

      <main className="px-6 pt-6">
        <section className="rounded-[22px] bg-white p-5 shadow-[0_12px_32px_rgba(26,26,26,0.08)]">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-[#111827]">투표 리스트</h2>
            <button
              onClick={handleAddVote}
              className="rounded-full bg-[#2563EB] px-4 py-2 text-[12px] font-semibold text-white"
            >
              투표 추가
            </button>
          </div>
          <p className="mt-2 text-[12px] text-[#6B7280]">투표는 진행중 여부에 따라 다른 컴포넌트로 표시됩니다.</p>
        </section>

        <div className="mt-5 flex flex-col gap-5">
          {votes.map((vote) => (
            <VoteCard key={vote.id} vote={vote} onEnd={handleEndVote} />
          ))}
        </div>

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-[#111827]">참여여부 투표</h2>
            {!participationVote && (
              <button
                onClick={handleCreateParticipationVote}
                className="rounded-full border border-[#2563EB] px-4 py-2 text-[12px] font-semibold text-[#2563EB]"
              >
                참여여부 투표 생성하기
              </button>
            )}
          </div>

          <div className="mt-4">
            {participationVote ? (
              <ParticipationVoteCard vote={participationVote} onEnd={handleEndParticipationVote} />
            ) : (
              <div className="rounded-[22px] border border-dashed border-[#CBD5F5] bg-[#F8FAFF] p-5 text-[13px] text-[#6B7280]">
                참여여부 투표를 생성하면 참여 여부를 모을 수 있습니다.
              </div>
            )}
          </div>

          {participantCountText && <p className="mt-4 text-[13px] font-semibold text-[#1E3A8A]">{participantCountText}</p>}
        </section>

        {postDetail.isAuthor && (
          <div className="mt-8 flex gap-3">
            <button
              onClick={() => navigate(`/meet/edit/${postDetail.id}`)}
              className="flex-1 rounded-[24px] bg-[#2563EB] px-4 py-3 text-[14px] font-semibold text-white shadow-md transition hover:bg-[#1D4ED8]"
            >
              수정하기
            </button>
            <button
              onClick={() => navigate(`/meet/delete/${postDetail.id}`)}
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

export default PostDetailPage;
