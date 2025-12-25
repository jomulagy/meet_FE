import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FooterNav from "../components/FooterNav";
import VotedMemberList from "../components/popUp/VotedMemberList";
import { DateVoteAfter, DateVoteBefore, DateVoteComplete } from "../components/vote/DateVote";
import { PlaceVoteAfter, PlaceVoteBefore, PlaceVoteComplete } from "../components/vote/PlaceVote";
import { TextVoteAfter, TextVoteBefore, TextVoteComplete } from "../components/vote/TextVote";
import type { Vote, VoteType } from "../types/vote";

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
  yesMembers: { name: string }[];
  noMembers: { name: string }[];
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
      deadline: "2024-05-24 18:00",
      allowDuplicate: true,
      options: [
        {
          id: "d1",
          label: "5/25(토)",
          count: 4,
          voted: false,
          memberList: [{ name: "지민" }, { name: "서연" }, { name: "태호" }, { name: "윤아" }],
        },
        { id: "d2", label: "5/26(일)", count: 2, voted: false, memberList: [{ name: "도현" }, { name: "현수" }] },
        {
          id: "d3",
          label: "5/27(월)",
          count: 6,
          voted: false,
          memberList: [{ name: "소영" }, { name: "민재" }, { name: "지원" }, { name: "민호" }, { name: "유진" }, { name: "가영" }],
        },
      ],
    },
    {
      id: "vote-2",
      title: "회의 장소 투표",
      type: "place",
      activeYn: "Y",
      status: "after",
      deadline: "2024-05-24 20:00",
      allowDuplicate: false,
      options: [
        {
          id: "p1",
          label: "강남역 스터디룸",
          count: 5,
          voted: false,
          memberList: [{ name: "지민" }, { name: "서연" }, { name: "도현" }, { name: "현수" }, { name: "유진" }],
        },
        { id: "p2", label: "홍대 카페", count: 3, voted: true, memberList: [{ name: "태호" }, { name: "지원" }, { name: "윤아" }] },
        { id: "p3", label: "온라인", count: 4, voted: false, memberList: [{ name: "민재" }, { name: "민호" }, { name: "가영" }, { name: "소영" }] },
      ],
    },
    {
      id: "vote-3",
      title: "공지용 메시지 톤 투표",
      type: "text",
      activeYn: "N",
      status: "complete",
      deadline: "2024-05-18 12:00",
      allowDuplicate: false,
      options: [
        {
          id: "t1",
          label: "포멀",
          count: 8,
          voted: true,
          memberList: [
            { name: "지민" },
            { name: "서연" },
            { name: "태호" },
            { name: "윤아" },
            { name: "민재" },
            { name: "현수" },
            { name: "지원" },
            { name: "소영" },
          ],
        },
        { id: "t2", label: "캐주얼", count: 5, voted: false, memberList: [{ name: "도현" }, { name: "유진" }, { name: "민호" }, { name: "가영" }, { name: "지아" }] },
        { id: "t3", label: "친근함", count: 2, voted: false, memberList: [{ name: "다은" }, { name: "세진" }] },
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
    yesMembers: [{ name: "지민" }, { name: "서연" }, { name: "태호" }, { name: "윤아" }],
    noMembers: [{ name: "현수" }],
  };
};

