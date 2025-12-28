import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { server } from "@/utils/axios";
import FooterNav from "../../components/FooterNav";

type AdminTree = {
  id: string;
  label: string;
  items: {
    id: string;
    label: string;
    action: () => void;
  }[];
};

const Admin = () => {
  const navigate = useNavigate();
  const [hasPrivilege, setHasPrivilege] = useState<boolean | undefined>(undefined);

  const isLoading = useMemo(() => hasPrivilege === undefined, [hasPrivilege]);

  useEffect(() => {
    fetchPrevilege();
  }, []);

  useEffect(() => {
    if (hasPrivilege === undefined) {
      return;
    }

    if (!hasPrivilege) {
      window.location.href = "/Unauthorized";
      return;
    }
  }, [hasPrivilege]);

  const fetchPrevilege = async () => {
    await server
      .get("/member/previllege")
      .then((response) => {
        setHasPrivilege(response.data.previllege === "admin");
      })
      .catch(() => {
        setHasPrivilege(false);
      });
  };

  const adminTree: AdminTree[] = [
    {
      id: "member",
      label: "멤버 관리",
      items: [
        {
          id: "permission",
          label: "권한 관리",
          action: () => navigate("/admin/permission"),
        },
      ],
    },
    {
      id: "vote",
      label: "투표 생성",
      items: [
        {
          id: "party",
          label: "회식 투표 생성",
          action: () => navigate("/admin/meet"),
        },
        {
          id: "travel",
          label: "여행 투표 생성",
          action: () => navigate("/admin/vote"),
        },
        {
          id: "notification",
          label: "공지사항 생성",
          action: () => navigate("/admin/notification"),
        },
        {
          id: "vote-create",
          label: "투표 생성",
          action: () => navigate("/admin/vote/create"),
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#F2F2F7" }}>
      <div className="mx-auto flex w-full max-w-screen-sm flex-col gap-5 px-4 pb-20 pt-8 sm:max-w-screen-md sm:px-6 sm:pb-24 sm:pt-10 lg:max-w-4xl">
        <h1 className="text-left text-2xl font-bold text-[#1C1C1E] sm:text-3xl">ADMIN</h1>

        {isLoading && (
          <div className="rounded-[24px] bg-white p-6 text-center text-[#8E8E93]">
            관리자 권한을 확인하는 중입니다...
          </div>
        )}

        {!isLoading && hasPrivilege && (
          <section className="space-y-3">
            <div className="rounded-[18px] bg-white p-3 shadow-sm sm:p-4">
              <ul className="space-y-1">
                {adminTree.map((group) => (
                  <li key={group.id} className="space-y-1">
                    <div className="text-sm font-semibold text-[#1C1C1E] sm:text-base">{group.label}</div>
                    <div className="space-y-1 border-l-2 border-[#E5E5EA] pl-3 sm:pl-4">
                      {group.items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={item.action}
                          className="flex w-full items-center justify-between rounded-xl bg-white px-3 py-3 text-left text-[#1C1C1E] shadow-[0_1px_6px_rgba(0,0,0,0.04)] transition hover:-translate-y-[1px] hover:shadow-[0_6px_14px_rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-[#5856D6]"
                        >
                          <span className="text-[14px] font-semibold sm:text-[15px]">{item.label}</span>
                          <span className="text-base text-[#8E8E93]">›</span>
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </div>

      <FooterNav />
    </div>
  );
};

export default Admin;
