import type { VoteStatus, VoteType } from "../types/vote";
import {
  PostDetailResponse,
  VoteItemResponse,
  VoteListResponse,
  VoteOptionResponse,
} from "../types/postDetailResponse";
import { server } from "@/utils/axios";

const CURRENT_USER = "나";

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

const cloneVote = (vote: VoteItemResponse): VoteItemResponse =>
  new VoteItemResponse(
    vote.id,
    vote.title,
    vote.isClosed,
    vote.deadline,
    vote.allowDuplicate,
    vote.type,
    vote.result,
    vote.status,
    vote.options.map((option) => new VoteOptionResponse(option.id, option.value, option.isVoted, [...option.voters])),
  );

const cloneVotes = (votes: VoteItemResponse[]) => new VoteListResponse(votes.map(cloneVote));

const resolveWinner = (vote: VoteItemResponse): string | null => {
  if (vote.options.length === 0) return null;
  const sorted = [...vote.options].sort((a, b) => b.voters.length - a.voters.length);
  return sorted[0]?.value ?? null;
};

let postDetailStore = new PostDetailResponse(
  "post-1",
  "팀 빌딩 회의 일정 잡기",
  "이번 주 금요일까지 가능한 시간과 장소를 투표해주세요.",
  true,
  false,
);

let voteStore: VoteItemResponse[] = [
  new VoteItemResponse(
    "vote-1",
    "회의 날짜 투표",
    false,
    "2024-05-24 18:00",
    true,
    "date",
    null,
    "before",
    [
      new VoteOptionResponse("d1", "5/25(토)", false, ["지민", "서연", "태호", "윤아"]),
      new VoteOptionResponse("d2", "5/26(일)", false, ["도현", "현수"]),
      new VoteOptionResponse("d3", "5/27(월)", false, ["소영", "민재", "지원", "민호", "유진", "가영"]),
    ],
  ),
  new VoteItemResponse(
    "vote-2",
    "회의 장소 투표",
    false,
    "2024-05-24 20:00",
    false,
    "place",
    null,
    "after",
    [
      new VoteOptionResponse("p1", "강남역 스터디룸", false, ["지민", "서연", "도현", "현수", "유진"]),
      new VoteOptionResponse("p2", "홍대 카페", true, ["태호", "지원", "윤아"]),
      new VoteOptionResponse("p3", "온라인", false, ["민재", "민호", "가영", "소영"]),
    ],
  ),
  new VoteItemResponse(
    "vote-3",
    "공지용 메시지 톤 투표",
    true,
    "2024-05-18 12:00",
    false,
    "text",
    "포멀",
    "complete",
    [
      new VoteOptionResponse(
        "t1",
        "포멀",
        true,
        ["지민", "서연", "태호", "윤아", "민재", "현수", "지원", "소영"],
      ),
      new VoteOptionResponse("t2", "캐주얼", false, ["도현", "유진", "민호", "가영", "지아"]),
      new VoteOptionResponse("t3", "친근함", false, ["다은", "세진"]),
    ],
  ),
];

const ensurePostId = (postId: string) => {
  if (postId && postDetailStore.id !== postId) {
    postDetailStore = new PostDetailResponse(
      postId,
      postDetailStore.title,
      postDetailStore.content,
      postDetailStore.isAuthor,
      postDetailStore.isVoteClosed,
    );
  }
};

type RawPostDetailResponse = {
  id?: string | number;
  title?: string;
  content?: string;
  canEdit?: boolean;
  isAuthor?: boolean | string;
  isVoteClosed?: boolean;
  voteClosed?: boolean;
  isVoteEnd?: boolean;
};

type PostDetailApiResponse = {
  data?: RawPostDetailResponse;
};

export const fetchPostDetail = async (postId: string): Promise<PostDetailResponse> => {
  const response = await server.get<PostDetailApiResponse>(`/post/${postId}`);
  const data = response.data ?? {};

  const id = data.id != null ? String(data.id) : postId;
  const canEdit = typeof data.isAuthor === "string" ? data.isAuthor === "true" : Boolean(data.isAuthor ?? data.canEdit);
  const isVoteClosed = Boolean(data.isVoteClosed ?? data.voteClosed ?? data.isVoteEnd);

  postDetailStore = new PostDetailResponse(
    id,
    data.title ?? postDetailStore.title,
    data.content ?? postDetailStore.content,
    canEdit,
    isVoteClosed,
  );

  return new PostDetailResponse(
    postDetailStore.id,
    postDetailStore.title,
    postDetailStore.content,
    postDetailStore.isAuthor,
    postDetailStore.isVoteClosed,
  );
};

export const fetchVoteList = async (postId: string): Promise<VoteListResponse> => {
  ensurePostId(postId);
  await delay();
  if (postDetailStore.isVoteClosed) {
    return new VoteListResponse([]);
  }
  return cloneVotes(voteStore);
};

export const addVoteOption = async ({
  voteId,
  optionValue,
}: {
  voteId: string;
  optionValue: string;
}): Promise<VoteListResponse> => {
  await delay();
  voteStore = voteStore.map((vote) => {
    if (vote.id !== voteId) return vote;
    const newOption = new VoteOptionResponse(
      `${voteId}-option-${vote.options.length + 1}`,
      optionValue,
      false,
      [],
    );
    return new VoteItemResponse(
      vote.id,
      vote.title,
      vote.isClosed,
      vote.deadline,
      vote.allowDuplicate,
      vote.type,
      vote.result,
      vote.status,
      [...vote.options, newOption],
    );
  });
  return cloneVotes(voteStore);
};

