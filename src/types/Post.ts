export type Post = {
  id: number;
  title: string;
  content: string | null;
  type: string | null;
  date: Date;
  place: Place;
  isAuthor: string | null;     
  participantsNum: string | null; 
  participants: string[] | null; 
};

export type Place = {
  value: string | null;   // "강남역"
  editable: boolean | null;
};

export type Date = {
  value: string | null;   // "2025-01-25 19:00:00"
  time: string | null;   
  editable: boolean | null;
};
