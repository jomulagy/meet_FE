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

let postDetailStore = new PostDetailResponse("", "", "", false, false);
let voteStore: VoteItemResponse[] = [];

const ensurePostDetailStore = (postId: string) => {
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
  author?: boolean | string;
  voteClosed?: boolean;
};

type PostDetailApiResponse = {
  data?: RawPostDetailResponse;
};

export const fetchPostDetail = async (postId: string): Promise<PostDetailResponse> => {
  ensurePostDetailStore(postId);

  const response = await server.get<PostDetailApiResponse>(`/post/${postId}`);
  const payload = (response as PostDetailApiResponse)?.data ?? (response as RawPostDetailResponse) ?? {};

  const id = payload.id != null ? String(payload.id) : postId;
  console.log(typeof payload.author)
  const canEdit = Boolean(payload.author);
  const isVoteClosed = Boolean(payload.voteClosed ?? payload.voteClosed);

  postDetailStore = new PostDetailResponse(
    id,
    payload.title ?? postDetailStore.title,
    payload.content ?? postDetailStore.content,
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
  type VoteItemApiResponse = {
    id?: string | number;
    value?: string;
    voted?: boolean;
    voterList?: string[];
  };

  type VoteApiResponse = {
    id?: number;
    title?: string;
    endDate?: string | null;
    duplicate?: boolean;
    active?: boolean;
    voted?: boolean;
    type?: VoteType;
    result?: string | null;
    itemList?: VoteItemApiResponse[];
  };

  type VoteListApiResponse = { data?: VoteApiResponse[] } | VoteApiResponse[];

  ensurePostDetailStore(postId);

  const response = await server.get<VoteListApiResponse>("/vote/list", {
    params: { postId },
  });

  const voteData = (response as { data?: VoteApiResponse[] })?.data ?? (response as VoteApiResponse[]) ?? [];

  const votes = voteData.map((vote) => {
    const options = (vote.itemList ?? []).map((option) => {
      const id = option.id;
      const value = option.value ?? "";
      const voters = option.voterList ?? [];
      return new VoteOptionResponse(id != null ? String(id) : value, value, Boolean(option.voted ?? false), voters);
    });

    const id = vote.id;
    const type = (vote.type ?? "text") as VoteType;
    var status = "complete";

    if(vote.active) {
      status = vote.voted ? "after" : "before"
    }

    return new VoteItemResponse(
      id != null ? String(id) : "",
      vote.title ?? "",
      !Boolean(vote.active ?? false),
      vote.endDate ?? null,
      Boolean(vote.duplicate ?? false),
      type,
      vote.result ?? null,
      status as VoteStatus,
      options,
    );
  });

  voteStore = votes;

  return cloneVotes(votes);
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
  postId,
  title,
  type,
  allowDuplicate,
  deadline,
}: {
  postId: string;
  title: string;
  type: VoteType;
  allowDuplicate: boolean;
  deadline?: string;
}): Promise<VoteListResponse> => {
  if (!postId) {
    throw new Error("postId is required to create a vote");
  }

  await server.post(
    "/vote",
    {
      data: {
        postId,
        title,
        voteType: type,
        duplicateYn: allowDuplicate ? "Y" : "N",
        voteDeadline: deadline ?? null,
      },
      params: {},
    },
  );

  return fetchVoteList(postId);
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

export const deleteVote = async (voteId: string, postId?: string): Promise<VoteListResponse> => {
  if (!voteId) {
    throw new Error("voteId is required to delete a vote");
  }

  await server.delete("/vote/item", { params: { voteId } });

  const targetPostId = postId ?? postDetailStore.id;
  if (!targetPostId) {
    return cloneVotes([]);
  }

  return fetchVoteList(targetPostId);
};
