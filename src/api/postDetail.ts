import type { VoteStatus, VoteType } from "../types/vote";
import {
  ParticipationVoteResult,
  PostDetailResponse,
  VoteItemResponse,
  VoteListResponse,
  VoteOptionResponse,
} from "../types/postDetailResponse";
import { server } from "@/utils/axios";

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
    vote.options.map(
      (option) => new VoteOptionResponse(option.id, option.value, option.isVoted, [...option.voters], option.editable),
    ),
  );

const cloneVotes = (votes: VoteItemResponse[]) => new VoteListResponse(votes.map(cloneVote));

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

type VoteItemApiResponse = {
  id?: string | number;
  value?: string;
  voted?: boolean;
  voterList?: string[];
  editable?: boolean | string;
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

const mapVoteApiResponseToVoteItem = (vote: VoteApiResponse): VoteItemResponse => {
  const options = (vote.itemList ?? []).map((option) => {
    const id = option.id;
    const value = option.value ?? "";
    const voters = option.voterList ?? [];
    const editable = typeof option.editable === "string" ? option.editable === "true" : Boolean(option.editable);

    return new VoteOptionResponse(
      id != null ? String(id) : value,
      value,
      Boolean(option.voted ?? false),
      voters,
      editable,
    );
  });

  const id = vote.id;
  const type = (vote.type ?? "text") as VoteType;
  let status: VoteStatus = "complete";

  if (vote.active) {
    status = vote.voted ? "after" : "before";
  }

    return new VoteItemResponse(
      id != null ? String(id) : "",
      vote.title ?? "",
      !(vote.active ?? false),
      vote.endDate ?? null,
      Boolean(vote.duplicate ?? false),
      type,
      vote.result ?? null,
      status,
      options,
    );
  };

type ParticipationVoteApiResponse = {
  participateId?: string | number;
  id?: string | number;
  isActive?: boolean | string;
  activeYn?: "Y" | "N";
  isVote?: boolean | string;
  voted?: boolean | string;
  yesCount?: number;
  participateMemberCount?: number;
  participateYesCount?: number;
  participateNoCount?: number;
  participantCount?: number;
  participateMemberList?: string[];
  nonParticipateMemberList?: string[];
  participateYn?: "Y" | "N" | null;
  voteResult?: "Y" | "N" | null;
};

const toBoolean = (value?: boolean | string) => {
  if (value === undefined) return undefined;
  if (typeof value === "string") return value === "true" || value === "Y";
  return Boolean(value);
};

const toParticipationChoice = (value?: string | null): ParticipationVoteResult["choice"] => {
  if (value === "Y") return "yes";
  if (value === "N") return "no";
  return null;
};

const mapParticipationVoteResponse = (
  payload: ParticipationVoteApiResponse,
  fallbackPostId: string,
): ParticipationVoteResult => {
  const yesMembers = payload.participateMemberList ?? [];
  const noMembers = payload.nonParticipateMemberList ?? [];
  const yesCount = payload.participateYesCount ?? payload.yesCount ?? (Array.isArray(yesMembers) ? yesMembers.length : 0);
  const noCount = payload.participateNoCount ?? (Array.isArray(noMembers) ? noMembers.length : 0);
  const isActiveFromYn = payload.activeYn ? payload.activeYn === "Y" : undefined;
  const participantCount =
    payload.participateMemberCount ??
    payload.participantCount ??
    yesCount;
  const choice = toParticipationChoice(payload.participateYn ?? payload.voteResult);
  const hasVotedFromPayload = toBoolean(payload.isVote) ?? toBoolean(payload.voted);

  return {
    id:
      payload.participateId != null
        ? String(payload.participateId)
        : payload.id != null
          ? String(payload.id)
          : fallbackPostId,
    isActive: isActiveFromYn ?? toBoolean(payload.isActive) ?? true,
    hasVoted: hasVotedFromPayload ?? choice !== null,
    yesCount,
    noCount,
    participantCount,
    yesMembers: Array.isArray(yesMembers) ? yesMembers.map((name) => ({ name })) : [],
    noMembers: Array.isArray(noMembers) ? noMembers.map((name) => ({ name })) : [],
    choice,
  };
};

export const fetchVoteList = async (postId: string): Promise<VoteListResponse> => {
  type VoteListApiResponse = { data?: VoteApiResponse[] } | VoteApiResponse[];

  ensurePostDetailStore(postId);

  const response = await server.get<VoteListApiResponse>("/vote/list", {
    params: { postId },
  });

  const voteData = (response as { data?: VoteApiResponse[] })?.data ?? (response as VoteApiResponse[]) ?? [];

  const votes = voteData.map(mapVoteApiResponseToVoteItem);

  voteStore = votes;

  return cloneVotes(votes);
};

export const fetchParticipationVote = async (
  postId: string,
): Promise<ParticipationVoteResult> => {
  const response = await server.get<{ data?: ParticipationVoteApiResponse }>("/participate", {
    params: { postId },
  });

  const payload = (response as { data?: ParticipationVoteApiResponse })?.data ?? (response as ParticipationVoteApiResponse);

  return mapParticipationVoteResponse(payload, postId);
};

export const addVoteOption = async ({
  voteId,
  optionValue,
}: {
  voteId: string;
  optionValue: string;
}): Promise<VoteItemResponse> => {
  const response = await server.post<{ data?: VoteApiResponse }>(
    `/vote/item`,
    {
      data: {
        voteId,
        value: optionValue
      },
    },
  );

  const updatedVoteApi = (response as { data?: VoteApiResponse })?.data ?? (response as VoteApiResponse);
  const updatedVote = mapVoteApiResponseToVoteItem(updatedVoteApi);
  voteStore = voteStore.map((vote) => (vote.id === updatedVote.id ? updatedVote : vote));

  return updatedVote;
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
}): Promise<VoteItemResponse> => {
  const response = await server.post<{ data?: VoteApiResponse }>("/vote/confirm", {
    data: {
      voteId,
      voteItemIdList: optionIds,
    },
  });

  const updatedVoteApi = (response as { data?: VoteApiResponse })?.data ?? (response as VoteApiResponse);
  const updatedVote = mapVoteApiResponseToVoteItem(updatedVoteApi);

  voteStore = voteStore.map((vote) => (vote.id === updatedVote.id ? updatedVote : vote));

  return updatedVote;
};

