import type { VoteStatus, VoteType } from "../types/vote";
import {
  PostDetailResponse,
  VoteItemResponse,
  VoteListResponse,
  VoteOptionResponse,
} from "../types/postDetailResponse";
import { server } from "@/utils/axios";
type ParticipationChoice = "yes" | "no" | null;

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

type ParticipationVoteItemPayload = {
  id?: string | number;
  name?: string;
  memberList?: unknown[];
  vote?: boolean;
};

type ParticipationVotePayload = {
  id?: string | number;
  endDate?: string;
  itemList?: ParticipationVoteItemPayload[];
  participants?: (string | number)[];
  active?: boolean;
  voted?: boolean;
};

type ParticipationVoteApiResponse = { data?: ParticipationVotePayload } | ParticipationVotePayload;

export type ParticipationVoteResponse = {
  vote: {
    id: string;
    activeYn: "Y" | "N";
    hasVoted: boolean;
    yesCount: number;
    noCount: number;
    participantCount: number;
    yesMembers: { name: string }[];
    noMembers: { name: string }[];
    yesOptionId?: string;
    noOptionId?: string;
  };
  votedChoice: ParticipationChoice;
};

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

export const fetchParticipationVote = async (postId: string): Promise<ParticipationVoteResponse | null> => {
  if (!postId) {
    return null;
  }

  const response = await server.get<ParticipationVoteApiResponse>("/participate", { params: { postId } });
  const payloadCandidate = response as ParticipationVoteApiResponse;
  const payload = ("data" in payloadCandidate ? payloadCandidate.data : payloadCandidate) as ParticipationVotePayload;

  if (!payload) {
    return null;
  }

  const options = Array.isArray(payload.itemList) ? payload.itemList : [];

  const yesItem = options.find((item) => item.name === "참여");
  const noItem = options.find((item) => item.name === "불참");

  const participants = Array.isArray(payload.participants)
    ? payload.participants.map((member) => ({ name: String(member) }))
    : [];

  const yesMembers = Array.isArray(yesItem?.memberList)
    ? yesItem?.memberList.map((member) => ({ name: String(member) }))
    : participants;
  const noMembers = Array.isArray(noItem?.memberList)
    ? noItem?.memberList.map((member) => ({ name: String(member) }))
    : [];

  const participantCount = participants.length
    ? participants.length
    : yesMembers.length + noMembers.length;

  let votedChoice: ParticipationChoice = null;
  if (yesItem?.vote) votedChoice = "yes";
  else if (noItem?.vote) votedChoice = "no";

  return {
    vote: {
      id: payload.id != null ? String(payload.id) : postId,
      activeYn: payload.active ? "Y" : "N",
      hasVoted: Boolean(payload.voted ?? false),
      yesCount: yesMembers.length,
      noCount: noMembers.length,
      participantCount,
      yesMembers,
      noMembers,
      yesOptionId: yesItem?.id != null ? String(yesItem.id) : undefined,
      noOptionId: noItem?.id != null ? String(noItem.id) : undefined,
    },
    votedChoice,
  };
};

export const submitParticipationVote = async ({
  postId,
  participateVoteItemId,
}: {
  postId: string;
  participateVoteItemId: string;
}) =>
  server.post("/participate/vote", {
    data: {
      postId,
      participateVoteItemId,
    },
  });

export const terminateParticipationVote = async ({ postId }: { postId: string }) =>
  server.post("/participate/terminate", {
    data: { postId },
  });

export const deleteParticipationVote = async ({ postId }: { postId: string }) =>
  server.delete("/participate", {
    params: { postId },
  });

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
