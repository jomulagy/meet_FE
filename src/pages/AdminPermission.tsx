import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import UserManage from "@/components/UserManage";
import { server } from "@/utils/axios";
import FooterNav from "../components/FooterNav";

type User = {
  id: string;
  name: string;
  email: string;
  deposit: string;
  previllege: string;
  uuid: string;
  isFirst: string;
};

const AdminPermission = () => {
  const navigate = useNavigate();
  const [hasPrivilege, setHasPrivilege] = useState<boolean | undefined>(undefined);
  const [users, setUsers] = useState<User[]>([]);
  const [isFetchingUsers, setIsFetchingUsers] = useState<boolean>(false);

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

    fetchUserList();
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

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#F2F2F7" }}>
      <div className="mx-auto flex w-full max-w-screen-sm flex-col gap-6 px-4 pb-20 pt-8 sm:max-w-screen-md sm:px-6 sm:pb-24 sm:pt-10 lg:max-w-4xl">
        <header className="space-y-2 text-left sm:space-y-3">
          <h1 className="text-2xl font-bold text-[#1C1C1E] sm:text-3xl">권한 관리</h1>
          <p className="text-sm text-[#636366] sm:text-base">멤버 권한을 승인하거나 취소하여 운영 권한을 제어하세요.</p>
        </header>

        <button
          type="button"
          onClick={() => navigate("/admin")}
          className="w-full rounded-[14px] border border-[#E5E5EA] bg-white px-4 py-3 text-[14px] font-semibold text-[#1C1C1E] transition hover:border-[#C7C7CC]"
        >
          이전으로
        </button>

        {isLoading && (
          <div className="rounded-[24px] bg-white p-6 text-center text-[#8E8E93]">관리자 권한을 확인하는 중입니다...</div>
        )}

        {!isLoading && hasPrivilege && (
          <section className="space-y-4">
            <div className="rounded-[20px] bg-white p-5 shadow-sm sm:p-6">
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
          </section>
        )}
      </div>

      <FooterNav />
    </div>
  );
};

export default AdminPermission;
