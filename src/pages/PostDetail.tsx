import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import FooterNav from "../components/FooterNav";
import VotedMemberList from "../components/popUp/VotedMemberList";
import { DateVoteAfter, DateVoteBefore, DateVoteComplete } from "../components/vote/DateVote";
import { PlaceVoteAfter, PlaceVoteBefore, PlaceVoteComplete } from "../components/vote/PlaceVote";
import { TextVoteAfter, TextVoteBefore, TextVoteComplete } from "../components/vote/TextVote";
import {
  addVoteOption,
  castVote,
  closeAllVotes,
  closeVote,
  createVote,
  fetchPostDetail,
  fetchVoteList,
  deleteVote,
  reopenVote,
} from "../api/postDetail";
import type { PostDetailResponse, VoteListResponse } from "../types/postDetailResponse";
import type { Vote, VoteType } from "../types/vote";

type PostDetail = PostDetailResponse;

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

const mapVoteResponses = (response?: VoteListResponse): Vote[] => {
  if (!response) return [];
  return response.votes.map((vote) => ({
    id: vote.id,
    title: vote.title,
    type: vote.type,
    activeYn: vote.isClosed ? "N" : "Y",
    status: vote.status,
    options: vote.options.map((option) => ({
      id: option.id,
      label: option.value,
      count: option.voters.length,
      voted: option.isVoted,
      memberList: option.voters.map((name) => ({ name })),
    })),
    deadline: vote.deadline ?? undefined,
    allowDuplicate: vote.allowDuplicate,
  }));
};

const formatVoteDeadline = (deadline?: string | null) => {
  if (!deadline) return "";
  const [datePart] = deadline.split(/[T ]/);
  return datePart.replace(/-/g, ".");
};

