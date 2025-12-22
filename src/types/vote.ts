export type VoteOption = {
  id: string;
  label: string;
  count: number;
  voted: boolean;
};

export type VoteType = "date" | "place" | "text";

export type VoteStatus = "before" | "after" | "complete";

export type Vote = {
  id: string;
  title: string;
  type: VoteType;
  activeYn: "Y" | "N";
  status: VoteStatus;
  options: VoteOption[];
};
