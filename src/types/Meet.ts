export type Meet = {
  meetTitle: string;
  endDate: string;
  isAuthor: string;
  place: { name: string | null} | null;  // place가 객체일 때
  date: { time: string | null, value: string | null } | null;  // date가 객체일 때
};
