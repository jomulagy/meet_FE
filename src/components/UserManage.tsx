import React, { useState } from "react";
import { server } from "@/utils/axios";

const UserManage = ({
  user,
  handlePermissionChange,
}: {
  user: any;
  handlePermissionChange: (
    memberId: string,
    currentPrivilege: string,
    uuid: string,
    isFirst: string
  ) => void;
}) => {
  const [deposit, setDeposit] = useState<string | "">(user.deposit);

  const isDepositComplete = deposit === "true";
  const isPrivilegeDenied = user.previllege === "deny";

  const depositButtonClasses = isDepositComplete
    ? "bg-[#E7F8ED] border border-[#A7E5C5] text-[#0F5132] hover:bg-[#D4F3DF]"
    : "bg-[#FFF3F3] border border-[#FECACA] text-[#B91C1C] hover:bg-[#FFE4E6]";

  const privilegeButtonClasses = isPrivilegeDenied
    ? "bg-[#E3EEFF] border border-[#C3DAFF] text-[#1E3A8A] hover:bg-[#D6E6FF]"
    : "bg-[#FFECEC] border border-[#FECACA] text-[#B91C1C] hover:bg-[#FFDADA]";

  const handleDepositChange = (
    memberId: string,
    currentDeposit: string
  ) => {
    var option = "false";
    if(currentDeposit === "false"){
      option = "true";
    }
    console.log(currentDeposit,option)
  
    server.put("/member/deposit", {
      data: {
        memberId : memberId,
        option : option
      }
    })
    .then((response) => {
      setDeposit(response.data.deposit)
    })
    .catch((error) => {
      if (error.code === "401"){
        console.error(error.message);
      }
      else if (error.code === "403"){
        console.error(error.message);
      }
    });
  }

  return (
    <li key={user.id} className="mb-3">
      <div
        className="flex flex-col gap-3 rounded-[20px] bg-white p-4 shadow-[1px_1px_10px_0_rgba(0,0,0,0.05)] sm:flex-row sm:items-center sm:gap-4"
      >
        <div className="flex min-w-0 flex-1 flex-col items-start">
          <span className="text-15px font-bold text-black">{user.name}</span>
          <span className="mt-1 w-full break-all text-[11px] text-[#AEAEB2] sm:text-xs">{user.email}</span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <button
            onClick={() =>
              handleDepositChange(
                user.id,
                deposit,
              )
            }
            className={`whitespace-nowrap rounded-[24px] px-4 py-2 text-[12px] font-bold transition-colors sm:min-w-[92px] ${depositButtonClasses}`}
          >
            {deposit === "true" ? "입금완료" : "미입금"}
          </button>
          <button
            onClick={() =>
              handlePermissionChange(
                user.id,
                user.previllege,
                user.uuid,
                user.isFirst
              )
            }
            className={`whitespace-nowrap rounded-[24px] px-4 py-2 text-[12px] font-bold transition-colors sm:min-w-[92px] ${privilegeButtonClasses}`}
          >
            {user.previllege === "deny" ? "허용" : "차단"}
          </button>
        </div>
      </div>
    </li>
  );
};

export default UserManage;
