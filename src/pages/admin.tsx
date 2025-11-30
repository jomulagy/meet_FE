import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { server } from "@/utils/axios";
import FooterNav from "../components/FooterNav";

type AdminTree = {
  id: string;
  label: string;
  items: {
    id: string;
    label: string;
    description: string;
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
          label: "권한관리",
          description: "멤버 권한 승인·취소",
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
          label: "회식",
          description: "모임 투표 생성",
          action: () => navigate("/meet/create"),
        },
        {
          id: "travel",
          label: "여행",
          description: "여행 투표 설정",
          action: () => navigate("/admin/vote"),
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#F2F2F7" }}>
      <div className="mx-auto flex w-full max-w-screen-sm flex-col gap-6 px-4 pb-20 pt-8 sm:max-w-screen-md sm:px-6 sm:pb-24 sm:pt-10 lg:max-w-4xl">
        <header className="space-y-2 text-left sm:space-y-3">
          <h1 className="text-2xl font-bold text-[#1C1C1E] sm:text-3xl">ADMIN</h1>
          <p className="text-sm text-[#636366] sm:text-base">
            운영자 전용 기능을 간단한 트리 메뉴로 구성했습니다. 필요한 페이지로 바로 이동하세요.
          </p>
        </header>

        {isLoading && (
          <div className="rounded-[24px] bg-white p-6 text-center text-[#8E8E93]">
            관리자 권한을 확인하는 중입니다...
          </div>
        )}

        {!isLoading && hasPrivilege && (
          <section className="space-y-3">
            <div className="rounded-[18px] bg-white p-4 shadow-sm sm:p-5">
              <h2 className="text-left text-lg font-semibold text-[#1C1C1E] sm:text-xl">관리 메뉴</h2>
              <p className="mt-2 text-left text-xs text-[#636366] sm:text-sm">
                기능이 늘어나도 한눈에 확인할 수 있도록 트리 형태의 얕은 메뉴로 구성했습니다.
              </p>
            </div>

            <div className="rounded-[18px] bg-white p-3 shadow-sm sm:p-4">
              <ul className="space-y-3">
                {adminTree.map((group) => (
                  <li key={group.id} className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#1C1C1E] sm:text-base">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#F2F2F7] text-[#8E8E93]">•</span>
                      <span>{group.label}</span>
                    </div>

                    <div className="space-y-2 border-l border-[#E5E5EA] pl-4 sm:pl-5">
                      {group.items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={item.action}
                          className="flex w-full items-center justify-between rounded-[14px] px-3 py-3 text-left transition-colors hover:bg-[#F9F9FB]"
                        >
                          <div className="flex flex-col text-left">
                            <span className="text-sm font-semibold text-[#1C1C1E] sm:text-base">{item.label}</span>
                            <span className="text-[12px] text-[#8E8E93] sm:text-[13px]">{item.description}</span>
                          </div>
                          <span className="text-base text-[#AEAEB2]">›</span>
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