const PostDetailPage: React.FC = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [participationVote, setParticipationVote] = useState<ParticipationVote | null>(null);
  const [participationChoice, setParticipationChoice] = useState<"yes" | "no" | null>(null);
  const [participationVotedChoice, setParticipationVotedChoice] = useState<"yes" | "no" | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [voteErrors, setVoteErrors] = useState<Record<string, string>>({});
  const [participationPopupMembers, setParticipationPopupMembers] = useState<{ name: string }[] | null>(null);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [newVoteTitle, setNewVoteTitle] = useState("");
  const [newVoteType, setNewVoteType] = useState<VoteType>("text");
  const [newVoteDeadline, setNewVoteDeadline] = useState("");
  const [newVoteAllowDuplicate, setNewVoteAllowDuplicate] = useState(false);
  const [newVoteErrors, setNewVoteErrors] = useState<{ title?: string; deadline?: string }>({});

  const { data: postDetail, isPending: isPostLoading } = useQuery<PostDetail>({
    queryKey: ["postDetail", postId],
    queryFn: () => fetchPostDetail(postId ?? ""),
    enabled: !!postId,
  });

  const {
    data: voteListResponse,
    isPending: isVoteLoading,
    isFetching: isVoteFetching,
    refetch: refetchVoteList,
  } = useQuery<VoteListResponse>({
    queryKey: ["postVotes", postId],
    queryFn: () => fetchVoteList(postId ?? ""),
    enabled: !!postId && postDetail?.isVoteClosed === false,
  });

  const votes = useMemo(() => mapVoteResponses(voteListResponse), [voteListResponse]);
  const hasVotes = votes.length > 0;
  const hasActiveVotes = useMemo(() => votes.some((vote) => vote.activeYn === "Y"), [votes]);
  const isLoading = isPostLoading || (postDetail?.isVoteClosed === false && (isVoteLoading || isVoteFetching));
  const canManageVotes = postDetail?.isAuthor === true;
  const showVoteSection = postDetail?.isVoteClosed === false;
  const showVoteAddButton = canManageVotes && postDetail?.isVoteClosed === false;
  const showVoteCloseButton = canManageVotes && postDetail?.isVoteClosed === false && hasVotes;

  const addVoteOptionMutation = useMutation({
    mutationFn: ({ voteId, optionValue }: { voteId: string; optionValue: string }) => addVoteOption({ voteId, optionValue }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["postVotes", postId] }),
  });

  const createVoteMutation = useMutation({
    mutationFn: (payload: {
      postId: string;
      title: string;
      type: VoteType;
      allowDuplicate: boolean;
      deadline?: string;
    }) => createVote(payload),
    onSuccess: async () => {
      await refetchVoteList();
      queryClient.invalidateQueries({ queryKey: ["postDetail", postId] });
      setNewVoteTitle("");
      setNewVoteType("text");
      setNewVoteDeadline("");
      setNewVoteAllowDuplicate(false);
      setNewVoteErrors({});
      setIsVoteModalOpen(false);
    },
  });

  const closeVoteMutation = useMutation({
    mutationFn: (voteId: string) => closeVote(voteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["postVotes", postId] }),
  });

  const deleteVoteMutation = useMutation({
    mutationFn: (voteId: string) => deleteVote(voteId, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postVotes", postId] });
      queryClient.invalidateQueries({ queryKey: ["postDetail", postId] });
    },
  });

  const closeAllVotesMutation = useMutation({
    mutationFn: () => closeAllVotes(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postVotes", postId] });
      queryClient.invalidateQueries({ queryKey: ["postDetail", postId] });
    },
  });

  const castVoteMutation = useMutation({
    mutationFn: ({ voteId, optionIds }: { voteId: string; optionIds: string[] }) =>
      castVote({ voteId, optionIds }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["postVotes", postId] });
      setSelectedOptions((prev) => {
        const updated = { ...prev };
        delete updated[variables.voteId];
        return updated;
      });
    },
  });

  const reopenVoteMutation = useMutation({
    mutationFn: (voteId: string) => reopenVote(voteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["postVotes", postId] }),
  });

  const handleEndVote = (voteId: string) => {
    closeVoteMutation.mutate(voteId);
  };

  const handleDeleteVote = (voteId: string) => {
    deleteVoteMutation.mutate(voteId);
  };

  const handleVote = (voteId: string) => {
    const optionIds = selectedOptions[voteId] ?? [];
    if (optionIds.length === 0) {
      setVoteErrors((prev) => ({ ...prev, [voteId]: "투표할 항목을 선택해주세요." }));
      return;
    }

    setVoteErrors((prev) => {
      const updated = { ...prev };
      delete updated[voteId];
      return updated;
    });
    castVoteMutation.mutate({ voteId, optionIds });
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
    reopenVoteMutation.mutate(voteId);
  };

  const handleToggleOption = (voteId: string, optionId: string) => {
    setVoteErrors((prev) => {
      if (!prev[voteId]) return prev;
      const updated = { ...prev };
      delete updated[voteId];
      return updated;
    });
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
    addVoteOptionMutation.mutate({ voteId, optionValue: trimmedLabel });
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

    if (!postId) return;

    const deadlineDateOnly = newVoteDeadline.split("T")[0] || newVoteDeadline;

    createVoteMutation.mutate({
      postId,
      title: newVoteTitle.trim(),
      type: newVoteType,
      allowDuplicate: newVoteAllowDuplicate,
      deadline: deadlineDateOnly || undefined,
    });
  };

  const handleEndAllVotes = () => {
    closeAllVotesMutation.mutate();
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
    console.log(vote)
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

  if (isLoading) {
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

        {showVoteSection && (
          <section className="space-y-4">
            <div className="flex flex-col gap-5">
              {votes.map((vote) => {
                const isClosed = vote.activeYn === "N";

                return (
                  <div key={vote.id} className="rounded-[20px] bg-white p-5 shadow-sm">
                    {!isClosed && canManageVotes && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleDeleteVote(vote.id)}
                          className="rounded-full border border-[#FF3B30] bg-white px-3 py-1 text-[11px] font-semibold text-[#FF3B30]"
                        >
                          투표 삭제
                        </button>
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
                          {vote.deadline && <span>마감일 : {formatVoteDeadline(vote.deadline)}</span>}
                          {vote.allowDuplicate && <span>중복 가능</span>}
                        </div>
                      )}
                    </div>

                    {renderVoteState(vote)}
                    {voteErrors[vote.id] && (
                      <p className="mt-2 text-[11px] font-semibold text-[#FF3B30]">{voteErrors[vote.id]}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {showVoteAddButton && (
              <>
                <button
                  onClick={() => {
                    setNewVoteErrors({});
                    setIsVoteModalOpen(true);
                  }}
                  className="w-full rounded-[16px] bg-[#5856D6] px-4 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#4C4ACB]"
                >
                  투표 추가
                </button>
                {showVoteCloseButton && (
                  <button
                    onClick={handleEndAllVotes}
                    className="w-full rounded-[16px] border border-[#E5E5EA] bg-white px-4 py-3 text-xs font-semibold text-[#5856D6] shadow-sm transition hover:border-[#C7C7CC]"
                  >
                    투표 종료
                  </button>
                )}
              </>
            )}
          </section>
        )}

        {!hasActiveVotes && participationVote && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#1C1C1E]">참여 여부 투표</h2>
            </div>

            <div>
              {participationVote.activeYn === "N" ? (
                <div className="space-y-2">
                  {participantCountText && <p className="text-sm font-semibold text-[#4C4ACB]">{participantCountText}</p>}
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
                    {canManageVotes && (
                      <button
                        onClick={handleEndParticipationVote}
                        className="rounded-full bg-[#EAE9FF] px-3 py-1 text-[11px] font-semibold text-[#5856D6]"
                      >
                        투표 종료
                      </button>
                    )}
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
              )}
            </div>

            {participantCountText && <p className="text-sm font-semibold text-[#4C4ACB]">{participantCountText}</p>}
          </section>
        )}

        {canManageVotes && (
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
                  type="date"
                  value={newVoteDeadline}
                  onChange={(event) => {
                    const dateOnly = event.target.value.split("T")[0] || event.target.value;
                    setNewVoteDeadline(dateOnly);
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
