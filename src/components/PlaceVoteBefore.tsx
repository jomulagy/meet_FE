import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { server } from "@/utils/axios";
import { Place } from "@/types/PlaceVote";
import SearchPopup from "./popUp/PlaceSearch"; // 팝업 컴포넌트

type PlaceVoteBeforeProps = {
  meetId: string;//모임 Id
  placeList: Place[];
  setIsVoted: (value: boolean) => void;
  fetchPlaceVoteItems: () => void;
  handlePlaceChange: (placeIds: string[]) => void;
  selectedPlaceIds: string[];//선택된 장소 리스트
};

const PlaceVoteBefore = ({
  meetId,
  placeList,
  handlePlaceChange,
  selectedPlaceIds,
}: PlaceVoteBeforeProps) => {
  const [places, setPlaces] = useState<Place[]>(placeList);
  const [newPlace, setNewPlace] = useState<string>("");
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false); // 팝업 상태
  const navigate = useNavigate();

  useEffect(() => {
    setPlaces(placeList);
  }, [placeList]);

  const handleNewPlaceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewPlace(event.target.value);
  };

  const handleAddPlace = async () => {
    server
      .post(`/meet/place/item`, {
        data: {
          meetId: meetId,//모임Id
          place: newPlace,//입력된 장소명
        },
      })
      .then((response) => {
        const newPlaceItem: Place = {
          id: response.data.id,
          place: response.data.place,
          editable: response.data.editable,
          isVote: response.data.isVote,
          memberList: response.data.memberList,
        };

        setPlaces((prevPlaces) => [...prevPlaces, newPlaceItem]);
        setNewPlace("");
        setIsAdding(false);
      })
      .catch((error) => {
        if (error.code === "403") {
          navigate("/Unauthorized");
        } else if (error.code === "404") {
          navigate("/not-found");
        }
      });
  };

  const handleRemovePlace = (id: string) => {
    server
      .delete(`/meet/place/item?placeVoteItemId=${id}`)
      .then(() => {
        setPlaces((prevList) => prevList.filter((place) => place.id !== id));
      })
      .catch((error) => {
        if (error.code === "403") {
          navigate("/Unauthorized");
        } else if (error.code === "404") {
          navigate("/not-found");
        }
      });
  };

  const handleCheckboxChange = (id: string, checked: boolean) => {
    const updatedList = checked
      ? [...selectedPlaceIds, id]
      : selectedPlaceIds.filter((itemId) => itemId !== id);

    handlePlaceChange(updatedList);
  };

  const handlePopupSelect = (location: { x: string | null; y: string | null; address: string }) => {
    server
      .post(`/meet/place/item`, {
        data: {
          meetId: meetId,
          place: {
            name: location.address,  // API 문서에 맞게 'name' 사용
            xPos: location.x,        // 'xPos' 사용
            yPos: location.y         // 'yPos' 사용
          },
        },
      })
      .then((response) => {
        const newPlaceItem: Place = {
          id: response.data.id,
          place: location.address,  // 'place'는 여전히 장소 주소 사용
          editable: "true",
          isVote: "false",
          memberList: [],
        };
  
        // 새로운 장소 리스트에 추가
        setPlaces((prevPlaces) => [...prevPlaces, newPlaceItem]);
  
        // 부모 컴포넌트로 선택된 장소 id와 name 전달
        handlePlaceChange([...selectedPlaceIds, newPlaceItem.id]);
  
        // 팝업 닫기
        setIsPopupOpen(false);
      })
      .catch((error) => {
        if (error.response) {
          if (error.response.status === 403) {
            navigate("/Unauthorized");
          } else if (error.response.status === 404) {
            navigate("/not-found");
          }
        } else {
          console.error("Network error or timeout", error);
        }
      });
  };
  
  

  return (
    <div className="flex flex-col h-full">
      <div className="overflow-y-auto flex-grow">
        {places.map((place) => (
          <div key={place.id} className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedPlaceIds.includes(place.id)}
                onChange={(e) => handleCheckboxChange(place.id, e.target.checked)}
              />
              <span>{place.place}</span>
            </div>
            {place.editable === "true" && (
              <button
                onClick={() => handleRemovePlace(place.id)}
                className="text-[#8E8E93] bg-transparent p-0 mr-2"
              >
                <i className="fa-regular fa-trash-can"></i>
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        {!isAdding ? (
          <div className="space-x-2">
            {/* <button
              onClick={() => setIsAdding(true)}
              className="text-[13px] text-[#8E8E93] bg-transparent p-0 mt-1"
            >
              <i className="fa-solid fa-plus"></i> 장소 추가 (입력)
            </button> */}
            <button
              onClick={() => setIsPopupOpen(true)} // 팝업 열기
              className="text-[13px] text-[#8E8E93] bg-transparent p-0 mt-1"
            >
              <i className="fa-solid fa-search"></i> 장소 추가 (검색)
            </button>
          </div>
        ) : (
          <div className="space-y-2 w-full">
            <input
              type="text"
              placeholder="장소"
              value={newPlace}
              onChange={handleNewPlaceChange}
              className="border border-[#F2F2F7] rounded-lg px-2 py-1 w-full"
            />
            <div className="flex space-x-2">
              <button
                onClick={() => setIsAdding(false)}
                className="bg-[#F2F2F7] rounded-lg px-4 py-2 text-black w-1/2"
              >
                취소
              </button>
              <button
                onClick={handleAddPlace}
                className="bg-[#F2F2F7] rounded-lg px-4 py-2 text-black w-1/2"
              >
                확인
              </button>
            </div>
          </div>
        )}
      </div>
      {/* 팝업 컴포넌트 추가 */}
      <SearchPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)} // 팝업 닫기
        onSelect={handlePopupSelect} // 장소 선택 핸들러
      />
    </div>
  );
};

export default PlaceVoteBefore;
