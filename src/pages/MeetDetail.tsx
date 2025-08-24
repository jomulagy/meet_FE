import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import FooterNav from "../components/FooterNav";
import { server } from "@/utils/axios";
import { Meet } from "@/types/Meet";
import { ParticipationInfo } from "@/types/participationInfo";

type MeetInfo = {
  id: string;
  title: string;
  content: string;
  type: string;
  date: {
    value: string;
    time: string;
    editable: string;
  } | null;
  place: {
    value: string;
    editable: string;
  } | null;
  isAuthor: string;
  participantsNum: string;
  participants: string[];
};

const MeetDetail: React.FC = () => {
  const {meetId} = useParams();
  const [meetInfo, setMeetInfo] = useState<MeetInfo | null>(null);
  const [placeVoteInfo, setPlaceVoteInfo] = useState<Meet | null>(null);
  const [scheduleVoteInfo, setScheduleVoteInfo] = useState<Meet | null>(null);
  const [participationInfo, setParticipationInfo] = useState<ParticipationInfo | null>(null);
  const [formattedDate, setFormattedDate] = useState<String | null>(null);

  const navigate = useNavigate();

  const fetchMeetDetail = async () => {
    if (meetId) {
      server
        .get(`/meet?meetId=${meetId}`)
        .then((response) => {
          const data = response.data;
          if (typeof data.participants === "string") {
            try {
              data.participants = JSON.parse(data.participants.replace(/'/g, '"'));
            } catch (parseError) {
              console.error("참여자 데이터 파싱 오류:", parseError);
              data.participants = [];
            }
          }
          setMeetInfo(data);

          // date.value를 Date 객체로 변환
          const meetingDate = response.data.date?.value ? new Date(response.data.date.value) : null;
          setFormattedDate(meetingDate
            ? `${meetingDate.getFullYear()}-${('0' + (meetingDate.getMonth() + 1)).slice(-2)}-${('0' + meetingDate.getDate()).slice(-2)}`
            : "날짜 미정");
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

  const fetchVoteInfo = async() => {
    if (meetId) {
      server
        .get(`/meet/place?meetId=${meetId}`)
        .then((response) => {
          setPlaceVoteInfo(response.data);
          
          server
          .get(`/meet/schedule?meetId=${meetId}`)
          .then((response) => {
            setScheduleVoteInfo(response.data);
            console.log(response);

            server
            .get(`/meet/participate?meetId=${meetId}`)
            .then((response) => setParticipationInfo(response.data))
            .catch(console.error);
          })
          .catch(console.error);
        })
        .catch(console.error);
    }
  };

  useEffect(() => {
    if (!placeVoteInfo || !scheduleVoteInfo || !participationInfo) {
      fetchVoteInfo();
    }
  }, []);

  useEffect(() => {
    
    if (placeVoteInfo && scheduleVoteInfo && participationInfo) {
      console.log(placeVoteInfo, scheduleVoteInfo, participationInfo)
      const now = new Date();
      const placeVoteEndDate = placeVoteInfo?.endDate ? new Date(placeVoteInfo.endDate) : null;
      const scheduleVoteEndDate = scheduleVoteInfo?.endDate ? new Date(scheduleVoteInfo.endDate) : null;
      const participationEndDate = participationInfo?.endDate ? new Date(participationInfo.endDate) : null;
      
      if ((placeVoteEndDate && now.getTime() < placeVoteEndDate.getTime()) || (scheduleVoteEndDate && now.getTime() < scheduleVoteEndDate.getTime())) {
        navigate(`/meet/vote/${meetId}`);
        return;
      } else if (participationEndDate && now.getTime() < participationEndDate.getTime()) {
        navigate(`/meet/join/${meetId}`);
        return;
      }
      else{
        fetchMeetDetail();
      }
    }
  }, [placeVoteInfo, scheduleVoteInfo, participationInfo]);

  const handleEdit = () => {
    if (meetInfo) {
      navigate(`/meet/edit/${meetInfo.id}`);
    }
  };

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
  
  if(meetInfo == null){
    return;
  }


  return (
    <div className="min-h-screen w-full flex flex-col" style={{ backgroundColor: "#F2F2F7" }}>
      <div className="flex flex-col items-start m-8 pb-16 space-y-4">
        <h1 className="text-2xl font-bold pl-4">모임 정보</h1>
        <div className="w-full bg-white p-6 rounded-[24px] space-y-2 text-left">
          <p className="text-sm text-[#8E8E93]">제목</p>
          <p className="text-lg font-bold">{meetInfo.title}</p>
          <p className="text-sm text-[#8E8E93]">날짜</p>
          <p className="text-lg font-bold">{formattedDate}</p>
          <p className="text-sm text-[#8E8E93]">시간</p>
          <p className="text-lg font-bold">{meetInfo.date?.time ? meetInfo.date.time : "시간 미정"}</p>
          <p className="text-sm text-[#8E8E93]">위치</p>
          <p className="text-lg font-bold">{meetInfo.place?.value ? meetInfo.place.value : "장소 미정"}</p>
          <p className="text-sm text-[#8E8E93]">내용</p>
          <p className="text-lg font-bold">{meetInfo.content ? meetInfo.content : "내용 없음"}</p>
          <p className="text-xs text-[#8E8E93]">참여자</p>
          <p className="text-lg font-bold">{meetInfo.participants!.length > 0 ? meetInfo!.participants.join(", ") : " 참여자 없음"}</p>
        </div>

        {meetInfo!.isAuthor === "true" && (
          <div className="flex w-full mt-4">
            <button
              onClick={handleEdit}
              className="mr-2 flex-1 px-4 py-3 bg-[#FFE607] rounded-[24px] text-black font-bold"
            >
              수정
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 px-4 py-2 bg-[#FF3B30] rounded-[24px] text-black font-bold"
            >
              삭제
            </button>
          </div>
        )}
      </div>
      <FooterNav />
    </div>
  );
};
export default MeetDetail;
