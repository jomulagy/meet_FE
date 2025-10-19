import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ScheduleVoteBefore from "@/components/ScheduleVoteBefore";
import ScheduleVoteAfter from "@/components/ScheduleVoteAfter";
import PlaceVoteBefore from "@/components/PlaceVoteBefore";
import PlaceVoteAfter from "@/components/PlaceVoteAfter";
import { server } from "@/utils/axios";
import { Schedule } from "@/types/ScheduleVote";
import { Place } from "@/types/PlaceVote";
import FooterNav from "../components/FooterNav";
import { Meet } from "@/types/Meet";

const VotePage = () => {
  const navigate = useNavigate();
  const {meetId} = useParams();
  const [meet, setMeet] = useState<Meet>({ meetTitle: '', endDate: '', isAuthor: '' });
  const [scheduleList, setScheduleList] = useState<Schedule[]>([]);
  const [placeList, setPlaceList] = useState<Place[]>([]);
  const [isScheduleVoted, setIsScheduleVoted] = useState<boolean>(false);
  const [isPlaceVoted, setIsPlaceVoted] = useState<boolean>(false);
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // 페이지에 처음 로드될 때
  useEffect(() => {
    const fetchVote = async () => {
      setIsLoading(true);
      try {
        await fetchMeet();
        await Promise.all([fetchScheduleVoteItems(), fetchPlaceVoteItems()]);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchVote();
  }, [meetId]);
  
  useEffect(() => {
    if (scheduleList.length > 0 && placeList.length > 0) {
      checkUserVotedBefore();
    }
  }, [scheduleList, placeList]);

  // 모임 정보 조회
  const fetchMeet = async () => {
    const fetchSchedule = server.get(`/meet/schedule?meetId=${meetId}`);
    const fetchPlace = server.get(`/meet/place?meetId=${meetId}`);

    return Promise.all([fetchSchedule, fetchPlace])
      .then(([scheduleResponse, placeResponse]) => {
        setMeet({
          meetTitle: scheduleResponse.data.meetTitle,
          endDate: placeResponse.data.endDate,
          isAuthor: placeResponse.data.isAuthor
        });
      })
      .catch((error) => {
        console.error('API 호출 오류:', error);
        if (error.code === "403") {
          navigate("/Unauthorized");
        } else if (error.code === "404") {
          navigate("/not-found");
        }
      });
  };
  

  // 일정 투표 항목 조회
  const fetchScheduleVoteItems = async () => {
    return server
      .get(`/meet/schedule/item/list?meetId=${meetId}`)
      .then((response) => {
        setScheduleList(response.data);

        const votedScheduleIds = response.data
          .filter((schedule: Schedule) => schedule.isVote === "true")
          .map((schedule: Schedule) => schedule.id);
        setSelectedScheduleIds(votedScheduleIds);
      })
      .catch((error) => {
        if (error.code === "403") {
          navigate("/Unauthorized");
        } else if (error.code === "404") {
          navigate("/not-found");
        }
      });
  };

  // 장소 투표 항목 조회
  const fetchPlaceVoteItems = async () => {
    return server
      .get(`/meet/place/item/list?meetId=${meetId}`)
      .then((response) => {
        setPlaceList(response.data);

        const votedPlaceIds = response.data
          .filter((place: Place) => place.isVote === "true")
          .map((place: Place) => place.id);
        setSelectedPlaceIds(votedPlaceIds);
      })
      .catch((error) => {
        if (error.code === "403") {
          navigate("/Unauthorized");
        } else if (error.code === "404") {
          navigate("/not-found");
        }
      });
  };

  // 사용자 투표 여부 확인 함수
  const checkUserVotedBefore = () => {
    server.get("/member")
      .then((response) => {
        const loginedUserId = response.data.id;

        const scheduleVoted = scheduleList.some(schedule => 
          schedule.memberList.some(member => member.id === loginedUserId)
        );
        const placeVoted = placeList.some(place => 
          place.memberList.some(member => member.id === loginedUserId)
        );

        setIsScheduleVoted(scheduleVoted);
        setIsPlaceVoted(placeVoted);
      })
      .catch((error) => {
        if (error.code === "403") {
          navigate("/Unauthorized");
        } else if (error.code === "404") {
          navigate("/not-found");
        }
      });
  };

  // 투표하기 버튼 클릭 핸들러
  const handleVoteClick = () => {
    server
      .put("/meet/schedule", {
        data: {
          meetId: meetId,
          scheduleVoteItemList: selectedScheduleIds,
        },
      })
      .then(() => {
        setIsScheduleVoted(true);
  
        return server.put("/meet/place", {
          data: {
            meetId: meetId,
            placeVoteItemList: selectedPlaceIds,
          },
        });
      })
      .then(() => {
        setIsPlaceVoted(true);
        return Promise.all([fetchScheduleVoteItems(), fetchPlaceVoteItems()]);
      })
      .catch((error) => {
        if (error.code === "403") {
          navigate("/Unauthorized");
        } else if (error.code === "404") {
          navigate("/not-found");
        }
      });
  };  

  // 다시 투표하기 버튼 클릭 핸들러
  const handleVoteAgain = async () => {
    setIsScheduleVoted(false);
    setIsPlaceVoted(false); 
  };

  // 상태 업데이트를 위한 핸들러
  const handleScheduleChange = (scheduleIds: string[]) => {
    setSelectedScheduleIds(scheduleIds);
  };

  const handlePlaceChange = (placeIds: string[]) => {
    setSelectedPlaceIds(placeIds);
  };

  // 수정 버튼 클릭 이벤트 함수
  const handleEdit = () => {
    navigate(`/meet/edit/${meetId}`); 
  };

  // 삭제 버튼 클릭 이벤트 함수
  const handleDelete = () => {
    if (meetId) {
      server
        .delete(`/meet?meetId=${meetId}`)
        .then(() => {
          navigate('/');
        })
        .catch((error) => {
          if (error.code === "403") {
            navigate("/Unauthorized");
          } else if (error.code === "404") {
            navigate("/not-found");
          }
        });
    }
  };

  const deadlineLabel = useMemo(() => {
    if (!meet.endDate) {
      return "투표 마감 정보가 없습니다.";
    }
    return `투표 마감 ${meet.endDate}`;
  }, [meet.endDate]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F2F2F7]">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-[#E5E5EA] border-t-[#5E5CE6]" />
        <p className="mt-4 text-[13px] text-[#8E8E93]">투표 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#F2F2F7]" style={{ paddingBottom: "90px" }}>
      <div className="relative overflow-hidden bg-gradient-to-br from-[#5E5CE6] via-[#7A6CFF] to-[#A68BFF] px-6 pb-24 pt-14 text-white">
        <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold tracking-wide">투표 진행 중</span>
        <h1 className="mt-3 text-[24px] font-bold leading-tight">{meet.meetTitle}</h1>
        <p className="mt-2 text-[13px] text-white/80">{deadlineLabel}</p>
        {meet.isAuthor && (
          <div className="mt-5 flex gap-2">
            <button
              onClick={handleEdit}
              className="flex-1 rounded-full bg-white/20 px-4 py-2 text-[12px] font-semibold text-white backdrop-blur transition hover:bg-white/30"
            >
              수정하기
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 rounded-full bg-[#FF3B30] px-4 py-2 text-[12px] font-semibold text-white shadow-lg transition hover:shadow-xl"
            >
              삭제하기
            </button>
          </div>
        )}
      </div>

      <main className="-mt-16 flex-1 px-6 pb-10">
        <section className="rounded-[26px] bg-white p-6 shadow-[0_12px_32px_rgba(26,26,26,0.08)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-[#1C1C1E]">일정 투표</h2>
              <p className="mt-1 text-[12px] text-[#8E8E93]">참여 가능한 일정을 선택해주세요.</p>
            </div>
            <span className="rounded-full bg-[#EEF1FF] px-3 py-1 text-[12px] font-semibold text-[#5E5CE6]">
              {isScheduleVoted ? "투표 완료" : "투표 대기"}
            </span>
          </div>
          <div className="mt-4">
            {isScheduleVoted ? (
              <ScheduleVoteAfter
                scheduleList={scheduleList}
                setIsVoted={setIsScheduleVoted}
                fetchScheduleVoteItems={fetchScheduleVoteItems}
              />
            ) : (
              <ScheduleVoteBefore
                meetId={meetId || ""}
                scheduleList={scheduleList}
                setIsVoted={setIsScheduleVoted}
                fetchScheduleVoteItems={fetchScheduleVoteItems}
                handleScheduleChange={handleScheduleChange}
                selectedScheduleIds={selectedScheduleIds}
              />
            )}
          </div>
        </section>

        <section className="mt-6 rounded-[26px] bg-white p-6 shadow-[0_12px_32px_rgba(26,26,26,0.06)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-[#1C1C1E]">장소 투표</h2>
              <p className="mt-1 text-[12px] text-[#8E8E93]">모임에 어울리는 장소를 골라주세요.</p>
            </div>
            <span className="rounded-full bg-[#EEF1FF] px-3 py-1 text-[12px] font-semibold text-[#5E5CE6]">
              {isPlaceVoted ? "투표 완료" : "투표 대기"}
            </span>
          </div>
          <div className="mt-4">
            {isPlaceVoted ? (
              <PlaceVoteAfter placeList={placeList} />
            ) : (
              <PlaceVoteBefore
                meetId={meetId || ""}
                placeList={placeList}
                setIsVoted={setIsPlaceVoted}
                fetchPlaceVoteItems={fetchPlaceVoteItems}
                handlePlaceChange={handlePlaceChange}
                selectedPlaceIds={selectedPlaceIds}
              />
            )}
          </div>
        </section>

        <button
          onClick={isScheduleVoted && isPlaceVoted ? handleVoteAgain : handleVoteClick}
          className="mt-8 h-[55px] w-full rounded-[24px] bg-[#FFE607] text-[16px] font-bold text-[#1C1C1E] shadow-[0_10px_24px_rgba(255,230,7,0.35)] transition hover:shadow-[0_12px_28px_rgba(255,230,7,0.45)]"
        >
          {isScheduleVoted && isPlaceVoted ? "다시 투표하기" : "투표하기"}
        </button>
      </main>

      <FooterNav />
    </div>
  );
};

export default VotePage;