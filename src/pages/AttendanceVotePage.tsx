import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import FooterNav from "../components/FooterNav";
import {
  fetchPostDetail,
  fetchAttendance,
  saveAttendance,
  fetchMemberList,
  fetchUserPrivilege,
} from "../api/postDetail";
import type { AttendanceRecord } from "../api/postDetail";
import { PostDetailResponse } from "../types/postDetailResponse";

type AttendanceChoice = boolean | null; // true: 참여, false: 불참, null: 미정

const AttendanceVotePage: React.FC = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  // 관리자 권한 확인 (화면에 표출하지 않음)
  const { data: privilegeData } = useQuery({
    queryKey: ["userPrivilege"],
    queryFn: fetchUserPrivilege,
  });

  // 회원 목록 조회
  const { data: memberList = [] } = useQuery({
    queryKey: ["memberList"],
    queryFn: fetchMemberList,
  });

  // 게시글 정보 조회
  const { data: postDetail, isPending: isPostLoading } = useQuery<PostDetailResponse>({
    queryKey: ["postDetail", postId],
    queryFn: () => fetchPostDetail(postId ?? ""),
    enabled: !!postId,
  });

  // 출석 현황 조회
  const { data: attendanceData, isPending: isAttendanceLoading } = useQuery({
    queryKey: ["attendance", postId],
    queryFn: () => fetchAttendance(postId ?? ""),
    enabled: !!postId,
  });

  // 출석 현황 저장 mutation
  const saveAttendanceMutation = useMutation({
    mutationFn: () => {
      if (!postId) throw new Error("Missing postId");

      const attendedMembers = attendanceRecords
        .filter((r) => r.attended === true)
        .map((r) => r.memberId);
      const absentMembers = attendanceRecords
        .filter((r) => r.attended === false)
        .map((r) => r.memberId);

      return saveAttendance({
        postId,
        attendedMembers,
        absentMembers,
      });
    },
    onSuccess: async () => {
      setIsEditing(false);
      await queryClient.invalidateQueries({ queryKey: ["attendance", postId] });
    },
  });

  // 출석 기록 초기화
  useEffect(() => {
    if (!memberList.length) return;

    if (attendanceData && attendanceData.records.length > 0) {
      // 서버에서 받은 기록이 있는지 확인
      const hasInputData = attendanceData.records.some((r) => r.attended !== null);

      setAttendanceRecords(attendanceData.records);

      if (hasInputData) {
        // 실제로 입력된 데이터가 있으면 결과 페이지 표시
        setIsEditing(false);
      } else {
        // 기록은 있지만 입력된 데이터가 없으면 입력 폼 표시
        setIsEditing(true);
      }
    } else {
      // 기록이 없으면 회원 목록으로 초기화 (입력 폼 표시)
      const initialRecords: AttendanceRecord[] = memberList.map((member) => ({
        memberId: member.id,
        memberName: member.name,
        attended: null,
      }));
      setAttendanceRecords(initialRecords);
      setIsEditing(true);
    }
  }, [attendanceData, memberList]);

  const isLoading = isPostLoading || isAttendanceLoading;

  const handleChoiceChange = (memberId: string, attended: AttendanceChoice) => {
    setAttendanceRecords((prev) =>
      prev.map((r) => {
        if (r.memberId === memberId) {
          // 같은 버튼을 다시 누르면 취소 (null로 변경)
          if (r.attended === attended) {
            return { ...r, attended: null };
          }
          return { ...r, attended };
        }
        return r;
      })
    );
  };

  const handleSubmit = () => {
    saveAttendanceMutation.mutate();
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const attendedCount = useMemo(
    () => attendanceRecords.filter((r) => r.attended === true).length,
    [attendanceRecords]
  );

  const absentCount = useMemo(
    () => attendanceRecords.filter((r) => r.attended === false).length,
    [attendanceRecords]
  );

  const undecidedCount = useMemo(
    () => attendanceRecords.filter((r) => r.attended === null).length,
    [attendanceRecords]
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#F2F2F7]">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-[#E5E5EA] border-t-[#5856D6]" />
        <p className="mt-4 text-[13px] text-[#8E8E93]">모임 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (!postDetail) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#F2F2F7] text-center">
        <p className="text-[14px] font-medium text-[#1C1C1E]">모임 정보를 불러오지 못했습니다.</p>
        <button
          onClick={() => navigate("/attendance")}
          className="mt-4 rounded-[16px] bg-[#5856D6] px-4 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#4C4ACB]"
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F2F2F7]">
      <div className="mx-auto flex w-full max-w-screen-sm flex-col gap-5 px-4 pb-24 pt-6">
        <button
          onClick={() => navigate("/attendance")}
          className="flex w-fit items-center gap-2 rounded-[16px] border border-[#E5E5EA] bg-white px-4 py-2 text-xs font-semibold text-[#5856D6] shadow-sm transition hover:border-[#C7C7CC]"
        >
          <i className="fa-solid fa-chevron-left text-[11px]"></i>
          목록으로
        </button>

        <header className="rounded-[20px] bg-white p-5 shadow-sm">
          <h1 className="text-left text-xl font-bold text-[#1C1C1E]">{postDetail.title}</h1>
        </header>

        <section className="space-y-4">
          <h2 className="text-base font-semibold text-[#1C1C1E]">참여 여부 입력</h2>

          <div className="rounded-[20px] bg-white p-5 shadow-sm">
            {isEditing ? (
              <div className="space-y-4">
                <div className="rounded-[16px] border border-dashed border-[#C7C7CC] bg-[#F9F9FB] p-4">
                  {attendanceRecords.map((record) => (
                    <div
                      key={record.memberId}
                      className="mb-3 rounded-xl bg-white p-3 shadow-sm last:mb-0"
                    >
                      <div className="mb-2">
                        <span className="text-sm font-semibold text-[#1C1C1E]">
                          {record.memberName}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleChoiceChange(record.memberId, true)}
                          className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                            record.attended === true
                              ? "bg-[#5856D6] text-white"
                              : "border border-[#E5E5EA] bg-white text-[#8E8E93] hover:border-[#5856D6] hover:text-[#5856D6]"
                          }`}
                        >
                          참여
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChoiceChange(record.memberId, false)}
                          className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                            record.attended === false
                              ? "bg-[#FF3B30] text-white"
                              : "border border-[#E5E5EA] bg-white text-[#8E8E93] hover:border-[#FF3B30] hover:text-[#FF3B30]"
                          }`}
                        >
                          불참
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between rounded-xl bg-[#F9F9FB] px-4 py-2 text-xs text-[#8E8E93]">
                  <span>참여: {attendedCount}명</span>
                  <span>불참: {absentCount}명</span>
                  <span>미정: {undecidedCount}명</span>
                </div>

                <button
                  className="w-full rounded-[16px] bg-[#5856D6] px-5 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#4C4ACB] disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={handleSubmit}
                  disabled={saveAttendanceMutation.isPending}
                >
                  {saveAttendanceMutation.isPending ? "저장 중..." : "저장하기"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-around rounded-xl bg-[#F9F9FB] py-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-[#5856D6]">{attendedCount}</div>
                    <div className="mt-1 text-xs text-[#8E8E93]">참여</div>
                  </div>
                  <div className="h-8 w-px bg-[#E5E5EA]"></div>
                  <div>
                    <div className="text-2xl font-bold text-[#FF3B30]">{absentCount}</div>
                    <div className="mt-1 text-xs text-[#8E8E93]">불참</div>
                  </div>
                  <div className="h-8 w-px bg-[#E5E5EA]"></div>
                  <div>
                    <div className="text-2xl font-bold text-[#8E8E93]">{undecidedCount}</div>
                    <div className="mt-1 text-xs text-[#8E8E93]">미정</div>
                  </div>
                </div>

                <div>
                  {attendanceRecords.filter((r) => r.attended !== null).length > 0 ? (
                    <div className="space-y-2">
                      {attendanceRecords
                        .filter((r) => r.attended !== null)
                        .map((record) => (
                          <div
                            key={record.memberId}
                            className="flex items-center justify-between rounded-lg border border-[#E5E5EA] bg-white px-4 py-2"
                          >
                            <span className="text-sm font-semibold text-[#1C1C1E]">
                              {record.memberName}
                            </span>
                            <span
                              className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                                record.attended
                                  ? "bg-[#5856D6]/10 text-[#5856D6]"
                                  : "bg-[#FF3B30]/10 text-[#FF3B30]"
                              }`}
                            >
                              {record.attended ? "참여" : "불참"}
                            </span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-center text-sm text-[#8E8E93]">
                      아직 입력된 정보가 없습니다.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleEdit}
                  className="w-full rounded-[16px] border border-[#E5E5EA] bg-white px-5 py-2 text-xs font-semibold text-[#5856D6] transition hover:border-[#C7C7CC]"
                >
                  수정하기
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      <FooterNav />
    </div>
  );
};

export default AttendanceVotePage;