const PostDetailPage: React.FC = () => {
  const { postId } = useParams();
  const navigate = useNavigate();

  const [postDetail, setPostDetail] = useState<PostDetail | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [participationVote, setParticipationVote] = useState<ParticipationVote | null>(null);
  const [participationChoice, setParticipationChoice] = useState<"yes" | "no" | null>(null);
  const [participationVotedChoice, setParticipationVotedChoice] = useState<"yes" | "no" | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [participationPopupMembers, setParticipationPopupMembers] = useState<{ name: string }[] | null>(null);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [newVoteTitle, setNewVoteTitle] = useState("");
  const [newVoteType, setNewVoteType] = useState<VoteType>("text");
  const [newVoteDeadline, setNewVoteDeadline] = useState("");
  const [newVoteAllowDuplicate, setNewVoteAllowDuplicate] = useState(false);
  const [newVoteErrors, setNewVoteErrors] = useState<{ title?: string; deadline?: string }>({});

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
              options: vote.options.map((option) => {
                const isSelected = (selectedOptions[voteId] ?? []).includes(option.id);
                return {
                  ...option,
                  voted: isSelected,
                  count: isSelected ? option.count + 1 : option.count,
                };
              }),
              status: "after",
            }
          : vote,
      ),
    );
  };

  const handleRevote = (voteId: string) => {
    setSelectedOptions((prev) => {
      const vote = votes.find((item) => item.id === voteId);
      if (!vote) return prev;
      const previouslySelected = vote.options.filter((option) => option.voted).map((option) => option.id);
      return {
        ...prev,
        [voteId]: previouslySelected,
      };
    });
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

  const handleToggleOption = (voteId: string, optionId: string) => {
    setSelectedOptions((prev) => {
      const vote = votes.find((item) => item.id === voteId);
      if (!vote) return prev;
      if (vote.allowDuplicate === false) {
        return {
          ...prev,
          [voteId]: [optionId],
        };
      }

      const current = new Set(prev[voteId] ?? []);
      if (current.has(optionId)) {
        current.delete(optionId);
      } else {
        current.add(optionId);
      }
      return {
        ...prev,
        [voteId]: Array.from(current),
      };
    });
  };

  const handleAddOption = (voteId: string, label: string) => {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) return;

    setVotes((prev) =>
      prev.map((vote) =>
        vote.id === voteId
          ? {
              ...vote,
              options: [
                ...vote.options,
                {
                  id: `${voteId}-option-${vote.options.length + 1}`,
                  label: trimmedLabel,
                  count: 0,
                  voted: false,
                  memberList: [],
                },
              ],
            }
          : vote,
      ),
    );
  };

  const handleAddVote = () => {
    const errors: { title?: string; deadline?: string } = {};
    if (!newVoteTitle.trim()) {
      errors.title = "투표 제목을 입력해주세요.";
    }
    if (!newVoteDeadline) {
      errors.deadline = "투표 마감일을 입력해주세요.";
    }

    if (errors.title || errors.deadline) {
      setNewVoteErrors(errors);
      return;
    }

    setVotes((prev) => [
      ...prev,
      {
        id: `vote-${Date.now()}`,
        title: newVoteTitle.trim(),
        type: newVoteType,
        activeYn: "Y",
        status: "before",
        options: [],
        deadline: newVoteDeadline ? newVoteDeadline.replace("T", " ") : undefined,
        allowDuplicate: newVoteAllowDuplicate,
      },
    ]);
    setNewVoteTitle("");
    setNewVoteType("text");
    setNewVoteDeadline("");
    setNewVoteAllowDuplicate(false);
    setNewVoteErrors({});
    setIsVoteModalOpen(false);
  };

  const handleEndAllVotes = () => {
    setVotes((prev) => prev.map((vote) => ({ ...vote, activeYn: "N", status: "complete" })));
    setParticipationVote((prev) =>
      prev ?? {
        id: `participation-${Date.now()}`,
        activeYn: "Y",
        hasVoted: false,
        yesCount: 0,
        noCount: 0,
        participantCount: 0,
        yesMembers: [],
        noMembers: [],
      },
    );
  };

  const handleCreateParticipationVote = () => {
    setParticipationVote({
      id: "participation-2",
      activeYn: "Y",
      hasVoted: false,
      yesCount: 0,
      noCount: 0,
      participantCount: 0,
      yesMembers: [],
      noMembers: [],
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

  const handleParticipationVote = () => {
    if (!participationVote || !participationChoice) return;
    setParticipationVote((prev) =>
      prev
        ? {
            ...prev,
            hasVoted: true,
            yesCount:
              participationChoice === "yes"
                ? prev.yesCount + 1 - (participationVotedChoice === "yes" ? 1 : 0)
                : prev.yesCount - (participationVotedChoice === "yes" ? 1 : 0),
            noCount:
              participationChoice === "no"
                ? prev.noCount + 1 - (participationVotedChoice === "no" ? 1 : 0)
                : prev.noCount - (participationVotedChoice === "no" ? 1 : 0),
            yesMembers:
              participationChoice === "yes"
                ? [{ name: "나" }, ...prev.yesMembers.filter((member) => member.name !== "나")]
                : prev.yesMembers.filter((member) => member.name !== "나"),
            noMembers:
              participationChoice === "no"
                ? [{ name: "나" }, ...prev.noMembers.filter((member) => member.name !== "나")]
                : prev.noMembers.filter((member) => member.name !== "나"),
          }
        : prev,
    );
    setParticipationVotedChoice(participationChoice);
  };

  const participantCountText = useMemo(() => {
    if (!participationVote || participationVote.activeYn !== "N") return null;
    return `참여 인원: ${participationVote.participantCount}명`;
  }, [participationVote]);

  const renderClosedVote = (vote: Vote) => {
    const decidedOption = vote.options.reduce<Vote["options"][number] | null>((winner, option) => {
      if (!winner || option.count > winner.count) return option;
      return winner;
    }, null);

    return (
      <div className="mt-3 rounded-[16px] bg-[#F9F9FB] px-4 py-3 text-sm font-semibold text-[#5856D6]">
        {decidedOption ? decidedOption.label : "선택된 항목이 없습니다."}
      </div>
    );
  };

  const renderVoteState = (vote: Vote) => {
    if (vote.activeYn === "N") {
      return renderClosedVote(vote);
    }

    const onVote = () => handleVote(vote.id);
    const onRevote = () => handleRevote(vote.id);
    const selectedOptionIds = selectedOptions[vote.id] ?? [];
    const onToggleOption = (optionId: string) => handleToggleOption(vote.id, optionId);
    const onAddOption = (label: string) => handleAddOption(vote.id, label);
    if (vote.type === "date") {
      if (vote.status === "before")
        return (
          <DateVoteBefore
            vote={vote}
            allowDuplicate={vote.allowDuplicate !== false}
            selectedOptionIds={selectedOptionIds}
            onToggleOption={onToggleOption}
            onVote={onVote}
            onAddOption={onAddOption}
          />
        );
      if (vote.status === "after") return <DateVoteAfter vote={vote} onRevote={onRevote} />;
      return <DateVoteComplete vote={vote} />;
    }

    if (vote.type === "place") {
      if (vote.status === "before")
        return (
          <PlaceVoteBefore
            vote={vote}
            allowDuplicate={vote.allowDuplicate !== false}
            selectedOptionIds={selectedOptionIds}
            onToggleOption={onToggleOption}
            onVote={onVote}
            onAddOption={onAddOption}
          />
        );
      if (vote.status === "after") return <PlaceVoteAfter vote={vote} onRevote={onRevote} />;
      return <PlaceVoteComplete vote={vote} />;
    }

    if (vote.status === "before")
      return (
        <TextVoteBefore
          vote={vote}
          allowDuplicate={vote.allowDuplicate !== false}
          selectedOptionIds={selectedOptionIds}
          onToggleOption={onToggleOption}
          onVote={onVote}
          onAddOption={onAddOption}
        />
      );
    if (vote.status === "after") return <TextVoteAfter vote={vote} onRevote={onRevote} />;
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
      <div className="mx-auto flex w-full max-w-screen-sm flex-col gap-5 px-4 pb-24 pt-6">
        <header className="rounded-[20px] bg-white p-5 shadow-sm">
          <h1 className="text-left text-xl font-bold text-[#1C1C1E]">{postDetail.title}</h1>
          <p className="mt-4 text-sm text-[#1C1C1E]">{postDetail.content}</p>
        </header>

        <section className="space-y-4">
          <div className="flex flex-col gap-5">
            {votes.map((vote) => {
              const isClosed = vote.activeYn === "N";

              return (
                <div key={vote.id} className="rounded-[20px] bg-white p-5 shadow-sm">
                  {!isClosed && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleEndVote(vote.id)}
                        className="rounded-full bg-[#EAE9FF] px-3 py-1 text-[11px] font-semibold text-[#5856D6]"
                      >
                        투표 종료
                      </button>
                    </div>
                  )}
                  <div className="mt-2 flex items-start justify-between">
                    <h3 className="text-base font-semibold text-[#1C1C1E]">{vote.title}</h3>
                    {!isClosed && (
                      <div className="flex flex-col items-end gap-1 text-[11px] font-semibold text-[#8E8E93]">
                        {vote.deadline && (
                          <span>마감일 : {vote.deadline.split(" ")[0].replace(/-/g, ".")}</span>
                        )}
                        {vote.allowDuplicate && <span>중복 가능</span>}
                      </div>
                    )}
                  </div>

                  {renderVoteState(vote)}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => {
              setNewVoteErrors({});
              setIsVoteModalOpen(true);
            }}
            className="w-full rounded-[16px] bg-[#5856D6] px-4 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#4C4ACB]"
          >
            투표 추가
          </button>
          <button
            onClick={handleEndAllVotes}
            className="w-full rounded-[16px] border border-[#E5E5EA] bg-white px-4 py-3 text-xs font-semibold text-[#5856D6] shadow-sm transition hover:border-[#C7C7CC]"
          >
            투표 종료
          </button>
        </section>

        <section className="space-y-4">
          {(!participationVote || participationVote.activeYn !== "N") && (
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#1C1C1E]">참여 여부 투표</h2>
              {!participationVote && (
                <button
                  onClick={handleCreateParticipationVote}
                  className="rounded-[16px] border border-[#5856D6] px-4 py-2 text-xs font-semibold text-[#5856D6] transition hover:border-[#4C4ACB]"
                >
                  참여 여부 투표 생성하기
                </button>
              )}
            </div>
          )}

          <div>
            {participationVote ? (
              participationVote.activeYn === "N" ? (
                <div className="space-y-2">
                  {participantCountText && (
                    <p className="text-sm font-semibold text-[#4C4ACB]">{participantCountText}</p>
                  )}
                  <div className="rounded-[16px] bg-white p-4 text-xs text-[#8E8E93]">
                    <div className="flex flex-wrap gap-2">
                      {participationVote.yesMembers.length > 0 ? (
                        participationVote.yesMembers.map((member) => (
                          <span
                            key={`participant-${member.name}`}
                            className="rounded-full border border-[#E5E5EA] bg-white px-2 py-1 text-[10px] font-semibold text-[#5856D6]"
                          >
                            {member.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px]">참여자가 없습니다.</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-[20px] bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-[#1C1C1E]">참여 여부</h3>
                    </div>
                    <button
                      onClick={handleEndParticipationVote}
                      className="rounded-full bg-[#EAE9FF] px-3 py-1 text-[11px] font-semibold text-[#5856D6]"
                    >
                      투표 종료
                    </button>
                  </div>

                  {participationVote.hasVoted ? (
                    <div className="mt-4 rounded-[16px] border border-[#E5E5EA] bg-white p-4">
                      <div className="flex flex-col gap-2 text-xs text-[#1C1C1E]">
                        <div
                          className={`flex items-center justify-between rounded-xl border px-4 py-2 ${
                            participationVotedChoice === "yes"
                              ? "border-[#5856D6] bg-[#EAE9FF] text-[#1C1C1E]"
                              : "border-[#E5E5EA] bg-white text-[#1C1C1E]"
                          }`}
                        >
                          <span>참여</span>
                          <button
                            type="button"
                            onClick={() => setParticipationPopupMembers(participationVote.yesMembers)}
                            className="bg-transparent text-[11px] font-semibold text-[#5856D6]"
                          >
                            {participationVote.yesCount}명
                          </button>
                        </div>
                        <div
                          className={`flex items-center justify-between rounded-xl border px-4 py-2 ${
                            participationVotedChoice === "no"
                              ? "border-[#5856D6] bg-[#EAE9FF] text-[#1C1C1E]"
                              : "border-[#E5E5EA] bg-white text-[#1C1C1E]"
                          }`}
                        >
                          <span>불참</span>
                          <button
                            type="button"
                            onClick={() => setParticipationPopupMembers(participationVote.noMembers)}
                            className="bg-transparent text-[11px] font-semibold text-[#5856D6]"
                          >
                            {participationVote.noCount}명
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setParticipationChoice(participationVotedChoice);
                          setParticipationVote((prev) => (prev ? { ...prev, hasVoted: false } : prev));
                        }}
                        className="mt-4 w-full rounded-[16px] border border-[#E5E5EA] bg-white px-5 py-2 text-xs font-semibold text-[#5856D6] transition hover:border-[#C7C7CC]"
                      >
                        다시 투표하기
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-[16px] border border-dashed border-[#C7C7CC] bg-[#F9F9FB] p-4">
                      <div className="flex flex-col gap-3">
                        <label className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-xs text-[#1C1C1E]">
                          <input
                            type="radio"
                            name="participation"
                            checked={participationChoice === "yes"}
                            className="h-4 w-4 text-[#5856D6]"
                            onChange={() => setParticipationChoice("yes")}
                          />
                          참여
                        </label>
                        <label className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-xs text-[#1C1C1E]">
                          <input
                            type="radio"
                            name="participation"
                            checked={participationChoice === "no"}
                            className="h-4 w-4 text-[#5856D6]"
                            onChange={() => setParticipationChoice("no")}
                          />
                          불참
                        </label>
                      </div>
                      <button
                        className="mt-4 w-full rounded-[16px] bg-[#5856D6] px-5 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#4C4ACB]"
                        onClick={handleParticipationVote}
                      >
                        투표하기
                      </button>
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="rounded-[20px] border border-dashed border-[#C7C7CC] bg-[#F9F9FB] p-5 text-xs text-[#8E8E93]">
                참여 여부 투표를 생성하면 참여 여부를 모을 수 있습니다.
              </div>
            )}
          </div>

          {!participationVote || participationVote.activeYn !== "N" ? (
            participantCountText && <p className="text-sm font-semibold text-[#4C4ACB]">{participantCountText}</p>
          ) : null}
        </section>

        {postDetail.isAuthor && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate(`/meet/edit/${postDetail.id}`)}
              className="w-full rounded-[16px] bg-[#5856D6] px-5 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#4C4ACB]"
            >
              수정하기
            </button>
            <button
              onClick={() => navigate(`/meet/delete/${postDetail.id}`)}
              className="w-full rounded-[16px] bg-[#FF3B30] px-5 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#e1342b]"
            >
              삭제하기
            </button>
          </div>
        )}
      </div>

      {isVoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#5856D6]/20 px-4">
          <div className="w-full max-w-sm rounded-[20px] bg-white p-5 shadow-lg">
            <h3 className="text-base font-semibold text-[#1C1C1E]">투표 추가</h3>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#8E8E93]">투표 제목</label>
                <input
                  type="text"
                  value={newVoteTitle}
                  onChange={(event) => {
                    setNewVoteTitle(event.target.value);
                    setNewVoteErrors((prev) => ({ ...prev, title: undefined }));
                  }}
                  placeholder="제목을 입력하세요"
                  className="w-full rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-sm font-semibold text-[#4C4ACB] focus:border-[#FFE607] focus:outline-none"
                />
                {newVoteErrors.title && (
                  <p className="text-[11px] font-semibold text-[#FF3B30]">{newVoteErrors.title}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#8E8E93]">투표 타입</label>
                <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                  {(["date", "place", "text"] as VoteType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewVoteType(type)}
                      className={`rounded-[12px] px-3 py-2 ${
                        newVoteType === type
                          ? "bg-[#5856D6] text-white shadow-sm"
                          : "border border-[#E5E5EA] bg-white text-[#5856D6]"
                      }`}
                    >
                      {type === "date" ? "날짜" : type === "place" ? "장소" : "텍스트"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#8E8E93]">투표 마감일</label>
                <input
                  type="datetime-local"
                  value={newVoteDeadline}
                  onChange={(event) => {
                    setNewVoteDeadline(event.target.value);
                    setNewVoteErrors((prev) => ({ ...prev, deadline: undefined }));
                  }}
                  className="w-full rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-sm font-semibold text-[#4C4ACB] focus:border-[#FFE607] focus:outline-none"
                />
                {newVoteErrors.deadline && (
                  <p className="text-[11px] font-semibold text-[#FF3B30]">{newVoteErrors.deadline}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#8E8E93]">중복 투표</label>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setNewVoteAllowDuplicate(true)}
                    className={`rounded-[12px] px-3 py-2 ${
                      newVoteAllowDuplicate
                        ? "bg-[#5856D6] text-white shadow-sm"
                        : "border border-[#E5E5EA] bg-white text-[#5856D6]"
                    }`}
                  >
                    가능
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewVoteAllowDuplicate(false)}
                    className={`rounded-[12px] px-3 py-2 ${
                      !newVoteAllowDuplicate
                        ? "bg-[#5856D6] text-white shadow-sm"
                        : "border border-[#E5E5EA] bg-white text-[#5856D6]"
                    }`}
                  >
                    불가
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setIsVoteModalOpen(false)}
                className="flex-1 rounded-[14px] border border-[#E5E5EA] bg-white px-4 py-3 text-xs font-semibold text-[#5856D6] transition hover:border-[#C7C7CC]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleAddVote}
                className="flex-1 rounded-[14px] bg-[#5856D6] px-4 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#4C4ACB]"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {participationPopupMembers && (
        <VotedMemberList
          selectedItem={{ memberList: participationPopupMembers }}
          closePopup={() => setParticipationPopupMembers(null)}
        />
      )}

      <FooterNav />
    </div>
  );
};

export default PostDetailPage;
