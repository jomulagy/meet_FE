import { Member } from "./Member";
import { Post } from "./Post";

export type PlaceMeet = Post & {
  meetDate: string;
};

export type Place = {
  id: string;
  place: string;
  editable: string;
  isVote: string;
  memberList: Member[];
};
