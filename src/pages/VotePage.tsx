import React, { useEffect, useState } from "react";
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
  const { meetId } = useParams();
  const [meet, setMeet] = useState<Meet>({ meetTitle: '', endDate: '', isAuthor: '', place: null , date: null});
  const [scheduleList, setScheduleList] = useState<Schedule[]>([]);
  const [placeList, setPlaceList] = useState<Place[]>([]);
  const [isScheduleVoted, setIsScheduleVoted] = useState<boolean>(false);
  const [isPlaceVoted, setIsPlaceVoted] = useState<boolean>(false);
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>([]);

  // 페이지에 처음 로드될 때
  useEffect(() => {
    const fetchVote = async () => {
      await fetchMeet();
      await fetchScheduleVoteItems();
      await fetchPlaceVoteItems();
    };
    fetchVote();
  }, [meetId]);

  useEffect(() => {
    if (scheduleList.length > 0 && placeList.length > 0) {
      checkUserVotedBefore();
    }
  }, [scheduleList, placeList]);

  // 모임 정보 조회
  const fetchMeet = () => {
    const fetchSchedule = server.get(`/meet/schedule?meetId=${meetId}`);
    const fetchPlace = server.get(`/meet/place?meetId=${meetId}`);
    const fetchMeetInfo = server.get(`/meet?meetId=${meetId}`);

    Promise.all([fetchSchedule, fetchPlace, fetchMeetInfo])
      .then(([scheduleResponse, placeResponse, meetResponse]) => {
        setMeet({
          meetTitle: scheduleResponse.data.meetTitle,
          endDate: scheduleResponse.data.endDate,
          isAuthor: placeResponse.data.isAuthor,
          place: meetResponse.data.place || null, 
          date: meetResponse.data.date || null, // 장소가 없으면 null로 설정
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
    await server
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
    await server
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

  return (
    <div
      className="w-full flex flex-col overflow-y-auto"
      style={{ backgroundColor: "#F2F2F7", paddingBottom: "90px" }}
    >
      {/* 헤더 */}
      <div className="flex flex-col items-start m-8 mb-3">
        <h1 className="text-2xl font-bold">{meet.meetTitle}</h1>
  
        <div className="flex items-center justify-between w-full">
          <span className="text-[13px] text-left text-[#8E8E93] w-1/2">
            투표 마감: {meet.endDate}
          </span>
  
          {/* isAuthor가 true일 때만 수정, 삭제 버튼 표시 */}
          {meet.isAuthor && (
            <div className="flex space-x-2 mt-1">
              <button
                onClick={handleEdit}
                className="w-16 px-4 py-2 bg-[#FFE607] rounded-[24px] text-black text-sm font-bold"
              >
                수정
              </button>
              <button
                onClick={handleDelete}
                className="w-16 px-4 py-2 bg-[#FF3B30] rounded-[24px] text-black text-sm font-bold"
              >
                삭제
              </button>
            </div>
          )}
        </div>
      </div>
  
      {/* 일정 투표 부분 */}
      {meet.date?.time === null && meet.date?.value === null && (
        <div className="bg-white rounded-[24px] space-y-2 p-6 m-6 mt-0">
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
      )}
  
      {/* 장소 투표 부분: 장소가 없을 때만 표시 */}
      {meet.place?.name === null && (
        <div className="bg-white rounded-[24px] space-y-2 p-6 m-6 mt-0">
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
      )}
  
      {/* 투표하기 버튼/다시 투표하기 버튼 */}
      <button
        onClick={isScheduleVoted && isPlaceVoted ? handleVoteAgain : handleVoteClick}
        className="h-[55px] bg-[#FFE607] p-2 mx-6 rounded-[24px] text-black text-[16px] font-bold"
        style={{ outline: "none", border: "none" }}
      >
        {isScheduleVoted && isPlaceVoted ? "다시 투표하기" : "투표하기"}
      </button>
  
      {/* 하단 네비게이션 바 */}
      <FooterNav />
    </div>
  );
  
};

export default VotePage;
