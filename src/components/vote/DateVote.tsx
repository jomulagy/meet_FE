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
  const [errorMessage, setErrorMessage] = useState<string>("");

  const resetSelections = () => {
    setSelectedYear("");
    setSelectedMonth("");
    setSelectedDay("");
    setSelectedPeriod("오전");
    setSelectedHour("");
    setSelectedMinute("");
    setErrorMessage("");
  };

  const handleConfirm = () => {
    if (!selectedYear || !selectedMonth || !selectedDay || !selectedHour || !selectedMinute) {
      setErrorMessage("날짜와 시간을 모두 선택해주세요.");
      return;
    }

    const yearNum = Number(selectedYear);
    const monthNum = Number(selectedMonth);
    const dayNum = Number(selectedDay);
    const maxDay = new Date(yearNum, monthNum, 0).getDate();

    if (dayNum > maxDay) {
      setErrorMessage("해당 월에 없는 날짜입니다. 다시 선택해주세요.");
      return;
    }

    const month = selectedMonth.padStart(2, "0");
    const day = selectedDay.padStart(2, "0");
    const hourNumber = Number(selectedHour);
    const hour24 = selectedPeriod === "오후" ? ((hourNumber % 12) + 12).toString().padStart(2, "0") : (hourNumber % 12).toString().padStart(2, "0");
    onAddOption(`${selectedYear}.${month}.${day} ${hour24}:${selectedMinute}`);
    resetSelections();
    setIsPopupOpen(false);
  };

  const today = new Date();
  const yearOptions = [String(today.getFullYear()), String(today.getFullYear() + 1)];
  const monthOptions = Array.from({ length: 12 }, (_, index) => String(index + 1));
  const dayOptions = Array.from({ length: 31 }, (_, index) => String(index + 1));
  const hourOptions = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));
  const minuteOptions = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, "0"));
  const renderPickerColumn = <T extends string>(
    items: T[],
    selected: T,
    onSelect: (value: T) => void,
    { allowWrap = true }: { allowWrap?: boolean } = {},
  ) => {
    const selectedIndex = Math.max(0, items.indexOf(selected === "" ? items[0] : selected));
    const getNeighbor = (direction: 1 | -1) => {
      if (allowWrap) {
        return items[(selectedIndex + direction + items.length) % items.length];
      }
      const nextIndex = selectedIndex + direction;
      if (nextIndex < 0 || nextIndex >= items.length) return "" as T;
      return items[nextIndex];
    };

    const current = items[selectedIndex];
    const prev = getNeighbor(-1);
    const next = getNeighbor(1);

    const moveSelection = (direction: 1 | -1) => {
      let newIndex = selectedIndex + direction;
      if (allowWrap) {
        newIndex = (newIndex + items.length) % items.length;
      } else {
        newIndex = Math.min(items.length - 1, Math.max(0, newIndex));
      }
      onSelect(items[newIndex]);
    };

    let touchStartY: number | null = null;

    return (
      <div
        className="flex h-40 w-16 flex-col items-center justify-center text-center text-xs font-semibold text-[#5856D6]"
        onWheel={(event) => {
          event.preventDefault();
          moveSelection(event.deltaY > 0 ? 1 : -1);
        }}
        onTouchStart={(event) => {
          touchStartY = event.touches[0].clientY;
        }}
        onTouchEnd={(event) => {
          if (touchStartY === null) return;
          const deltaY = event.changedTouches[0].clientY - touchStartY;
          if (Math.abs(deltaY) > 10) {
            moveSelection(deltaY > 0 ? -1 : 1);
          }
          touchStartY = null;
        }}
      >
        <button
          type="button"
          className="w-full bg-transparent py-2 text-[#5856D6]"
          onClick={() => moveSelection(-1)}
        >
          <span className="block h-5 leading-5">{prev || ""}</span>
        </button>
        <div className="h-px w-full bg-[#5856D6]" />
        <div className="w-full py-2 text-sm font-bold text-[#5856D6]">
          <span className="block h-6 leading-6">{current}</span>
        </div>
        <div className="h-px w-full bg-[#5856D6]" />
        <button
          type="button"
          className="w-full bg-transparent py-2 text-[#5856D6]"
          onClick={() => moveSelection(1)}
        >
          <span className="block h-5 leading-5">{next || ""}</span>
        </button>
      </div>
    );
  };

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
          onClick={() => {
            setSelectedYear(yearOptions[0]);
            setSelectedMonth(monthOptions[0]);
            setSelectedDay(dayOptions[0]);
            setSelectedPeriod("오전");
            setSelectedHour(hourOptions[0]);
            setSelectedMinute(minuteOptions[0]);
            setErrorMessage("");
            setIsPopupOpen(true);
          }}
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#5856D6]/20 px-4"
          onClick={() => {
            resetSelections();
            setIsPopupOpen(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-[20px] bg-white p-5 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-[#8E8E93]">날짜</span>
                <div className="flex items-center justify-center gap-3">
                  {renderPickerColumn(yearOptions, selectedYear || yearOptions[0], setSelectedYear, { allowWrap: false })}
                  {renderPickerColumn(monthOptions, selectedMonth || monthOptions[0], setSelectedMonth)}
                  {renderPickerColumn(dayOptions, selectedDay || dayOptions[0], setSelectedDay)}
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-[#8E8E93]">시간</span>
                <div className="flex items-center justify-center gap-3">
                  {renderPickerColumn(["오전", "오후"] as const, selectedPeriod, setSelectedPeriod, { allowWrap: false })}
                  {renderPickerColumn(hourOptions, selectedHour || hourOptions[0], setSelectedHour)}
                  {renderPickerColumn(minuteOptions, selectedMinute || minuteOptions[0], setSelectedMinute)}
                </div>
              </div>
            </div>
            {errorMessage && <p className="mt-3 text-[11px] font-semibold text-[#FF3B30]">{errorMessage}</p>}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  resetSelections();
                  setIsPopupOpen(false);
                }}
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
