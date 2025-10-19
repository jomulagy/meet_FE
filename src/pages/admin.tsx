import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import UserManage from "@/components/UserManage";
import { server } from "@/utils/axios";
import FooterNav from "../components/FooterNav";
import SearchPopup from "../components/popUp/PlaceSearch";

type VotePlace = { name: string; xPos: string; yPos: string };

type VoteStep = "vote" | "deadline";
type AdminTab = "member" | "vote";

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
  const [activeTab, setActiveTab] = useState<AdminTab>("member");
  const [users, setUsers] = useState<User[]>([]);
  const [isFetchingUsers, setIsFetchingUsers] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<VoteStep>("vote");
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [voteTitle, setVoteTitle] = useState<string>("");
  const [voteDate, setVoteDate] = useState<string>("");
  const [voteTime, setVoteTime] = useState<string>("");
  const [votePlace, setVotePlace] = useState<VotePlace>({
    name: "",
    xPos: "",
    yPos: "",
  });
  const [voteContent, setVoteContent] = useState<string>("");
  const [voteDeadline, setVoteDeadline] = useState<string>("");
  const [participationDeadline, setParticipationDeadline] = useState<string>("");

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

    if (activeTab === "member") {
      fetchUserList();
    }
  }, [hasPrivilege, activeTab]);

  useEffect(() => {
    if (activeTab !== "vote") {
      setIsPopupOpen(false);
    }
  }, [activeTab]);

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

  const isSchedulePairIncomplete = useMemo(() => {
    return (voteDate && !voteTime) || (!voteDate && voteTime);
  }, [voteDate, voteTime]);

  const resetVoteForm = () => {
    setVoteTitle("");
    setVoteDate("");
    setVoteTime("");
    setVotePlace({ name: "", xPos: "", yPos: "" });
    setVoteContent("");
  };

  const resetDeadlineForm = () => {
    setVoteDeadline("");
    setParticipationDeadline("");
  };

  const handleNextStep = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!voteTitle.trim()) {
      alert("투표 제목을 입력해 주세요");
      return;
    }

    if (isSchedulePairIncomplete) {
      alert("날짜와 시간은 함께 입력하거나 비워 주세요");
      return;
    }

    setActiveStep("deadline");
  };

  const handlePreviousStep = () => {
    setActiveStep("vote");
  };

  const handleVoteSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!voteDeadline || !participationDeadline) {
      alert("투표 마감일과 참여 여부 마감일을 모두 선택해 주세요");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      title: voteTitle.trim(),
      date: voteDate || null,
      time: voteTime || null,
      place: votePlace.name ? votePlace : null,
      content: voteContent,
      voteDeadline,
      participationDeadline,
    };

    server
      .post("/meet", {
        data: payload,
      })
      .then((response) => {
        const createdMeetId = response.data?.meetId ?? response.data?.id;

        resetVoteForm();
        resetDeadlineForm();
        setActiveStep("vote");

        if (createdMeetId) {
          navigate(`/meet/${createdMeetId}`);
          return;
        }

        alert("투표가 생성되었습니다.");
        navigate("/");
      })
      .catch((error) => {
        if (error.code === "403") {
          navigate("/Unauthorized");
        } else if (error.code === "404") {
          navigate("/not-found");
        } else {
          alert("투표 생성에 실패했습니다.");
        }
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handlePopupSelect = (location: { x: string; y: string; address: string }) => {
    setVotePlace({
      name: location.address,
      xPos: location.x,
      yPos: location.y,
    });
    setIsPopupOpen(false);
  };

  const renderVoteStep = () => (
    <form className="space-y-6" onSubmit={handleNextStep}>
      <div className="space-y-2 text-left">
        <label className="text-xs text-[#8E8E93] sm:text-sm">투표 제목<span className="ml-1 text-[#FF3B30]">*</span></label>
        <input
          type="text"
          value={voteTitle}
          onChange={(e) => setVoteTitle(e.target.value)}
          placeholder="투표 제목을 입력하세요"
          className="w-full rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-base font-semibold focus:border-[#FFE607] focus:outline-none sm:text-lg"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 text-left sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs text-[#8E8E93] sm:text-sm">날짜</label>
          <input
            type="date"
            value={voteDate}
            onChange={(e) => setVoteDate(e.target.value)}
            className="w-full rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-base font-semibold focus:border-[#FFE607] focus:outline-none sm:text-lg"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-[#8E8E93] sm:text-sm">시간</label>
          <input
            type="time"
            value={voteTime}
            onChange={(e) => setVoteTime(e.target.value)}
            className="w-full rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-base font-semibold focus:border-[#FFE607] focus:outline-none sm:text-lg"
          />
        </div>
      </div>
      {isSchedulePairIncomplete && (
        <p className="text-left text-xs text-[#FF3B30] sm:text-sm">날짜와 시간은 함께 입력해야 합니다.</p>
      )}

      <div className="space-y-2 text-left">
        <label className="text-xs text-[#8E8E93] sm:text-sm">장소</label>
        <div className="relative">
          <input
            type="text"
            readOnly
            value={votePlace.name}
            onFocus={() => setIsPopupOpen(true)}
            onClick={() => setIsPopupOpen(true)}
            placeholder="장소를 선택해 주세요"
            className="w-full cursor-pointer rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-base font-semibold text-left focus:border-[#FFE607] focus:outline-none sm:text-lg"
          />
          {votePlace.name && (
            <button
              type="button"
              onClick={() => setVotePlace({ name: "", xPos: "", yPos: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#636366] hover:text-[#1C1C1E] sm:text-sm"
            >
              초기화
            </button>
          )}
        </div>
        <p className="text-left text-[11px] text-[#8E8E93] sm:text-xs">필드를 선택하면 장소 검색 팝업이 열립니다.</p>
      </div>

      <div className="space-y-2 text-left">
        <label className="text-xs text-[#8E8E93] sm:text-sm">내용</label>
        <textarea
          value={voteContent}
          onChange={(e) => setVoteContent(e.target.value)}
          placeholder="투표 내용을 입력하세요"
          rows={4}
          className="w-full resize-none rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-sm font-medium focus:border-[#FFE607] focus:outline-none sm:text-base"
        />
      </div>

      <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={resetVoteForm}
          className="rounded-[16px] border border-[#D1D1D6] px-5 py-3 text-xs font-semibold text-[#3A3A3C] hover:bg-[#F2F2F7] sm:px-6 sm:text-sm"
        >
          초기화
        </button>
        <button
          type="submit"
          className="rounded-[16px] bg-[#FFE607] px-5 py-3 text-xs font-semibold text-black transition-opacity hover:opacity-90 sm:px-6 sm:text-sm"
        >
          다음
        </button>
      </div>
    </form>
  );

  const renderDeadlineStep = () => (
    <form className="space-y-6" onSubmit={handleVoteSubmit}>
      <div className="space-y-2 text-left">
        <label className="text-xs text-[#8E8E93] sm:text-sm">투표 마감일<span className="ml-1 text-[#FF3B30]">*</span></label>
        <input
          type="date"
          value={voteDeadline}
          onChange={(e) => setVoteDeadline(e.target.value)}
          className="w-full rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-base font-semibold focus:border-[#FFE607] focus:outline-none sm:text-lg"
        />
      </div>
      <div className="space-y-2 text-left">
        <label className="text-xs text-[#8E8E93] sm:text-sm">참여 여부 마감일<span className="ml-1 text-[#FF3B30]">*</span></label>
        <input
          type="date"
          value={participationDeadline}
          onChange={(e) => setParticipationDeadline(e.target.value)}
          className="w-full rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3 text-base font-semibold focus:border-[#FFE607] focus:outline-none sm:text-lg"
        />
      </div>

      <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={handlePreviousStep}
          className="rounded-[16px] border border-[#D1D1D6] px-5 py-3 text-xs font-semibold text-[#3A3A3C] hover:bg-[#F2F2F7] sm:px-6 sm:text-sm"
        >
          이전
        </button>
        <button
          type="button"
          onClick={resetDeadlineForm}
          className="rounded-[16px] border border-[#D1D1D6] px-5 py-3 text-xs font-semibold text-[#3A3A3C] hover:bg-[#F2F2F7] sm:px-6 sm:text-sm"
        >
          초기화
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-[16px] bg-[#FFE607] px-5 py-3 text-xs font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:px-6 sm:text-sm"
        >
          {isSubmitting ? "생성 중..." : "투표 생성"}
        </button>
      </div>
    </form>
  );

  const stepTitle = activeStep === "vote" ? "투표 생성" : "투표 마감 관리";
  const stepDescription =
    activeStep === "vote"
      ? "투표 기본 정보를 입력한 후 다음 단계로 넘어가세요."
      : "투표 종료일과 참여 여부 확인 마감일을 설정하세요. 시간은 서버에서 자동으로 처리됩니다.";

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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("member")}
                className={`flex-1 rounded-[16px] px-4 py-3 text-sm font-semibold sm:text-base ${
                  activeTab === "member"
                    ? "bg-[#FFE607] text-black"
                    : "bg-white text-[#3A3A3C] shadow-sm"
                }`}
              >
                멤버관리
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("vote")}
                className={`flex-1 rounded-[16px] px-4 py-3 text-sm font-semibold sm:text-base ${
                  activeTab === "vote"
                    ? "bg-[#FFE607] text-black"
                    : "bg-white text-[#3A3A3C] shadow-sm"
                }`}
              >
                투표관리
              </button>
            </div>

            {activeTab === "member" && (
              <div className="rounded-[24px] bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4 text-left">
                  <h2 className="text-lg font-semibold text-[#1C1C1E] sm:text-xl">멤버 관리</h2>
                  <p className="mt-1 text-xs text-[#636366] sm:text-sm">
                    멤버 권한을 승인하거나 취소하여 운영 권한을 제어하세요.
                  </p>
                </div>
                {isFetchingUsers ? (
                  <div className="rounded-[16px] bg-[#F9F9FB] p-6 text-center text-sm text-[#8E8E93]">
                    멤버 목록을 불러오는 중입니다...
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {users.map((user) => (
                      <UserManage key={user.id} user={user} handlePermissionChange={handlePermissionChange} />
                    ))}
                    {users.length === 0 && (
                      <li className="rounded-[16px] bg-[#F9F9FB] p-6 text-center text-sm text-[#8E8E93]">
                        표시할 멤버가 없습니다.
                      </li>
                    )}
                  </ul>
                )}
              </div>
            )}

            {activeTab === "vote" && (
              <>
                <div className="rounded-[24px] bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-center justify-between text-xs text-[#8E8E93] sm:text-sm">
                    <span>STEP {activeStep === "vote" ? "1" : "2"} / 2</span>
                    <span>{stepTitle}</span>
                  </div>
                  <h2 className="mt-3 text-left text-lg font-semibold text-[#1C1C1E] sm:text-xl">{stepTitle}</h2>
                  <p className="mt-2 text-left text-xs text-[#636366] sm:text-sm">{stepDescription}</p>
                </div>

                <div className="rounded-[24px] bg-white p-5 shadow-sm sm:p-6">
                  {activeStep === "vote" ? renderVoteStep() : renderDeadlineStep()}
                </div>
              </>
            )}
          </section>
        )}
      </div>

      <SearchPopup isOpen={isPopupOpen && activeTab === "vote"} onClose={() => setIsPopupOpen(false)} onSelect={handlePopupSelect} />

      <FooterNav />
    </div>
  );
};

export default Admin;
