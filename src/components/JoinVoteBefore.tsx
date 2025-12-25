import { voteItem } from "@/types/JoinVote";
import React, { useState } from "react";
import { server } from "@/utils/axios";
import { useNavigate } from "react-router-dom";

// 투표 전 컴포넌트
const JoinVoteBefore = ({
  meetId,
  setIsVoted,
  setVotedItem,
  itemList
}: {
  meetId: string;
  setIsVoted: React.Dispatch<React.SetStateAction<boolean>>;
  setVotedItem: React.Dispatch<React.SetStateAction<string>>;
  itemList: voteItem[]
}) => {
  const [participateId, setParticipateId] = useState<string>("");
  const navigate = useNavigate();
  const handleVote = () => {
    if (participateId) {
      server.put("/meet/participate", {
        data: {
          meetId: meetId,
          participateVoteItemIdList: [participateId]
        },
      })
      .then(() => {
        setIsVoted(true);
        setVotedItem(participateId);
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
    <div className="space-y-4">
      <div className="w-full bg-white p-6 rounded-[24px] space-y-3">
        {itemList.map((item) => (
          <label
            key={item.id}
            className="flex items-center justify-between rounded-[12px] border border-[#E5E5EA] px-4 py-4 text-lg"
          >
            <div className="flex items-center gap-3">
              <input
                id={item.id}
                type="radio"
                name="vote"
                value={item.name}
                checked={participateId === item.id}
                onChange={(e) => setParticipateId(e.target.id)}
                className="h-5 w-5"
              />
              <span className="font-semibold text-[#1C1C1E]">{item.name}</span>
            </div>
            <span className="text-[13px] font-medium text-[#8E8E93]">선택</span>
          </label>
        ))}
      </div>
      <button
        className="bg-[#FFE607] p-3 rounded-[24px] text-lg w-full font-bold"
        onClick={handleVote}
      >
        투표하기
      </button>
    </div>
  );
};

export default JoinVoteBefore;
