import type { VoteStatus, VoteType } from "./vote";

export class PostDetailResponse {
  constructor(
    public id: string,
    public title: string,
    public content: string,
    public isAuthor: boolean,
    public isVoteClosed: boolean,
  ) {}
}

export class VoteOptionResponse {
  constructor(
    public id: string,
    public value: string,
    public isVoted: boolean,
    public voters: string[],
    public editable = false,
  ) {}
}

export class VoteItemResponse {
  constructor(
    public id: string,
    public title: string,
    public isClosed: boolean,
    public deadline: string | null,
    public allowDuplicate: boolean,
    public type: VoteType,
    public result: string | null,
    public status: VoteStatus,
    public options: VoteOptionResponse[],
  ) {}
}

export class VoteListResponse {
  constructor(public votes: VoteItemResponse[]) {}
}

export type ParticipationVoteResult = {
  id: string;
  isActive: boolean;
  hasVoted: boolean;
  yesCount: number;
  noCount: number;
  participantCount: number;
  yesMembers: { name: string }[];
  noMembers: { name: string }[];
  choice: "yes" | "no" | null;
};
