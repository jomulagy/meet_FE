import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FooterNav from "../../components/FooterNav";
import { fetchFineList, updateFinePayment, type FineRecord } from "../../api/attendance";
import { useErrorPopup } from "@/context/ErrorPopupContext";

const FINE_AMOUNT = 30000;

const FineManagement: React.FC = () => {
  const navigate = useNavigate();
  const { showError } = useErrorPopup();
  const [fines, setFines] = useState<FineRecord[]>([]);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchFineList()
      .then(setFines)
      .catch((error: any) => {
        const onClose = error?.code === "403"
          ? () => navigate("/auth/login")
          : () => navigate("/post/list");
        showError(error?.message || "데이터를 불러오는 중 오류가 발생했습니다.", onClose);
      });
  }, [navigate]);

  const handleToggle = async (fine: FineRecord) => {
    const nextPaid = !fine.penaltyPaid;
    setLoadingIds((prev) => new Set(prev).add(fine.memberId));
    try {
      await updateFinePayment({ memberId: fine.memberId, penaltyPaid: nextPaid });
      setFines((prev) =>
        prev.map((f) => (f.memberId === fine.memberId ? { ...f, penaltyPaid: nextPaid } : f))
      );
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(fine.memberId);
        return next;
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-");
    return `${year}.${month}.${day}`;
  };

  const isOverdue = (paymentDeadline: string) =>
    new Date(paymentDeadline) < new Date();

  const unpaidCount = fines.filter((f) => !f.penaltyPaid).length;
  const paidCount = fines.filter((f) => f.penaltyPaid).length;

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ backgroundColor: "#F2F2F7", paddingBottom: "80px" }}
    >
      <main className="flex-1 px-6 pt-8 pb-8">
        <section className="mb-6 flex flex-col gap-1 text-[#1C1C1E]">
          <h1 className="text-[20px] font-bold">벌금 관리</h1>
          <p className="text-[12px] text-[#8E8E93]">
            벌금 대상자의 입금 여부를 관리하세요.
          </p>
        </section>

        {/* 요약 */}
        <div className="mb-5 grid grid-cols-3 gap-3">
          {[
            { label: "전체", value: fines.length, color: "#5856D6" },
            { label: "미납", value: unpaidCount, color: "#FF3B30" },
            { label: "납부완료", value: paidCount, color: "#34C759" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-[18px] bg-white px-4 py-3 text-center shadow-[0_4px_12px_rgba(26,26,26,0.06)]"
            >
              <p className="text-[11px] font-medium text-[#8E8E93]">{stat.label}</p>
              <p className="mt-1 text-[22px] font-bold" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {fines.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[22px] bg-white px-6 py-10 text-center text-[#8E8E93] shadow-inner">
            <p className="text-[14px] font-medium">벌금 대상자가 없습니다.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {fines.map((fine) => {
              const overdue =
                !fine.penaltyPaid &&
                fine.paymentDeadline !== null &&
                isOverdue(fine.paymentDeadline);
              const isLoading = loadingIds.has(fine.memberId);

              return (
                <div
                  key={fine.memberId}
                  className={`rounded-[22px] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(26,26,26,0.08)] ${
                    overdue ? "border border-[#FF3B30]" : ""
                  }`}
                >
                  {/* 상단: 이름 + 납부 버튼 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E5E5EA] text-[13px] font-bold text-[#1C1C1E]">
                        {fine.memberName.charAt(0)}
                      </span>
                      <div>
                        <span className="text-[15px] font-semibold text-[#1C1C1E]">
                          {fine.memberName}
                        </span>
                        <p className="text-[11px] text-[#8E8E93]">
                          연속 {fine.consecutiveAbsences}회 불참
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleToggle(fine)}
                      className={`min-w-[72px] rounded-full px-4 py-2 text-[12px] font-bold transition-colors disabled:opacity-50 ${
                        fine.penaltyPaid
                          ? "bg-[#34C759]/10 text-[#34C759]"
                          : "bg-[#FF3B30] text-white"
                      }`}
                    >
                      {isLoading ? "..." : fine.penaltyPaid ? "납부완료" : "미납"}
                    </button>
                  </div>

                  {/* 하단: 벌금액 + 납부기한 */}
                  <div className="mt-3 flex items-center justify-between rounded-[12px] bg-[#F2F2F7] px-4 py-2">
                    <span className="text-[12px] font-semibold text-[#1C1C1E]">
                      {FINE_AMOUNT.toLocaleString()}원
                    </span>
                    <span
                      className={`text-[12px] font-medium ${
                        overdue ? "text-[#FF3B30]" : "text-[#8E8E93]"
                      }`}
                    >
                      {fine.paymentDeadline
                        ? `납부기한 ${formatDate(fine.paymentDeadline)}${overdue ? " (기한초과)" : ""}`
                        : "납부기한 미정"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <FooterNav />
    </div>
  );
};

export default FineManagement;
