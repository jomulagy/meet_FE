import React, { useState } from "react";
import type { Vote } from "../../types/vote";
import VotedMemberList from "../popUp/VotedMemberList";

const OptionResults: React.FC<{ options: Vote["options"]; highlightVoted?: boolean }> = ({ options, highlightVoted }) => (
  <div className="mt-3 flex flex-col gap-2">
    {options.map((option) => (
      <div
        key={option.id}
        className={`flex items-center justify-between rounded-xl border px-4 py-3 text-xs font-medium ${
          highlightVoted && option.voted
            ? "border-[#5856D6] bg-[#EAE9FF] text-[#1C1C1E]"
            : "border-[#E5E5EA] bg-white text-[#1C1C1E]"
        }`}
      >
        <div className="flex items-center gap-2">
          <span>{option.label}</span>
          {highlightVoted && option.voted && (
            <span className="rounded-full bg-[#EAE9FF] px-2 py-[2px] text-[10px] font-semibold text-[#4C4ACB]">
              내가 투표함
            </span>
          )}
        </div>
        <span className="text-[11px] font-semibold text-[#8E8E93]">{option.count}표</span>
      </div>
    ))}
  </div>
);

export const TextVoteBefore: React.FC<{ vote: Vote; onVote: () => void }> = ({ vote, onVote }) => (
  <div className="mt-4 rounded-[20px] border border-dashed border-[#C7C7CC] bg-[#F9F9FB] p-4">
    <div className="mt-3 flex flex-col gap-3">
      {vote.options.map((option) => (
        <label key={option.id} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-xs text-[#1C1C1E]">
          <input type="radio" name={`text-vote-${vote.id}`} className="h-4 w-4 text-[#5856D6]" />
          {option.label}
        </label>
      ))}
    </div>
    <div className="mt-4 rounded-xl bg-white px-4 py-3">
      <label className="text-[11px] font-semibold text-[#8E8E93]">텍스트 추가</label>
      <input
        type="text"
        placeholder="텍스트 입력"
        className="mt-2 w-full rounded-lg border border-[#E5E5EA] px-3 py-2 text-xs text-[#1C1C1E]"
      />
      <button
        type="button"
        className="mt-3 w-full rounded-[12px] border border-[#5856D6] px-3 py-2 text-xs font-semibold text-[#5856D6]"
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
  </div>
);

export const TextVoteAfter: React.FC<{ vote: Vote; onRevote: () => void }> = ({ vote, onRevote }) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const selectedOption = vote.options.find((option) => option.id === selectedOptionId);

  return (
    <div className="mt-4 rounded-[20px] border border-[#E5E5EA] bg-white p-4">
      <div className="mt-2 flex flex-col gap-2">
        {vote.options.map((option) => (
          <div
            key={option.id}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-xs font-medium ${
              option.voted ? "border-[#5856D6] bg-[#EAE9FF] text-[#1C1C1E]" : "border-[#E5E5EA] bg-white text-[#1C1C1E]"
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{option.label}</span>
              {option.voted && (
                <span className="rounded-full bg-[#EAE9FF] px-2 py-[2px] text-[10px] font-semibold text-[#4C4ACB]">
                  내가 투표함
                </span>
              )}
            </div>
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

export const TextVoteComplete: React.FC<{ vote: Vote }> = ({ vote }) => (
  <div className="mt-4 rounded-[20px] border border-[#E5E5EA] bg-[#F9F9FB] p-4">
    <OptionResults options={vote.options} highlightVoted />
  </div>
);
