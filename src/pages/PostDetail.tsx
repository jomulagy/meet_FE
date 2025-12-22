import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FooterNav from "../components/FooterNav";
import { DateVoteAfter, DateVoteBefore, DateVoteComplete } from "../components/vote/DateVote";
import { PlaceVoteAfter, PlaceVoteBefore, PlaceVoteComplete } from "../components/vote/PlaceVote";
import { TextVoteAfter, TextVoteBefore, TextVoteComplete } from "../components/vote/TextVote";
import type { Vote } from "../types/vote";

type PostDetail = {
  id: string;
  title: string;
  content: string;
  authorName: string;
  createdAt: string;
  isAuthor: boolean;
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
      status: "before",
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
      status: "after",
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
      status: "complete",
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
  date: "bg-[#E1F0FF] text-[#1E3A8A]",
  place: "bg-[#E7F7EE] text-[#047857]",
  text: "bg-[#FFF6D7] text-[#92400E]",
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

  const handleVote = (voteId: string) => {
    setVotes((prev) =>
      prev.map((vote) =>
        vote.id === voteId
          ? {
              ...vote,
              status: "after",
            }
          : vote,
      ),
    );
  };

  const handleRevote = (voteId: string) => {
    setVotes((prev) =>
      prev.map((vote) =>
        vote.id === voteId
          ? {
              ...vote,
              status: "before",
            }
          : vote,
      ),
    );
  };

  const handleCompleteVote = (voteId: string) => {
    setVotes((prev) =>
      prev.map((vote) =>
        vote.id === voteId
          ? {
              ...vote,
              status: "complete",
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
        status: "before",
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

  const renderClosedVote = (vote: Vote) => (
    <div className="mt-4 rounded-[20px] border border-[#E5E5EA] bg-[#F9F9FB] p-4">
      <p className="text-xs font-semibold text-[#8E8E93]">투표 종료</p>
      <div className="mt-3 flex flex-col gap-2 text-xs text-[#1C1C1E] sm:text-sm">
        {vote.options.map((option) => (
          <div key={option.id} className="flex items-center justify-between">
            <span>{option.label}</span>
            <span className="font-semibold text-[#8E8E93]">{option.count}표</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderVoteState = (vote: Vote) => {
    if (vote.activeYn === "N") {
      return renderClosedVote(vote);
    }

    const onVote = () => handleVote(vote.id);
    const onRevote = () => handleRevote(vote.id);
    const onComplete = () => handleCompleteVote(vote.id);

    if (vote.type === "date") {
      if (vote.status === "before") return <DateVoteBefore vote={vote} onVote={onVote} />;
      if (vote.status === "after") return <DateVoteAfter vote={vote} onRevote={onRevote} onComplete={onComplete} />;
      return <DateVoteComplete vote={vote} />;
    }

    if (vote.type === "place") {
      if (vote.status === "before") return <PlaceVoteBefore vote={vote} onVote={onVote} />;
      if (vote.status === "after") return <PlaceVoteAfter vote={vote} onRevote={onRevote} onComplete={onComplete} />;
      return <PlaceVoteComplete vote={vote} />;
    }

    if (vote.status === "before") return <TextVoteBefore vote={vote} onVote={onVote} />;
    if (vote.status === "after") return <TextVoteAfter vote={vote} onRevote={onRevote} onComplete={onComplete} />;
    return <TextVoteComplete vote={vote} />;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#F2F2F7]">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-[#E5E5EA] border-t-[#5856D6]" />
        <p className="mt-4 text-[13px] text-[#8E8E93]">게시글 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (!postDetail) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#F2F2F7] text-center">
        <p className="text-[14px] font-medium text-[#1C1C1E]">게시글 정보를 불러오지 못했습니다.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 rounded-[16px] bg-[#5856D6] px-5 py-2 text-xs font-semibold text-white shadow-sm"
        >
          이전 페이지로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F2F2F7]">
      <div className="mx-auto flex w-full max-w-screen-sm flex-col gap-6 px-4 pb-24 pt-8 sm:max-w-screen-md sm:px-6 sm:pb-28 lg:max-w-4xl">
        <header className="rounded-[24px] bg-white p-6 shadow-sm">
          <span className="rounded-full bg-[#E1F0FF] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#1E3A8A]">
            게시글 상세
          </span>
          <h1 className="mt-4 text-left text-2xl font-bold text-[#1C1C1E] sm:text-3xl">{postDetail.title}</h1>
          <div className="mt-2 flex items-center gap-2 text-xs text-[#8E8E93] sm:text-sm">
            <span>{postDetail.authorName}</span>
            <span>•</span>
            <span>{postDetail.createdAt}</span>
          </div>
          <p className="mt-4 text-sm text-[#1C1C1E] sm:text-base">{postDetail.content}</p>
        </header>

        <section className="space-y-4">
          <div className="rounded-[24px] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#1C1C1E]">투표 리스트</h2>
                <p className="mt-1 text-xs text-[#8E8E93] sm:text-sm">투표 진행 상태에 따라 화면이 변경됩니다.</p>
              </div>
              <button
                onClick={handleAddVote}
                className="rounded-[16px] bg-[#5856D6] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#4C4ACB] sm:text-sm"
              >
                투표 추가
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {votes.map((vote) => {
              const typeLabel = vote.type === "date" ? "날짜" : vote.type === "place" ? "장소" : "텍스트";

              return (
                <div key={vote.id} className="rounded-[24px] bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${typeBadge[vote.type]}`}>
                        {typeLabel} 투표
                      </span>
                      <h3 className="mt-3 text-lg font-semibold text-[#1C1C1E]">{vote.title}</h3>
                    </div>
                    <button
                      onClick={() => handleEndVote(vote.id)}
                      className="rounded-full border border-[#E5E5EA] px-3 py-1 text-[11px] font-semibold text-[#8E8E93]"
                    >
                      투표 종료
                    </button>
                  </div>

                  {renderVoteState(vote)}
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1C1C1E]">참여여부 투표</h2>
            {!participationVote && (
              <button
                onClick={handleCreateParticipationVote}
                className="rounded-[16px] border border-[#5856D6] px-4 py-2 text-xs font-semibold text-[#5856D6] transition hover:border-[#4C4ACB] sm:text-sm"
              >
                참여여부 투표 생성하기
              </button>
            )}
          </div>

          <div>
            {participationVote ? (
              <div className="rounded-[24px] bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${
                        participationVote.activeYn === "N" ? "bg-[#FEE2E2] text-[#991B1B]" : "bg-[#E1F0FF] text-[#1E3A8A]"
                      }`}
                    >
                      {participationVote.activeYn === "N" ? "참여여부 투표 종료" : "참여여부 투표"}
                    </span>
                    <h3 className="mt-3 text-lg font-semibold text-[#1C1C1E]">참여 가능 여부</h3>
                  </div>
                  <button
                    onClick={handleEndParticipationVote}
                    className="rounded-full border border-[#E5E5EA] px-3 py-1 text-[11px] font-semibold text-[#8E8E93]"
                  >
                    {participationVote.activeYn === "N" ? "종료됨" : "투표 종료"}
                  </button>
                </div>

                {participationVote.activeYn === "N" ? (
                  <div className="mt-4 rounded-[20px] border border-[#E5E5EA] bg-[#F9F9FB] p-4">
                    <div className="flex justify-between text-xs text-[#1C1C1E] sm:text-sm">
                      <span>참여</span>
                      <span className="font-semibold">{participationVote.yesCount}명</span>
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-[#1C1C1E] sm:text-sm">
                      <span>불참</span>
                      <span className="font-semibold">{participationVote.noCount}명</span>
                    </div>
                  </div>
                ) : participationVote.hasVoted ? (
                  <div className="mt-4 rounded-[20px] border border-[#E5E5EA] bg-white p-4">
                    <p className="text-xs font-semibold text-[#1C1C1E]">투표 후</p>
                    <div className="mt-3 flex flex-col gap-2 text-xs text-[#1C1C1E] sm:text-sm">
                      <div className="flex justify-between">
                        <span>참여</span>
                        <span className="font-semibold">{participationVote.yesCount}명</span>
                      </div>
                      <div className="flex justify-between">
                        <span>불참</span>
                        <span className="font-semibold">{participationVote.noCount}명</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-[20px] border border-dashed border-[#C7C7CC] bg-[#F9F9FB] p-4">
                    <p className="text-xs font-semibold text-[#4C4ACB]">투표 전</p>
                    <div className="mt-3 flex flex-col gap-3">
                      <label className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-xs text-[#1C1C1E] sm:text-sm">
                        <input type="radio" name="participation" className="h-4 w-4 text-[#5856D6]" />
                        참여
                      </label>
                      <label className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-xs text-[#1C1C1E] sm:text-sm">
                        <input type="radio" name="participation" className="h-4 w-4 text-[#5856D6]" />
                        불참
                      </label>
                    </div>
                    <button className="mt-4 w-full rounded-[16px] bg-[#5856D6] px-5 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#4C4ACB] sm:text-sm">
                      투표하기
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-[#C7C7CC] bg-[#F9F9FB] p-5 text-xs text-[#8E8E93] sm:text-sm">
                참여여부 투표를 생성하면 참여 여부를 모을 수 있습니다.
              </div>
            )}
          </div>

          {participantCountText && <p className="text-sm font-semibold text-[#4C4ACB]">{participantCountText}</p>}
        </section>

        {postDetail.isAuthor && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate(`/meet/edit/${postDetail.id}`)}
              className="w-full rounded-[16px] bg-[#5856D6] px-5 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#4C4ACB] sm:text-sm"
            >
              수정하기
            </button>
            <button
              onClick={() => navigate(`/meet/delete/${postDetail.id}`)}
              className="w-full rounded-[16px] bg-[#FF3B30] px-5 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#e1342b] sm:text-sm"
            >
              삭제하기
            </button>
          </div>
        )}
      </div>

      <FooterNav />
    </div>
  );
};

export default PostDetailPage;
