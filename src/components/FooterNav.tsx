import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const FooterNav: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("");

  const handleTabClick = (tab: string, path: string) => {
    setActiveTab(tab);
    navigate(path);
  };

  return (
    <footer 
      className="w-full h-[73px] bg-white flex justify-around items-center border-t border-[#E5E5EA]"
      style={{ position: "fixed", bottom: 0, zIndex: 20 }}
    >
      <div 
        className={`flex flex-col items-center cursor-pointer ${
          activeTab === "list" ? "text-black" : "text-[#AEAEB2]"
        }`}
        onClick={() => handleTabClick("list", "/meet")}
      >
        <i className="fa-solid fa-bars text-[24px] mb-1"></i>
        <span className="text-[10px]">LIST</span>
      </div>
      <div 
        className={`flex flex-col items-center cursor-pointer ${
          activeTab === "home" ? "text-black" : "text-[#AEAEB2]"
        }`}
        onClick={() => handleTabClick("home", "/")}
      >
        <i className="fa-solid fa-house text-[24px] mb-1"></i>
        <span className="text-[10px]">HOME</span>
      </div>
      <div 
        className={`flex flex-col items-center cursor-pointer ${
          activeTab === "my" ? "text-black" : "text-[#AEAEB2]"
        }`}
        onClick={() => setActiveTab("my")}
      >
        <i className="fa-solid fa-user text-[24px] mb-1"></i>
        <span className="text-[10px]">ADMIN</span>
      </div>
    </footer>
  );
};

export default FooterNav;
