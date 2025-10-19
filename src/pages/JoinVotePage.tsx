import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import JoinVoteBefore from "../components/JoinVoteBefore";
import JoinVoteAfter from "../components/JoinVoteAfter";
import alarm from "../assets/img/alarm.png";
import vote from "../assets/img/vote.png";
import FooterNav from "../components/FooterNav";
import { server } from "@/utils/axios";
import { voteItem } from "@/types/JoinVote";
import { ParticipationInfo } from "@/types/participationInfo";

const JoinVotePage = () => {
  const navigate = useNavigate();
  const { meetId } = useParams();

  const [meet, setMeet] = useState<ParticipationInfo | null>(null);
  const [itemList, setItemList] = useState<voteItem[]>([]);
  const [isVoted, setIsVoted] = useState<boolean>(false);
  const [votedItem, setVotedItem] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!meetId) {
      navigate("/not-found");
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        await fetchMeet();
        await fetchMemberInfo();
        await fetchItemList();
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [meetId, navigate]);

  useEffect(() => {
    if (!meetId) {
      return;
    }

    const refreshItems = async () => {
      await fetchItemList();
    };

    void refreshItems();
  }, [isVoted, meetId]);

  const fetchMemberInfo = () => {
    return server
      .get(`/meet/participate/item/list?meetId=${meetId}`)
      .then((response) => {
        setIsVoted(false);
        setVotedItem("");
        response.data.forEach((item: voteItem) => {
          if (item.isVote === "true") {
            setIsVoted(true);
            setVotedItem(item.id);
          }
        });
      })
      .catch((error) => {
        if (error.code === "403") {
          navigate("/Unauthorized");
        } else if (error.code === "404") {
          navigate("/not-found");
        }
      });
  };

  const fetchMeet = () => {
    return server
      .get(`/meet/participate?meetId=${meetId}`)
      .then((response) => {
        const data = response.data;

        const formattedMeetDate = formatDate(data.date || "");
        const formattedEndDate = formatDate(data.endDate || "");

        setMeet({
          meetTitle: data.meetTitle || "제목 없음",
          date: formattedMeetDate,
          time: data.time,
          endDate: formattedEndDate,
          place: data.place || "장소 미정",
          isAuthor: data.isAuthor,
        });
      })
      .catch((error) => {
        if (error.code === "403") {
          navigate("/Unauthorized");
        } else if (error.code === "404") {
          navigate("/not-found");
        }
      });
  };

  const fetchItemList = () => {
    return server
      .get(`/meet/participate/item/list?meetId=${meetId}`)
      .then((response) => {
        setItemList(response.data);
      })
      .catch((error) => {
        if (error.code === "403") {
          navigate("/Unauthorized");
        } else if (error.code === "404") {
          navigate("/not-found");
        }
      });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) {
      return "날짜 미정";
    }

    const normalizedString = dateString.replace(" ", "T");
    const date = new Date(normalizedString);

    if (Number.isNaN(date.getTime())) {
      return "날짜 미정";
    }

    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  };

  const handleEdit = () => {
    navigate(`/meet/edit/${meetId}`);
  };

  const handleDelete = () => {
    if (!meetId) {
      return;
    }

    server
      .delete(`/meet?meetId=${meetId}`)
      .then(() => {
        navigate("/");
      })
      .catch((error) => {
        if (error.code === "403") {
          navigate("/Unauthorized");
        } else if (error.code === "404") {
          navigate("/not-found");
        }
      });
  };

  const detailItems = useMemo(
    () => [
      {
        label: "일정",
        value: `${meet?.date ?? "날짜 미정"}${meet?.time ? ` ${meet.time}` : ""}`,
        icon: "fa-regular fa-calendar-days",
      },
      {
        label: "장소",
        value: meet?.place ?? "장소 미정",
        icon: "fa-solid fa-location-dot",
      },
      {
        label: "투표 마감",
        value: meet?.endDate ?? "정보 없음",
        icon: "fa-regular fa-flag",
      },
    ],
    [meet?.date, meet?.time, meet?.place, meet?.endDate],
  );

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F2F2F7]">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-[#E5E5EA] border-t-[#1E3A8A]" />
        <p className="mt-4 text-[13px] text-[#8E8E93]">참여 투표 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (!meet) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F2F2F7] text-center">
        <p className="text-[14px] font-medium text-[#1C1C1E]">모임 정보를 확인할 수 없습니다.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 rounded-full bg-[#1E3A8A] px-5 py-2 text-[12px] font-semibold text-white shadow-md"
        >
          이전 페이지로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#F2F2F7]" style={{ paddingBottom: "90px" }}>
      <header className="bg-white px-6 pt-6 pb-5 shadow-[0_6px_20px_rgba(0,0,0,0.05)]">
        <span className="rounded-full bg-[#E1F0FF] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#1E3A8A]">참여 투표</span>
        <h1 className="mt-3 text-[23px] font-bold leading-tight text-[#111827]">{meet.meetTitle}</h1>
        <p className="mt-2 text-[13px] text-[#4B5563]">함께할 의사를 알려주세요.</p>
        {meet.isAuthor === "true" && (
          <div className="mt-5 flex gap-2">
            <button
              onClick={handleEdit}
              className="flex-1 rounded-full bg-[#2563EB] px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#1D4ED8]"
            >
              수정하기
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 rounded-full bg-[#FF3B30] px-4 py-2 text-[12px] font-semibold text-white shadow-md transition hover:shadow-lg"
            >
              삭제하기
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 px-6 pb-10 pt-8">
        <section className="rounded-[24px] bg-white p-6 shadow-[0_12px_32px_rgba(26,26,26,0.08)]">
          <div className="flex items-start gap-4 border-b border-[#E5E7EB] pb-4">
            <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-[#E1F0FF]">
              <img src={alarm} alt="알림" className="h-12 w-12 object-contain" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-[15px] font-semibold text-[#111827]">모임 정보</h2>
              <p className="text-[13px] text-[#6B7280]">일정과 장소를 확인하고 참여 여부를 알려주세요.</p>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-4">
            {detailItems.map((item) => (
              <div key={item.label} className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E8F1FF] text-[#1E3A8A]">
                  <i className={`${item.icon} text-[18px]`}></i>
                </span>
                <div className="flex flex-col">
                  <span className="text-[12px] font-medium text-[#6B7280]">{item.label}</span>
                  <span className="text-[15px] font-semibold text-[#111827]">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[24px] bg-white p-6 shadow-[0_12px_32px_rgba(26,26,26,0.06)]">
          <div className="flex items-center gap-4 border-b border-[#E5E7EB] pb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF4E8]">
              <img src={vote} alt="투표" className="h-12 w-12 object-contain" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-[18px] font-bold text-[#111827]">모임에 참여하시겠습니까?</h2>
              <p className="text-[12px] text-[#6B7280]">투표 마감일 {meet.endDate}</p>
            </div>
          </div>
          <div className="mt-6">
            {isVoted ? (
              <JoinVoteAfter votedItemId={votedItem} setIsVoted={setIsVoted} itemList={itemList} />
            ) : (
              <JoinVoteBefore
                meetId={meetId!}
                setIsVoted={setIsVoted}
                setVotedItem={setVotedItem}
                itemList={itemList}
              />
            )}
          </div>
        </section>
      </main>

      <FooterNav />
    </div>
  );
};

export default JoinVotePage;
