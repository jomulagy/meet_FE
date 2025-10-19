import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import FooterNav from "../components/FooterNav";
import UserManage from "@/components/UserManage";
import SearchPopup from "../components/popUp/PlaceSearch";
import { server } from "@/utils/axios";

type User = {
  id: string;
  name: string;
  email: string;
  deposit: string;
  previllege: string;
  uuid: string;
  isFirst: string;
};

type AdminSection = "permissions" | "createMeet";

const Admin = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [hasPrivilege, setHasPrivilege] = useState<boolean | undefined>(undefined);
  const [activeSection, setActiveSection] = useState<AdminSection>("permissions");

  const [title, setTitle] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [place, setPlace] = useState<{ name: string; xPos: string; yPos: string }>({
    name: "",
    xPos: "",
    yPos: "",
  });
  const [content, setContent] = useState<string>("");
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

    if (activeSection === "permissions") {
      fetchUserList();
    }
  }, [hasPrivilege, activeSection]);

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
      });
  };

  const handlePermissionChange = (
    memberId: string,
    currentPrivilege: string,
    uuid: string,
    isFirst: string
  ) => {
    const newPrivilege =
      currentPrivilege === "accept" || currentPrivilege === "admin" ? "deny" : "accept";

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
              user.id === memberId ? { ...user, previllege: newPrivilege, uuid: fetchedUUID } : user
            )
          );
        })
        .catch((error) => {
          console.error("유저 권한을 업데이트하는 중 오류가 발생했습니다:", error);
        });
    };

    if (isFirst === "true") {
      fetchUUID(memberId)
        .then((fetchedUUID) => {
          if (fetchedUUID) {
            updatePrivilege(fetchedUUID);
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

  const resetMeetForm = () => {
    setTitle("");
    setDate("");
    setTime("");
    setPlace({ name: "", xPos: "", yPos: "" });
    setContent("");
  };

  const handleMeetCreate = (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      alert("제목을 입력해 주세요");
      return;
    }

    setIsSubmitting(true);

    const payload: {
      title: string;
      content?: string;
      date?: string;
      time?: string;
      place?: { name: string; xPos: string; yPos: string };
    } = {
      title,
    };

    if (content.trim()) {
      payload.content = content.trim();
    }

    if (date.trim()) {
      payload.date = date.trim();
    }

    if (time.trim()) {
      payload.time = time.trim();
    }

    if (place.name && place.xPos && place.yPos) {
      payload.place = place;
    }

    server
      .post("/meet", {
        data: payload,
      })
      .then(() => {
        alert("모임이 생성되었습니다.");
        resetMeetForm();
      })
      .catch((error) => {
        console.error("모임을 생성하는 중 오류가 발생했습니다:", error);
        alert("모임 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handlePopupSelect = (location: { x: string; y: string; address: string }) => {
    setPlace({
      name: location.address,
      xPos: location.x,
      yPos: location.y,
    });
    setIsPopupOpen(false);
  };

  const renderPermissionSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-[24px] p-5 shadow-sm sm:p-6">
        <h2 className="mb-3 text-left text-lg font-semibold sm:mb-4 sm:text-xl">멤버 권한 관리</h2>
        <p className="mb-5 text-left text-xs text-[#8E8E93] sm:mb-6 sm:text-sm">
          모임 운영진의 승인 여부를 손쉽게 관리할 수 있습니다.
        </p>
        <ul className="space-y-4">
          {users.map((user) => (
            <UserManage
              key={user.id}
              user={user}
              handlePermissionChange={handlePermissionChange}
            />
          ))}
          {users.length === 0 && (
            <li className="text-center text-[#8E8E93]">표시할 멤버가 없습니다.</li>
          )}
        </ul>
      </div>
    </div>
  );

  const renderMeetCreateSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-[24px] p-5 shadow-sm sm:p-6">
        <h2 className="mb-3 text-left text-lg font-semibold sm:mb-4 sm:text-xl">새 모임 생성</h2>
        <p className="mb-5 text-left text-xs text-[#8E8E93] sm:mb-6 sm:text-sm">
          빠르게 모임을 등록하고 구성원에게 공유할 수 있습니다.
        </p>
        <form className="space-y-6" onSubmit={handleMeetCreate}>
          <div className="space-y-2 text-left">
            <label className="text-xs text-[#8E8E93] sm:text-sm">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="모임 제목을 입력하세요"
              className="w-full rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-base font-semibold focus:border-[#FFE607] focus:outline-none sm:text-lg"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 text-left sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs text-[#8E8E93] sm:text-sm">날짜 (선택)</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-base font-semibold focus:border-[#FFE607] focus:outline-none sm:text-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-[#8E8E93] sm:text-sm">시간 (선택)</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-base font-semibold focus:border-[#FFE607] focus:outline-none sm:text-lg"
              />
            </div>
          </div>

          <div className="space-y-2 text-left">
            <label className="text-xs text-[#8E8E93] sm:text-sm">장소 (선택)</label>
            <div className="flex items-center justify-between rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3">
              <span className={`text-base font-semibold sm:text-lg ${place.name ? "text-black" : "text-[#8E8E93]"}`}>
                {place.name || "장소를 선택해 주세요"}
              </span>
              <button
                type="button"
                onClick={() => setIsPopupOpen(true)}
                className="text-xs font-semibold text-[#3A3A3C] sm:text-sm"
              >
                장소 검색
              </button>
            </div>
          </div>

          <div className="space-y-2 text-left">
            <label className="text-xs text-[#8E8E93] sm:text-sm">내용 (선택)</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="모임에 대한 설명을 입력하세요"
              rows={4}
              className="w-full resize-none rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-sm font-medium focus:border-[#FFE607] focus:outline-none sm:text-base"
            />
          </div>

          <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={resetMeetForm}
              className="rounded-[16px] border border-[#D1D1D6] px-5 py-3 text-xs font-semibold text-[#3A3A3C] hover:bg-[#F2F2F7] sm:px-6 sm:text-sm"
            >
              초기화
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-[16px] bg-[#FFE607] px-5 py-3 text-xs font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:px-6 sm:text-sm"
            >
              {isSubmitting ? "생성 중..." : "모임 생성"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const sections = [
    {
      id: "permissions" as AdminSection,
      title: "권한 설정",
      description: "모임 구성원의 권한을 손쉽게 관리하세요.",
      content: renderPermissionSection(),
    },
    {
      id: "createMeet" as AdminSection,
      title: "모임 생성",
      description: "모임 정보를 입력하고 바로 공유할 수 있습니다.",
      content: renderMeetCreateSection(),
    },
  ];

  const activeSectionData = sections.find((section) => section.id === activeSection);

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#F2F2F7" }}>
      <div className="mx-auto flex w-full max-w-screen-sm flex-col gap-6 px-4 pb-20 pt-8 sm:max-w-screen-md sm:px-6 sm:pb-24 sm:pt-10 lg:max-w-4xl">
        <header className="text-left space-y-2 sm:space-y-3">
          <h1 className="text-2xl font-bold text-[#1C1C1E] sm:text-3xl">ADMIN</h1>
          <p className="text-sm text-[#636366] sm:text-base">
            운영자 전용 기능을 한 곳에 모았습니다. 필요한 기능을 선택하고 바로 사용해 보세요.
          </p>
        </header>

        <nav className="flex flex-wrap gap-2 sm:gap-3">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={`rounded-[16px] px-4 py-2.5 text-xs font-semibold transition-colors sm:px-5 sm:py-3 sm:text-sm ${
                activeSection === section.id
                  ? "bg-[#FFE607] text-black shadow-sm"
                  : "bg-white text-[#3A3A3C] hover:bg-[#F2F2F7]"
              }`}
            >
              {section.title}
            </button>
          ))}
        </nav>

        {isLoading && (
          <div className="rounded-[24px] bg-white p-6 text-center text-[#8E8E93]">
            관리자 권한을 확인하는 중입니다...
          </div>
        )}

        {!isLoading && activeSectionData && (
          <section className="space-y-4">
            <div className="rounded-[24px] bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-left text-[#1C1C1E] sm:text-xl">
                {activeSectionData.title}
              </h2>
              <p className="mt-2 text-xs text-left text-[#636366] sm:text-sm">
                {activeSectionData.description}
              </p>
            </div>
            {activeSectionData.content}
          </section>
        )}
      </div>

      <SearchPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onSelect={handlePopupSelect}
      />

      <FooterNav />
    </div>
  );
};

export default Admin;
