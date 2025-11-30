import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import UserManage from "@/components/UserManage";
import { server } from "@/utils/axios";
import FooterNav from "../components/FooterNav";

type AdminFeature = "member" | "vote";

type User = {
  id: string;
  name: string;
  email: string;
  deposit: string;
  previllege: string;
  uuid: string;
  isFirst: string;
};

const Admin = () => {
  const navigate = useNavigate();
  const [hasPrivilege, setHasPrivilege] = useState<boolean | undefined>(undefined);
  const [activeFeature, setActiveFeature] = useState<AdminFeature>("member");
  const [users, setUsers] = useState<User[]>([]);
  const [isFetchingUsers, setIsFetchingUsers] = useState<boolean>(false);
  const [voteTitle, setVoteTitle] = useState<string>("");
  const [voteBudget, setVoteBudget] = useState<string>("");
  const [isCreatingVote, setIsCreatingVote] = useState<boolean>(false);

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

    if (activeFeature === "member") {
      fetchUserList();
    }
  }, [hasPrivilege, activeFeature]);

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

  const fetchUUID = async (memberId: string): Promise<string | null> => {
    try {
      const tokenResponse = await server.get("/auth/admin/accessToken");
      const adminAccessToken = tokenResponse.data.adminAccessToken;

      const response = await axios.get("https://kapi.kakao.com/v1/api/talk/friends", {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
        },
      });

      const friends = response.data.elements;
      for (let i = 0; i < friends.length; i++) {
        if (friends[i].id.toString() === memberId) {
          return friends[i].uuid;
        }
      }

      return null;
    } catch (error) {
      console.error("UUID를 가져오는 중 오류가 발생했습니다:", error);
      return null;
    }
  };

  const fetchUserList = async () => {
    setIsFetchingUsers(true);

    server
      .get("/member/list")
      .then((response) => {
        if (response && response.data && Array.isArray(response.data)) {
          const transformedUsers = response.data.map((user: any) => {
            if (user.previllege === "accepted") {
              user.previllege = "accept";
            } else if (user.previllege === "denied") {
              user.previllege = "deny";
            }
            return user;
          });
          setUsers(transformedUsers);
        } else {
          console.error("예상치 못한 응답 구조:", response);
        }
      })
      .catch((error) => {
        console.error("유저 목록을 불러오는 중 오류가 발생했습니다:", error);
      })
      .finally(() => {
        setIsFetchingUsers(false);
      });
  };

  const handlePermissionChange = (
    memberId: string,
    currentPrivilege: string,
    uuid: string,
    isFirst: string
  ) => {
    const newPrivilege = currentPrivilege === "accept" || currentPrivilege === "admin" ? "deny" : "accept";

    const updatePrivilege = (fetchedUUID: string) => {
      const requestData = {
        memberId,
        option: newPrivilege,
        uuid: fetchedUUID,
      };

      server
        .put("/member/previllege", { data: requestData })
        .then(() => {
          setUsers((prevState) =>
            prevState.map((user) => (user.id === memberId ? { ...user, previllege: newPrivilege, uuid: fetchedUUID } : user))
          );
        })
        .catch((error) => {
          console.error("유저 권한을 업데이트하는 중 오류가 발생했습니다:", error);
        });
    };

    if (isFirst === "true") {
      fetchUUID(memberId)
        .then((uuidValue) => {
          if (uuidValue) {
            updatePrivilege(uuidValue);
          } else {
            console.error("UUID를 가져오지 못했습니다. 권한 변경이 실패했습니다.");
          }
        })
        .catch((error) => {
          console.error("UUID를 가져오는 중 오류가 발생했습니다:", error);
        });
    } else {
      updatePrivilege(uuid);
    }
  };

  const handleVoteCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!voteTitle.trim()) {
      alert("투표 제목을 입력해 주세요");
      return;
    }

    if (!voteBudget.trim()) {
      alert("사용 예산을 입력해 주세요");
      return;
    }

    setIsCreatingVote(true);

    navigate("/admin/vote", { state: { title: voteTitle.trim(), budget: voteBudget.trim() } });
    setIsCreatingVote(false);
  };

  const adminFeatures: { id: AdminFeature; title: string; description: string; badge: string }[] = [
    {
      id: "member",
      title: "멤버 관리",
      description: "운영 권한을 승인·취소하여 커뮤니티를 관리합니다.",
      badge: "권한",
    },
    {
      id: "vote",
      title: "투표 생성",
      description: "제목과 사용 예산을 정하고 투표 페이지로 이동합니다.",
      badge: "신규",
    },
  ];

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#F2F2F7" }}>
      <div className="mx-auto flex w-full max-w-screen-sm flex-col gap-6 px-4 pb-20 pt-8 sm:max-w-screen-md sm:px-6 sm:pb-24 sm:pt-10 lg:max-w-4xl">
        <header className="space-y-2 text-left sm:space-y-3">
          <h1 className="text-2xl font-bold text-[#1C1C1E] sm:text-3xl">ADMIN</h1>
          <p className="text-sm text-[#636366] sm:text-base">
            운영자 전용 기능을 한 곳에 모았습니다. 필요한 정보를 입력하고 투표를 생성하거나 멤버 권한을 관리하세요.
          </p>
        </header>

        {isLoading && (
          <div className="rounded-[24px] bg-white p-6 text-center text-[#8E8E93]">
            관리자 권한을 확인하는 중입니다...
          </div>
        )}

        {!isLoading && hasPrivilege && (
          <section className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(260px,320px),1fr]">
              <aside className="space-y-4">
                <div className="rounded-[24px] bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="text-left text-lg font-semibold text-[#1C1C1E] sm:text-xl">관리 기능</h2>
                  <p className="mt-2 text-left text-xs text-[#636366] sm:text-sm">
                    탭 대신 카드 목록으로 기능을 선택해 향후 기능 추가에도 깔끔하게 확장할 수 있습니다.
                  </p>
                </div>

                <div className="rounded-[24px] bg-white p-3 shadow-sm sm:p-4">
                  <ul className="space-y-3">
                    {adminFeatures.map((feature) => (
                      <li key={feature.id}>
                        <button
                          type="button"
                          onClick={() => setActiveFeature(feature.id)}
                          className={`group flex w-full items-center gap-4 rounded-[18px] border px-4 py-4 text-left transition-colors sm:px-5 sm:py-5 ${
                            activeFeature === feature.id ? "border-[#FFE607] bg-[#FFFCEB]" : "border-[#E5E5EA] bg-white"
                          }`}
                        >
                          <div className="flex flex-1 flex-col text-left">
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-[#F2F2F7] px-2 py-[6px] text-[11px] font-semibold text-[#3A3A3C]">{feature.badge}</span>
                              {activeFeature === feature.id && (
                                <span className="text-[11px] font-semibold text-[#111827]">선택됨</span>
                              )}
                            </div>
                            <p className="mt-2 text-base font-semibold text-[#1C1C1E] sm:text-lg">{feature.title}</p>
                            <p className="mt-1 text-xs text-[#636366] sm:text-sm">{feature.description}</p>
                          </div>
                          <span className="text-lg text-[#8E8E93] transition-colors group-hover:text-[#1C1C1E]">›</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>

              <div className="space-y-4">
                {activeFeature === "member" && (
                  <div className="rounded-[24px] bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-4 text-left">
                      <h2 className="text-lg font-semibold text-[#1C1C1E] sm:text-xl">멤버 관리</h2>
                      <p className="mt-1 text-xs text-[#636366] sm:text-sm">멤버 권한을 승인하거나 취소하여 운영 권한을 제어하세요.</p>
                    </div>
                    {isFetchingUsers ? (
                      <div className="rounded-[16px] bg-[#F9F9FB] p-6 text-center text-sm text-[#8E8E93]">멤버 목록을 불러오는 중입니다...</div>
                    ) : (
                      <ul className="space-y-4">
                        {users.map((user) => (
                          <UserManage key={user.id} user={user} handlePermissionChange={handlePermissionChange} />
                        ))}
                        {users.length === 0 && (
                          <li className="rounded-[16px] bg-[#F9F9FB] p-6 text-center text-sm text-[#8E8E93]">표시할 멤버가 없습니다.</li>
                        )}
                      </ul>
                    )}
                  </div>
                )}

                {activeFeature === "vote" && (
                  <div className="rounded-[24px] bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-4 flex items-center justify-between text-xs text-[#8E8E93] sm:text-sm">
                      <span>STEP 1 / 1</span>
                      <span>투표 기본 정보</span>
                    </div>
                    <h2 className="text-left text-lg font-semibold text-[#1C1C1E] sm:text-xl">새 투표 만들기</h2>
                    <p className="mt-2 text-left text-xs text-[#636366] sm:text-sm">
                      제목과 사용 예산만 간단히 입력하면 투표 페이지에서 항목을 세부 설정할 수 있습니다.
                    </p>

                    <form className="mt-6 space-y-5" onSubmit={handleVoteCreate}>
                      <div className="space-y-2 text-left">
                        <label className="text-xs text-[#8E8E93] sm:text-sm">투표 제목<span className="ml-1 text-[#FF3B30]">*</span></label>
                        <input
                          type="text"
                          value={voteTitle}
                          onChange={(e) => setVoteTitle(e.target.value)}
                          placeholder="예: 7월 정기 모임 투표"
                          className="w-full rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-base font-semibold focus:border-[#FFE607] focus:outline-none sm:text-lg"
                        />
                      </div>

                      <div className="space-y-2 text-left">
                        <label className="text-xs text-[#8E8E93] sm:text-sm">사용 예산<span className="ml-1 text-[#FF3B30]">*</span></label>
                        <input
                          type="number"
                          min="0"
                          value={voteBudget}
                          onChange={(e) => setVoteBudget(e.target.value)}
                          placeholder="예: 500000"
                          className="w-full rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-base font-semibold focus:border-[#FFE607] focus:outline-none sm:text-lg"
                        />
                        <p className="text-left text-[11px] text-[#8E8E93] sm:text-xs">단위는 원입니다. 상세 항목은 투표 페이지에서 조정하세요.</p>
                      </div>

                      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                        <button
                          type="submit"
                          disabled={isCreatingVote}
                          className="rounded-[16px] bg-[#FFE607] px-5 py-3 text-xs font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:px-6 sm:text-sm"
                        >
                          {isCreatingVote ? "이동 중..." : "투표 생성"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      <FooterNav />
    </div>
  );
};

export default Admin;
