import { server } from "@/utils/axios";

// ============== 벌금 관리 API ==============

export type FineRecord = {
  memberId: string;
  memberName: string;
  consecutiveAbsences: number;
  penaltyPaid: boolean;
  paymentDeadline: string | null; // yyyy-MM-dd, 배치 미스케줄 시 null
};

type FineRecordApiResponse = {
  memberId: number;
  memberName: string;
  consecutiveAbsences: number;
  penaltyPaid: boolean;
  paymentDeadline: string | null;
};

type FineListApiResponse = {
  members?: FineRecordApiResponse[];
};

// GET /penalty - 벌금 대상자 조회
export const fetchFineList = async (): Promise<FineRecord[]> => {
  const response = await server.get<{ data?: FineListApiResponse }>("/penalty");
  const data =
    (response as { data?: FineListApiResponse })?.data ??
    (response as FineListApiResponse);

  return (data.members ?? []).map((member) => ({
    memberId: String(member.memberId),
    memberName: member.memberName,
    consecutiveAbsences: member.consecutiveAbsences,
    penaltyPaid: member.penaltyPaid,
    paymentDeadline: member.paymentDeadline ?? null,
  }));
};

// PUT /penalty/{memberId} - 벌금 납부 여부 업데이트
export const updateFinePayment = async ({
  memberId,
  penaltyPaid,
}: {
  memberId: string;
  penaltyPaid: boolean;
}): Promise<void> => {
  await server.put(`/penalty/${memberId}`, {
    data: { penaltyPaid },
  });
};
