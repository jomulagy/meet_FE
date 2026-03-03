import { server } from "@/utils/axios";

// ============== 변절현황 API ==============

export type DefectionMember = {
  memberId: string;
  name: string;
  consecutiveAbsences: number;
  isPenalty: boolean;
};

export type DefectionStatusResponse = {
  totalCount: number;
  members: DefectionMember[];
};

type DefectionMemberApiResponse = {
  memberId: string | number;
  name: string;
  consecutiveAbsences: number;
  isPenalty?: boolean;
};

type DefectionStatusApiResponse = {
  totalCount?: number;
  memberList?: DefectionMemberApiResponse[];
};

export const fetchDefectionStatus = async (): Promise<DefectionStatusResponse> => {
  const response = await server.get<{ data?: DefectionStatusApiResponse }>("/attendance/absences");
  const data =
    (response as { data?: DefectionStatusApiResponse })?.data ??
    (response as DefectionStatusApiResponse);

  const members = (data.memberList ?? []).map((member) => ({
    memberId: String(member.memberId),
    name: member.name,
    consecutiveAbsences: member.consecutiveAbsences,
    isPenalty: member.isPenalty ?? member.consecutiveAbsences >= 3,
  }));

  return {
    totalCount: data.totalCount ?? members.length,
    members,
  };
};

