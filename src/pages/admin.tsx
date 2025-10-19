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

    if (!date.trim()) {
      alert("날짜를 선택해 주세요");
      return;
    }

    if (!time.trim()) {
      alert("시간을 선택해 주세요");
      return;
    }

    if (!place.name || !place.xPos || !place.yPos) {
      alert("장소 정보를 정확하게 입력해 주세요");
      return;
    }

    setIsSubmitting(true);

    server
      .post("/meet", {
        data: {
          title,
          content,
          date,
          time,
          place,
          type: "CUSTOM",
        },
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
      <div className="bg-white rounded-[24px] p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-left">멤버 권한 관리</h2>
        <p className="text-sm text-[#8E8E93] mb-6 text-left">
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
      <div className="bg-white rounded-[24px] p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-left">새 모임 생성</h2>
        <p className="text-sm text-[#8E8E93] mb-6 text-left">
          빠르게 모임을 등록하고 구성원에게 공유할 수 있습니다.
        </p>
        <form className="space-y-6" onSubmit={handleMeetCreate}>
          <div className="space-y-2 text-left">
            <label className="text-sm text-[#8E8E93]">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="모임 제목을 입력하세요"
              className="w-full rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-[18px] font-semibold focus:border-[#FFE607] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 text-left md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-[#8E8E93]">날짜</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-[18px] font-semibold focus:border-[#FFE607] focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[#8E8E93]">시간</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-[18px] font-semibold focus:border-[#FFE607] focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2 text-left">
            <label className="text-sm text-[#8E8E93]">장소</label>
            <div className="flex items-center justify-between rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3">
              <span className={`text-[18px] font-semibold ${place.name ? "text-black" : "text-[#8E8E93]"}`}>
                {place.name || "장소를 선택해 주세요"}
              </span>
              <button
                type="button"
                onClick={() => setIsPopupOpen(true)}
                className="text-sm font-semibold text-[#3A3A3C]"
              >
                장소 검색
              </button>
            </div>
          </div>

          <div className="space-y-2 text-left">
            <label className="text-sm text-[#8E8E93]">내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="모임에 대한 설명을 입력하세요"
              rows={4}
              className="w-full resize-none rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-[16px] font-medium focus:border-[#FFE607] focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-3 pt-4 md:flex-row md:justify-end">
            <button
              type="button"
              onClick={resetMeetForm}
              className="rounded-[16px] border border-[#D1D1D6] px-6 py-3 text-sm font-semibold text-[#3A3A3C] hover:bg-[#F2F2F7]"
            >
              초기화
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-[16px] bg-[#FFE607] px-6 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 pb-24 pt-10">
        <header className="text-left">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8E8E93]">
            Admin Console
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[#1C1C1E]">운영 도구 허브</h1>
          <p className="mt-3 text-base text-[#636366]">
            운영자 전용 기능을 한 곳에 모았습니다. 필요한 기능을 선택하고 바로 사용해 보세요.
          </p>
        </header>

        <nav className="flex flex-wrap gap-3">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={`rounded-[16px] px-5 py-3 text-sm font-semibold transition-colors ${
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
            <div className="rounded-[24px] bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-left text-[#1C1C1E]">
                {activeSectionData.title}
              </h2>
              <p className="mt-2 text-sm text-left text-[#636366]">
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
