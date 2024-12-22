import React, { useEffect, useState } from "react";
import UserManage from "@/components/UserManage";
import { server } from "@/utils/axios";
import axios from "axios";
import FooterNav from "../components/FooterNav";

type User = {
  id: string;
  name: string;
  email: string;
  deposit : string;
  previllege: string;
  uuid: string;
  isFirst: string;
};

const Admin = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [hasPrivilege, setHasPrivilege] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    fetchPrevilege();
  }, []);

  useEffect(() => {
    if(hasPrivilege == undefined){
      return;
    }
    if(hasPrivilege){
      fetchUserList();
    }
    else{
      window.location.href = '/Unauthorized'
    }
  }, [hasPrivilege]);

  const fetchPrevilege = async () => {
    await server.get(
      "/member/previllege",
    )
    .then((response) => {
      setHasPrivilege(response.data.previllege === "admin");
    })
    .catch(() => {
      setHasPrivilege(false);
    })

    
  };

  // UUID 가져오기
  const fetchUUID = async (memberId: string): Promise<string | null> => {
    try {
      const tokenResponse = await server.get("/auth/admin/accessToken");
      const adminAccessToken = tokenResponse.data.adminAccessToken;

      const response = await axios.get(
        "https://kapi.kakao.com/v1/api/talk/friends",
        {
          headers: {
            Authorization: `Bearer ${adminAccessToken}`,
          },
        }
      );

      console.log('Kakao API 응답:', response.data);

      const friends = response.data.elements;
      for (let i = 0; i < friends.length; i++) {
          if (friends[i].id.toString() == memberId) {
              return friends[i].uuid;
          }
      }
      // 일치하는 id가 없으면 null 반환
      return null;
    } catch (error) {
      console.error("UUID를 가져오는 중 오류가 발생했습니다:", error);
      return null;
    }
  };

  // 서버에서 유저 목록 가져오기
  const fetchUserList = async () => {
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
      .catch ((error) => {
      console.error("유저 목록을 불러오는 중 오류가 발생했습니다:", error);
    });
  };

  // 유저 권한 변경
  const handlePermissionChange = (
    memberId: string,
    currentPrivilege: string,
    uuid: string,
    isFirst: string
  ) => {
    const newPrivilege = 
      currentPrivilege === "accept" || currentPrivilege === "admin" 
        ? "deny" 
        : "accept";
    
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
            prevState.map((user) =>
              user.id === memberId ? { ...user, previllege: newPrivilege, uuid:fetchedUUID } : user
            )
          );
        })
        .catch((error) => {
          console.error("유저 권한을 업데이트하는 중 오류가 발생했습니다:", error);
        });
    };

    if (isFirst === "true") {
      fetchUUID(memberId)
        .then((uuid) => {
          if (uuid) {
            updatePrivilege(uuid);
          } else {
            console.error("UUID를 가져오지 못했습니다. 권한 변경이 실패했습니다.");
          }
        }).catch((error) => {
          console.error("UUID를 가져오는 중 오류가 발생했습니다:", error);
        });
    } else {
      updatePrivilege(uuid);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ backgroundColor: "#F2F2F7", paddingBottom: "80px" }}
    >
      {/* Main Content Area */}
      <div className="flex-grow m-8">
        <div>
          <h1 className="text-2xl font-bold mb-4 pl-4 black text-left">
            User List
          </h1>
          <ul className="max-w-full">
            {users.map((user) => (
              <UserManage
                key={user.id}
                user={user}
                handlePermissionChange={handlePermissionChange}
              />
            ))}
          </ul>
        </div>
      </div>
      {/* 하단 네비게이션 바 */}
      <FooterNav />
    </div>
  );
};

export default Admin;
