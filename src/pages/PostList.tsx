import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { server } from "@/utils/axios";
import FooterNav from "../components/FooterNav";
import { Post } from "@/types/Post";

const TYPE_ORDER = ["회식", "여행", "투표", "공지"];

const PostList: React.FC = () => {
  const [postList, setPostList] = useState<Post[]>([]);
  const [selectedType, setSelectedType] = useState<string>(TYPE_ORDER[0]);
  const navigate = useNavigate();
  const filteredPosts = useMemo(
    () => postList.filter((post) => post.type === selectedType),
    [postList, selectedType]
  );

  useEffect(() => {
    const fetchMeetList = async () => {
      server
        .get(`/post/list`)
        .then((response) => {
          setPostList(response.data);
        })
        .catch((error) => {
          console.error(error);
          navigate("/not-found");
        });
    };

    fetchMeetList();
  }, [navigate]);

  useEffect(() => {
    if (postList.length === 0) {
      setSelectedType(TYPE_ORDER[0]);
      return;
    }

    const firstAvailableType = TYPE_ORDER.find((type) =>
      postList.some((post) => post.type === type)
    );

    const hasPostsForSelectedType = postList.some(
      (post) => post.type === selectedType
    );

    if (!hasPostsForSelectedType && firstAvailableType) {
      setSelectedType(firstAvailableType);
    }
  }, [postList, selectedType]);

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ backgroundColor: "#F2F2F7", paddingBottom: "80px" }}
    >
      <main className="flex-1 px-6 pt-8 pb-8">
        <section className="mb-6 flex flex-col gap-1 text-[#1C1C1E]">
          <h1 className="text-[20px] font-bold">모임 목록</h1>
          <p className="text-[12px] text-[#8E8E93]">
            참여 가능한 모임을 확인하고 원하는 모임을 선택하세요.
          </p>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between text-[#8E8E93]">
            <span className="text-[12px] font-medium">총 {postList.length}개</span>
            <span className="text-[12px] font-medium">최신순</span>
          </div>
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
            {TYPE_ORDER.map((type) => {
              const isActive = selectedType === type;

              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`whitespace-nowrap rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ${
                    isActive
                      ? "border-[#5856D6] bg-[#5856D6] text-white"
                      : "border-[#E5E5EA] bg-white text-[#8E8E93] hover:border-[#C7C7CC] hover:text-[#1C1C1E]"
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>

          {filteredPosts.length > 0 ? (
            <ul className="flex flex-col gap-4">
              {filteredPosts.map((post) => (
                <li key={post.id}>
                  <Link
                    to={`/post/${post.id}`}
                    className="group flex w-full items-center justify-between gap-4 rounded-[22px] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(26,26,26,0.08)] transition-all duration-200 hover:shadow-[0_12px_30px_rgba(26,26,26,0.12)]"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-[#E1F0FF] py-[2px] text-[11px] font-semibold text-[#1E3A8A]">
                            {post.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-[15px] font-semibold text-[#1C1C1E] group-hover:text-[#5856D6]">
                            {post.title}
                          </h3>
                        </div>
                      </div>
                    </div>
                    <i className="fa-solid fa-chevron-right text-[18px] text-[#AEAEB2] transition-colors group-hover:text-[#5856D6]"></i>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-[22px] bg-white px-6 py-10 text-center text-[#8E8E93] shadow-inner">
              <i className="fa-regular fa-calendar-plus mb-3 text-4xl"></i>
              <p className="text-[14px] font-medium">아직 참여 가능한 모임이 없어요.</p>
              <p className="mt-1 text-[12px] text-[#AEAEB2]">
                새롭게 등록되는 모임을 기다려주세요!
              </p>
            </div>
          )}
        </section>
      </main>

      <FooterNav />
    </div>
  );
};

export default PostList;