export const voteParticipation = async ({
  postId,
  participateYn,
}: {
  postId: string;
  participateYn: "Y" | "N";
}): Promise<ParticipationVoteResult> => {
  const response = await server.post<{ data?: ParticipationVoteApiResponse }>("/participate/vote", {
    data: { postId, participateYn },
  });

  const payload = (response as { data?: ParticipationVoteApiResponse })?.data ?? (response as ParticipationVoteApiResponse);

  return mapParticipationVoteResponse(payload, postId);
};

export const closeVote = async (voteId: string): Promise<VoteListResponse> => {
  if (!voteId) {
    throw new Error("voteId is required to close a vote");
  }

  await server.post("/vote/terminate", { data: { voteId } });

  const targetPostId = postDetailStore.id;
  if (!targetPostId) {
    return cloneVotes([]);
  }

  return fetchVoteList(targetPostId);
};

export const terminateParticipationVote = async ({ postId }: { postId: string }): Promise<ParticipationVoteResult> => {
  const response = await server.post<{ data?: ParticipationVoteApiResponse }>("/participate/terminate", {
    data: { postId },
  });

  const payload = (response as { data?: ParticipationVoteApiResponse })?.data ?? (response as ParticipationVoteApiResponse);

  return mapParticipationVoteResponse(payload, postId);
};

export const closeAllVotes = async ({ postId }: { postId: string }): Promise<VoteListResponse> => {
  if (!postId) {
    throw new Error("postId is required to close all votes");
  }

  await server.post("/vote/terminate/all", { data: { postId } });

  return fetchVoteList(postId);
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
      vote.options.map(
        (option) => new VoteOptionResponse(option.id, option.value, option.isVoted, [...option.voters], option.editable),
      ),
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

  await server.delete("/vote", { params: { voteId } });

  const targetPostId = postId ?? postDetailStore.id;
  if (!targetPostId) {
    return cloneVotes([]);
  }

  return fetchVoteList(targetPostId);
};

export const deleteParticipationVote = async ({ postId }: { postId: string }) => {
  await server.delete("/participate", { params: { postId } });
};

type VoteItemDeleteResponse = { deletedId?: string | number };

export const deleteVoteItem = async ({
  voteItemId,
}: {
  voteItemId: string;
}): Promise<string> => {
  const response = await server.delete<{ data?: VoteApiResponse }>("/vote/item", {
    params: { voteItemId },
  });

  const payload =
    (response as { data?: VoteItemDeleteResponse })?.data ??
    (response as VoteItemDeleteResponse);

  const deletedId = payload && "deletedId" in payload ? payload.deletedId : undefined;
  const targetId = deletedId != null ? String(deletedId) : String(voteItemId);

  return targetId;
};
