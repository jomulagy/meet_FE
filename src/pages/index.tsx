import React, { useState, useEffect } from "react";
import FooterNav from "../components/FooterNav";
import { fetchDefectionStatus, type DefectionMember } from "../api/home";

type Tab = "rules" | "status";

export const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("rules");
  const [members, setMembers] = useState<DefectionMember[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (activeTab !== "status") return;
    fetchDefectionStatus().then((res) => {
      setMembers(res.members);
      setTotalCount(res.totalCount);
    });
  }, [activeTab]);

  const rules = [
    {
      title: "연회비 납부",
      description:
        "모임 회비는 1년 단위로 납부하며, 금액은 20만원입니다. 모든 회원은 매년 정해진 기간 내에 회비를 납부해야 합니다.",
    },
    {
      title: "연속 불참 패널티",
      description:
        "모임에 연속으로 3회 불참할 경우 패널티가 적용됩니다. 부득이한 사정이 있는 경우에도 연속 3회 불참은 예외 없이 패널티 대상입니다.",
    },
    {
      title: "벌금 부과",
      description:
        "패널티가 적용되면 벌금 3만원이 부과됩니다. 벌금은 모임 운영비로 사용됩니다.",
    },
    {
      title: "벌금 입금 기한",
      description:
        "부과된 벌금은 해당 모임 날짜를 기준으로 7일 이내에 입금해야 합니다. 기한을 넘기지 않도록 주의해 주세요.",
    },
    {
      title: "미입금 시 제재",
      description:
        "벌금을 기한 내에 입금하지 않을 경우 모임 관련 권한이 차단됩니다. 권한 복구는 벌금 납부 완료 후 가능합니다.",
    },
  ];

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ backgroundColor: "#F2F2F7", paddingBottom: "80px" }}
    >
      <main className="flex-1 px-6 pt-8 pb-8">
        <section className="mb-6 flex flex-col gap-1 text-[#1C1C1E]">
          <h1 className="text-[20px] font-bold">변색모</h1>
          <p className="text-[12px] text-[#8E8E93]">
            모임 규칙을 확인하고 준수해 주세요.
          </p>
        </section>

        <div className="mb-5 flex gap-2">
          {([
            { key: "rules" as Tab, label: "규칙" },
            { key: "status" as Tab, label: "변절 현황" },
          ]).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ${
                  isActive
                    ? "border-[#5856D6] bg-[#5856D6] text-white"
                    : "border-[#E5E5EA] bg-white text-[#8E8E93] hover:border-[#C7C7CC] hover:text-[#1C1C1E]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "rules" && (
          <section>
            <div className="flex flex-col gap-4">
              {rules.map((rule, idx) => (
                <article
                  key={idx}
                  className="rounded-[22px] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(26,26,26,0.08)]"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#5856D6] text-white text-[11px] font-bold">
                      {idx + 1}
                    </span>
                    <h3 className="text-[15px] font-semibold text-[#1C1C1E]">
                      {rule.title}
                    </h3>
                  </div>
                  <p className="text-[13px] text-[#636366] leading-relaxed text-center">
                    {rule.description}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === "status" && (
          <section>
            <div className="mb-4 flex items-center justify-between text-[#8E8E93]">
              <span className="text-[12px] font-medium">총 {totalCount}명</span>
            </div>
            <div className="flex flex-col gap-3">
              {members.map((member) => (
                  <div
                    key={member.memberId}
                    className={`flex items-center justify-between rounded-[22px] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(26,26,26,0.08)] ${
                      member.isPenalty ? "border border-[#FF3B30]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E5E5EA] text-[12px] font-bold text-[#1C1C1E]">
                        {member.name.charAt(0)}
                      </span>
                      <span className="text-[14px] font-semibold text-[#1C1C1E]">
                        {member.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                          member.isPenalty
                            ? "bg-[#FF3B30]/10 text-[#FF3B30]"
                            : "bg-[#FF9500]/10 text-[#FF9500]"
                        }`}
                      >
                        연속 {member.consecutiveAbsences}회 불참
                      </span>
                      {member.isPenalty && (
                        <span className="rounded-full bg-[#FF3B30] px-2 py-1 text-[10px] font-bold text-white">
                          패널티
                        </span>
                      )}
                    </div>
                  </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <FooterNav />
    </div>
  );
};

export default Home;

export { default as Admin } from "./admin/Index";
export { Login as Login, KakaoCode as KakaoCode } from "./login";
export { Dashboard } from "./dashboard";
export { NotFound } from "./Exceptions/notFound";
export { Unauthorized } from "./Exceptions/Unauthorized";
export { default as PostList } from "./PostList";
export { default as PostDetail } from "./PostDetail";
export { default as MeetEdit } from "./MeetEdit";
export { default as VotePage } from "./VotePage";
export { default as JoinVotePage } from "./JoinVotePage";
export { default as MeetCreate } from "./MeetCreate";
export { default as TravelVote } from "./admin/TravelVote";
export { default as AdminPermission } from "./admin/Permission";
export { default as MeetVote } from "./admin/MeetVote";
export { default as NotificationCreate } from "./admin/Notification";
export { default as VoteCreate } from "./admin/VoteCreate";
export { default as AttendancePage } from "./AttendancePage";
export { default as AttendanceVotePage } from "./AttendanceVotePage";
export { default as FineManagement } from "./admin/FineManagement";
