import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { server } from "@/utils/axios";
import { Schedule } from "@/types/ScheduleVote";
import { createTimeWheelHandler } from "@/utils/timeInput";

type ScheduleVoteBeforeProps = {
  meetId: string;
  scheduleList: Schedule[];
  setIsVoted: (value: boolean) => void;
  fetchScheduleVoteItems: () => void;
  handleScheduleChange: (scheduleIds: string[]) => void;
  selectedScheduleIds: string[];
};

const ScheduleVoteBefore = ({
  meetId,
  scheduleList,
  handleScheduleChange,
  selectedScheduleIds,
}: ScheduleVoteBeforeProps) => {
  const [schedules, setSchedules] = useState<Schedule[]>(scheduleList);
  const [newDate, setNewDate] = useState<string>("");
  const [newTime, setNewTime] = useState<string>("");
  const [isAdding, setIsAdding] = useState<boolean>(false); 
  const navigate = useNavigate();

  // 컴포넌트 마운트 시 초기 일정 목록 설정
  useEffect(() => {
    setSchedules(scheduleList);
  }, [scheduleList]);  

  // 날짜 입력 상태 관리 함수
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewDate(event.target.value);
  };

  // 시간 입력 상태 관리 함수
  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewTime(event.target.value);
  };

  // 일정 추가 함수
  const handleAddSchedule = async () => {
    server.post(
      `/schedule/item`,
      {
        data: {
          meetId: meetId,
          date: newDate,
          time: newTime,
        }
      }
    )
    .then((response) => {
      const newSchedule: Schedule = {
        id: response.data.id,
        date: `${response.data.date}`,
        time: `${response.data.time}`,
        editable: response.data.editable,
        isVote: response.data.isVote,
        memberList: response.data.memberList,
      };

      setSchedules((prevSchedules) => [...prevSchedules, newSchedule]);
      setNewDate("");
      setNewTime("");
      setIsAdding(false);
    })
    .catch((error) => {
      if (error.code === "403") {
        navigate("/Unauthorized");
      } else if (error.code === "404") {
        navigate("/not-found");
      }
    });
  };

  // 일정 삭제 함수
  const handleRemoveSchedule = (id: string) => {
    server
      .delete(`/schedule/item?scheduleVoteItemId=${id}`)
      .then(() => {
        setSchedules((prevList) =>
          prevList.filter((schedule) => schedule.id !== id)
        );
      })
      .catch((error) => {
        if (error.code === "403") {
          navigate("/Unauthorized");
        } else if (error.code === "404") {
          navigate("/not-found");
        }
      });
  };

  // 체크박스 상태 변경할 때
  const handleCheckboxChange = (id: string, checked: boolean) => {
    const updatedList = checked
      ? [...selectedScheduleIds, id]
      : selectedScheduleIds.filter((itemId) => itemId !== id);

    handleScheduleChange(updatedList);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="overflow-y-auto flex-grow">
      {schedules.map((schedule) => (
        <div key={schedule.id} className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedScheduleIds.includes(schedule.id)}
              onChange={(e) =>
                handleCheckboxChange(schedule.id, e.target.checked)
              }
            />
            <span>{`${schedule.date} ${schedule.time}`}</span>
          </div>

          {schedule.editable === "true" && (
            <button
              onClick={() => handleRemoveSchedule(schedule.id)}
              className="text-[#8E8E93] bg-transparent p-0 mr-2"
            >
              <i className="fa-regular fa-trash-can"></i>
            </button>
          )}
        </div>
      ))}
      </div>
      <div className="flex justify-end">
        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="text-[13px] text-[#8E8E93] bg-transparent p-0 mt-1"
          >
            <i className="fa-solid fa-plus"></i> 일정 추가
          </button>
        ) : (
          <div className="space-y-2 w-full">
            <input
              type="date"
              value = {newDate}
              onChange={handleDateChange}
              className="border border-[#F2F2F7] rounded-lg px-2 py-1 w-full"
            />
            <input
            type="time"
            value={newTime}
            onChange={handleTimeChange}
            onWheel={createTimeWheelHandler(setNewTime)}
            step="300"
            className="border border-[#F2F2F7] rounded-lg px-2 py-1 w-full"
            />
            <div className="flex space-x-2">
              <button
                onClick={() => setIsAdding(false)}
                className="bg-[#F2F2F7] rounded-lg px-4 py-2 text-black w-1/2"
              >
                취소
              </button>
              <button
                onClick={handleAddSchedule}
                className="bg-[#F2F2F7] rounded-lg px-4 py-2 text-black w-1/2"
              >
                확인
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleVoteBefore;
