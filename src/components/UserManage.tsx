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
    <li
      key={user.id}
      className="flex flex-col mb-3"
    >
      <div 
        className=" flex justify-center items-center rounded-[20px] bg-white p-4 pl-4 pr-4"
        style={{ boxShadow: '1px 1px 10px 0 rgba(0, 0, 0, 0.05)' }}
      >
        <div className="flex-grow flex flex-col items-start">
          <span className="text-black font-bold text-15px">{user.name}</span>
          <span className="text-[#AEAEB2] text-[11px]">{user.email}</span>
        </div>
        <button
          onClick={() =>
            handleDepositChange(
              user.id,
              deposit,
            )
          }
          className="px-4 py-2 bg-white text-black font-bold border border-[#E5E5EA] rounded-[24px] text-[12px] mr-2"
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
          className="w-30 px-4 py-2 bg-white text-black font-bold border border-[#E5E5EA] rounded-[24px] text-[12px]"
        >
          {user.previllege === "deny" ? "허용" : "차단"}
        </button>
      </div>
    </li>
  );
};

export default UserManage;