export const createVote = async ({
  title,
  type,
  allowDuplicate,
  deadline,
}: {
  title: string;
  type: VoteType;
  allowDuplicate: boolean;
  deadline?: string;
}): Promise<VoteListResponse> => {
  await delay();
  const newVote = new VoteItemResponse(
    `vote-${Date.now()}`,
    title,
    false,
    deadline ?? null,
    allowDuplicate,
    type,
    null,
    "before",
    [],
  );
  voteStore = [...voteStore, newVote];
  postDetailStore = new PostDetailResponse(
    postDetailStore.id,
    postDetailStore.title,
    postDetailStore.content,
    postDetailStore.isAuthor,
    false,
  );
  return cloneVotes(voteStore);
};

export const castVote = async ({
  voteId,
  optionIds,
}: {
  voteId: string;
  optionIds: string[];
}): Promise<VoteListResponse> => {
  await delay();
  voteStore = voteStore.map((vote) => {
    if (vote.id !== voteId) return vote;
    const updatedOptions = vote.options.map((option) => {
      const isSelected = optionIds.includes(option.id);
      const voters = new Set(option.voters);
      if (isSelected) {
        voters.add(CURRENT_USER);
      } else {
        voters.delete(CURRENT_USER);
      }
      return new VoteOptionResponse(option.id, option.value, isSelected, Array.from(voters));
    });
    const updatedVote = new VoteItemResponse(
      vote.id,
      vote.title,
      vote.isClosed,
      vote.deadline,
      vote.allowDuplicate,
      vote.type,
      resolveWinner({ ...vote, options: updatedOptions } as VoteItemResponse),
      "after",
      updatedOptions,
    );
    return updatedVote;
  });
  return cloneVotes(voteStore);
};

export const closeVote = async (voteId: string): Promise<VoteListResponse> => {
  await delay();
  voteStore = voteStore.map((vote) => {
    if (vote.id !== voteId) return vote;
    const winner = resolveWinner(vote);
    return new VoteItemResponse(
      vote.id,
      vote.title,
      true,
      vote.deadline,
      vote.allowDuplicate,
      vote.type,
      winner,
      "complete",
      vote.options,
    );
  });

  const allClosed = voteStore.every((vote) => vote.isClosed);
  postDetailStore = new PostDetailResponse(
    postDetailStore.id,
    postDetailStore.title,
    postDetailStore.content,
    postDetailStore.isAuthor,
    allClosed,
  );

  return cloneVotes(voteStore);
};

export const closeAllVotes = async (): Promise<VoteListResponse> => {
  await delay();
  voteStore = voteStore.map((vote) =>
    new VoteItemResponse(
      vote.id,
      vote.title,
      true,
      vote.deadline,
      vote.allowDuplicate,
      vote.type,
      resolveWinner(vote),
      "complete",
      vote.options,
    ),
  );
  postDetailStore = new PostDetailResponse(
    postDetailStore.id,
    postDetailStore.title,
    postDetailStore.content,
    postDetailStore.isAuthor,
    true,
  );
  return cloneVotes(voteStore);
};

export const reopenVote = async (voteId: string): Promise<VoteListResponse> => {
  await delay();
  voteStore = voteStore.map((vote) => {
    if (vote.id !== voteId) return vote;
    return new VoteItemResponse(
      vote.id,
      vote.title,
      false,
      vote.deadline,
      vote.allowDuplicate,
      vote.type,
      vote.result,
      "before",
      vote.options.map((option) => new VoteOptionResponse(option.id, option.value, option.isVoted, [...option.voters])),
    );
  });
  postDetailStore = new PostDetailResponse(
    postDetailStore.id,
    postDetailStore.title,
    postDetailStore.content,
    postDetailStore.isAuthor,
    false,
  );
  return cloneVotes(voteStore);
};

export const updateVote = async ({
  voteId,
  title,
  deadline,
  allowDuplicate,
  status,
}: {
  voteId: string;
  title?: string;
  deadline?: string | null;
  allowDuplicate?: boolean;
  status?: VoteStatus;
}): Promise<VoteListResponse> => {
  await delay();
  voteStore = voteStore.map((vote) => {
    if (vote.id !== voteId) return vote;
    return new VoteItemResponse(
      vote.id,
      title ?? vote.title,
      status === "complete" ? true : vote.isClosed,
      deadline ?? vote.deadline,
      allowDuplicate ?? vote.allowDuplicate,
      vote.type,
      vote.result,
      status ?? vote.status,
      vote.options,
    );
  });
  return cloneVotes(voteStore);
};

export const deleteVote = async (voteId: string): Promise<VoteListResponse> => {
  await delay();
  voteStore = voteStore.filter((vote) => vote.id !== voteId);
  const hasOpenVotes = voteStore.some((vote) => !vote.isClosed);
  postDetailStore = new PostDetailResponse(
    postDetailStore.id,
    postDetailStore.title,
    postDetailStore.content,
    postDetailStore.isAuthor,
    !hasOpenVotes,
  );
  return cloneVotes(voteStore);
};
