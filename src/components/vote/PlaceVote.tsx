import React from "react";
import type { Vote } from "../../types/vote";

const OptionResults: React.FC<{ options: Vote["options"]; highlightVoted?: boolean }> = ({ options, highlightVoted }) => (
  <div className="mt-3 flex flex-col gap-2">
    {options.map((option) => (
      <div
        key={option.id}
        className={`flex items-center justify-between rounded-xl border px-4 py-3 text-xs font-medium sm:text-sm ${
          highlightVoted && option.voted
            ? "border-[#5856D6] bg-[#EAE9FF] text-[#1C1C1E]"
            : "border-[#E5E5EA] bg-white text-[#1C1C1E]"
        }`}
      >
        <span>{option.label}</span>
        <span className="text-[11px] font-semibold text-[#8E8E93] sm:text-xs">{option.count}표</span>
      </div>
    ))}
  </div>
);

export const PlaceVoteBefore: React.FC<{ vote: Vote; onVote: () => void }> = ({ vote, onVote }) => (
  <div className="mt-4 rounded-[20px] border border-dashed border-[#C7C7CC] bg-[#F9F9FB] p-4">
    <p className="text-xs font-semibold text-[#4C4ACB]">투표 전</p>
    <div className="mt-3 flex flex-col gap-3">
      {vote.options.map((option) => (
        <label key={option.id} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-xs text-[#1C1C1E] sm:text-sm">
          <input type="radio" name={`place-vote-${vote.id}`} className="h-4 w-4 text-[#5856D6]" />
          {option.label}
        </label>
      ))}
    </div>
    <button
      type="button"
      onClick={onVote}
      className="mt-4 w-full rounded-[16px] bg-[#5856D6] px-5 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#4C4ACB] sm:text-sm"
    >
      투표하기
    </button>
  </div>
);

export const PlaceVoteAfter: React.FC<{ vote: Vote; onRevote: () => void; onComplete: () => void }> = ({
  vote,
  onRevote,
  onComplete,
}) => (
  <div className="mt-4 rounded-[20px] border border-[#E5E5EA] bg-white p-4">
    <p className="text-xs font-semibold text-[#1C1C1E]">투표 후</p>
    <OptionResults options={vote.options} highlightVoted />
    <div className="mt-4 grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={onRevote}
        className="w-full rounded-[16px] border border-[#E5E5EA] bg-white px-5 py-2 text-xs font-semibold text-[#1C1C1E] transition hover:border-[#C7C7CC] sm:text-sm"
      >
        다시 투표하기
      </button>
      <button
        type="button"
        onClick={onComplete}
        className="w-full rounded-[16px] bg-[#5856D6] px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#4C4ACB] sm:text-sm"
      >
        투표하기
      </button>
    </div>
  </div>
);

export const PlaceVoteComplete: React.FC<{ vote: Vote }> = ({ vote }) => (
  <div className="mt-4 rounded-[20px] border border-[#E5E5EA] bg-[#F9F9FB] p-4">
    <p className="text-xs font-semibold text-[#4C4ACB]">투표 완료</p>
    <OptionResults options={vote.options} highlightVoted />
  </div>
);
