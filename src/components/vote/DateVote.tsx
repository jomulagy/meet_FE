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
  const [isAdding, setIsAdding] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [newOption, setNewOption] = useState("");

  const handleAdd = () => {
    if (!newOption) return;
    const formatted = newOption.replace("T", " ");
    onAddOption(formatted);
    setNewOption("");
    setIsAdding(false);
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
    <div className="mt-4 space-y-2">
      {!isAdding ? (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="w-full rounded-[12px] bg-[#EAE9FF] px-3 py-2 text-xs font-semibold text-[#5856D6]"
        >
          항목 추가하기
        </button>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setIsPopupOpen(true)}
            className="w-full rounded-[12px] bg-[#EAE9FF] px-3 py-2 text-xs font-semibold text-[#5856D6]"
          >
            {newOption ? newOption.replace("T", " ") : "날짜와 시간 선택"}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              className="flex-1 rounded-[12px] bg-[#5856D6] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#4C4ACB]"
            >
              추가하기
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewOption("");
              }}
              className="flex-1 rounded-[12px] border border-[#E5E5EA] bg-white px-3 py-2 text-xs font-semibold text-[#5856D6] transition hover:border-[#C7C7CC]"
            >
              취소
            </button>
          </div>
        </div>
      )}
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
          <h4 className="text-sm font-semibold text-[#1C1C1E]">날짜와 시간 선택</h4>
          <input
            type="datetime-local"
            value={newOption}
            onChange={(event) => setNewOption(event.target.value)}
            inputMode="numeric"
            className="mt-3 w-full rounded-lg border border-[#E5E5EA] bg-[#F9F9FB] px-3 py-2 text-sm font-semibold text-[#4C4ACB] focus:border-[#FFE607] focus:outline-none"
          />
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setIsPopupOpen(false)}
              className="flex-1 rounded-[12px] border border-[#E5E5EA] bg-white px-3 py-2 text-xs font-semibold text-[#5856D6]"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={() => setIsPopupOpen(false)}
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
              className="text-[11px] font-semibold text-[#5856D6]"
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
