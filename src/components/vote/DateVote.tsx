import React, { useState } from "react";
import type { Vote } from "../../types/vote";
import VotedMemberList from "../popUp/VotedMemberList";

const OptionResults: React.FC<{ options: Vote["options"]; highlightVoted?: boolean }> = ({ options, highlightVoted }) => (
  <div className="mt-3 flex flex-col gap-2">
    {options.map((option) => (
      <div
        key={option.id}
        className={`flex items-center justify-between rounded-xl border px-4 py-2 text-xs font-medium ${
          highlightVoted && option.voted
            ? "border-[#5856D6] bg-[#EAE9FF] text-[#1C1C1E]"
            : "border-[#E5E5EA] bg-white text-[#1C1C1E]"
        }`}
      >
        <span>{option.label}</span>
        <span className="text-[11px] font-semibold text-[#8E8E93]">{option.count}표</span>
      </div>
    ))}
  </div>
);

export const DateVoteBefore: React.FC<{
  vote: Vote;
  allowDuplicate: boolean;
  selectedOptionIds: string[];
  onToggleOption: (optionId: string) => void;
  onVote: () => void;
  onAddOption: (label: string) => void;
}> = ({ vote, allowDuplicate, selectedOptionIds, onToggleOption, onVote, onAddOption }) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState<"오전" | "오후">("오전");
  const [selectedHour, setSelectedHour] = useState("");
  const [selectedMinute, setSelectedMinute] = useState("");

  const handleConfirm = () => {
    if (!selectedYear || !selectedMonth || !selectedDay || !selectedHour || !selectedMinute) return;
    const month = selectedMonth.padStart(2, "0");
    const day = selectedDay.padStart(2, "0");
    onAddOption(`${selectedYear}.${month}.${day} ${selectedPeriod} ${selectedHour}:${selectedMinute}`);
    setSelectedYear("");
    setSelectedMonth("");
    setSelectedDay("");
    setSelectedPeriod("오전");
    setSelectedHour("");
    setSelectedMinute("");
    setIsPopupOpen(false);
  };

  const today = new Date();
  const yearOptions = [String(today.getFullYear()), String(today.getFullYear() + 1)];
  const monthOptions = Array.from({ length: 12 }, (_, index) => String(index + 1));
  const dayOptions = Array.from({ length: 31 }, (_, index) => String(index + 1));
  const hourOptions = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));
  const minuteOptions = ["00", "30"];

  return (
    <div className="mt-4 rounded-[20px] border border-dashed border-[#C7C7CC] bg-[#F9F9FB] p-4">
      <div className="mt-3 flex flex-col gap-3">
        {vote.options.map((option) => (
          <label key={option.id} className="flex items-center gap-3 rounded-xl bg-white px-4 py-2 text-xs text-[#1C1C1E]">
            <input
              type={allowDuplicate ? "checkbox" : "radio"}
              name={allowDuplicate ? undefined : `date-vote-${vote.id}`}
              checked={selectedOptionIds.includes(option.id)}
              onChange={() => onToggleOption(option.id)}
              className="h-4 w-4 text-[#5856D6]"
            />
            {option.label}
          </label>
        ))}
      </div>
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setIsPopupOpen(true)}
        className="w-full rounded-[12px] bg-[#EAE9FF] px-3 py-2 text-xs font-semibold text-[#5856D6]"
      >
        항목 추가하기
      </button>
    </div>
    <button
        type="button"
        onClick={onVote}
        className="mt-4 w-full rounded-[16px] bg-[#5856D6] px-5 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#4C4ACB]"
      >
      투표하기
    </button>
    {isPopupOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#5856D6]/20 px-4">
        <div className="w-full max-w-sm rounded-[20px] bg-white p-5 shadow-lg">
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-[#8E8E93]">날짜</span>
              <div className="flex gap-2 overflow-x-auto">
                {yearOptions.map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => setSelectedYear(year)}
                    className={`rounded-[10px] px-3 py-2 text-xs font-semibold ${
                      selectedYear === year ? "bg-[#5856D6] text-white" : "border border-[#E5E5EA] bg-white text-[#5856D6]"
                    }`}
                  >
                    {year}년
                  </button>
                ))}
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {monthOptions.map((month) => (
                  <button
                    key={month}
                    type="button"
                    onClick={() => setSelectedMonth(month)}
                    className={`rounded-[10px] px-3 py-2 text-xs font-semibold ${
                      selectedMonth === month
                        ? "bg-[#5856D6] text-white"
                        : "border border-[#E5E5EA] bg-white text-[#5856D6]"
                    }`}
                  >
                    {month}월
                  </button>
                ))}
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {dayOptions.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`rounded-[10px] px-3 py-2 text-xs font-semibold ${
                      selectedDay === day ? "bg-[#5856D6] text-white" : "border border-[#E5E5EA] bg-white text-[#5856D6]"
                    }`}
                  >
                    {day}일
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-[#8E8E93]">시간</span>
              <div className="flex gap-2 overflow-x-auto">
                {(["오전", "오후"] as const).map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setSelectedPeriod(period)}
                    className={`rounded-[10px] px-3 py-2 text-xs font-semibold ${
                      selectedPeriod === period
                        ? "bg-[#5856D6] text-white"
                        : "border border-[#E5E5EA] bg-white text-[#5856D6]"
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {hourOptions.map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => setSelectedHour(hour)}
                    className={`rounded-[10px] px-3 py-2 text-xs font-semibold ${
                      selectedHour === hour ? "bg-[#5856D6] text-white" : "border border-[#E5E5EA] bg-white text-[#5856D6]"
                    }`}
                  >
                    {hour}시
                  </button>
                ))}
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {minuteOptions.map((minute) => (
                  <button
                    key={minute}
                    type="button"
                    onClick={() => setSelectedMinute(minute)}
                    className={`rounded-[10px] px-3 py-2 text-xs font-semibold ${
                      selectedMinute === minute
                        ? "bg-[#5856D6] text-white"
                        : "border border-[#E5E5EA] bg-white text-[#5856D6]"
                    }`}
                  >
                    {minute}분
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => setIsPopupOpen(false)}
              className="flex-1 rounded-[12px] border border-[#E5E5EA] bg-white px-3 py-2 text-xs font-semibold text-[#5856D6]"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 rounded-[12px] bg-[#5856D6] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#4C4ACB]"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
};

export const DateVoteAfter: React.FC<{ vote: Vote; onRevote: () => void }> = ({ vote, onRevote }) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const selectedOption = vote.options.find((option) => option.id === selectedOptionId);

  return (
    <div className="mt-4 rounded-[20px] border border-[#E5E5EA] bg-white p-4">
      <div className="mt-2 flex flex-col gap-2">
        {vote.options.map((option) => (
          <div
            key={option.id}
          className={`flex items-center justify-between rounded-xl border px-4 py-2 text-xs font-medium ${
            option.voted ? "border-[#5856D6] bg-[#EAE9FF] text-[#1C1C1E]" : "border-[#E5E5EA] bg-white text-[#1C1C1E]"
          }`}
          >
            <span>{option.label}</span>
            <button
              type="button"
              className="bg-transparent text-[11px] font-semibold text-[#5856D6]"
              onClick={() => setSelectedOptionId(option.id)}
            >
              {option.count}명
            </button>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <button
          type="button"
          onClick={onRevote}
          className="w-full rounded-[16px] border border-[#E5E5EA] bg-white px-5 py-2 text-xs font-semibold text-[#5856D6] transition hover:border-[#C7C7CC]"
        >
          다시 투표하기
        </button>
      </div>
      {selectedOption && (
        <VotedMemberList selectedItem={{ memberList: selectedOption.memberList ?? [] }} closePopup={() => setSelectedOptionId(null)} />
      )}
    </div>
  );
};

export const DateVoteComplete: React.FC<{ vote: Vote }> = ({ vote }) => (
  <div className="mt-4 rounded-[20px] border border-[#E5E5EA] bg-[#F9F9FB] p-4">
    <OptionResults options={vote.options} highlightVoted />
  </div>
);
