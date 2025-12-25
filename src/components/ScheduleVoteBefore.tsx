import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { server } from "@/utils/axios";
import { Schedule } from "@/types/ScheduleVote";

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
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
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
    if (!newDate || !newTime) {
      alert("날짜와 시간을 모두 입력해 주세요.");
      return;
    }

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
      setIsAddModalOpen(false);
    })
    .catch((error) => {
      if (error.code === "403") {
        navigate("/Unauthorized");
      } else if (error.code === "404") {
        navigate("/not-found");
      }
    });
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setNewDate("");
    setNewTime("");
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
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="text-[13px] text-[#8E8E93] bg-transparent p-0 mt-1"
        >
          <i className="fa-solid fa-plus"></i> 일정 추가
        </button>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={handleCloseModal}>
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#1C1C1E]">날짜 투표 항목 추가</h3>
                <p className="mt-1 text-sm text-[#6B7280]">날짜와 시간을 입력해 주세요.</p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-[#8E8E93] transition hover:text-[#1C1C1E]"
              >
                <i className="fa-regular fa-xmark"></i>
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="flex flex-col gap-2 text-sm font-medium text-[#1C1C1E]">
                <span className="text-xs font-semibold text-[#6B7280]">날짜</span>
                <input
                  type="date"
                  value={newDate}
                  onChange={handleDateChange}
                  className="rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-3 py-3 text-sm font-semibold focus:border-[#FFE607] focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-[#1C1C1E]">
                <span className="text-xs font-semibold text-[#6B7280]">시간</span>
                <input
                  type="time"
                  value={newTime}
                  onChange={handleTimeChange}
                  className="rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] px-3 py-3 text-sm font-semibold focus:border-[#FFE607] focus:outline-none"
                />
              </label>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-full rounded-[12px] border border-[#E5E5EA] bg-white px-4 py-3 text-sm font-semibold text-[#1C1C1E] transition hover:border-[#C7C7CC]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleAddSchedule}
                className="w-full rounded-[12px] bg-[#5856D6] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4C4ACB]"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleVoteBefore;
