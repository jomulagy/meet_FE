import React, { useState, useCallback, useMemo, CSSProperties } from "react";
import axios from "axios";

interface Location {
  x: string;
  y: string;
  address: string;
}

interface SearchPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (location: Location) => void;
}

interface SearchResult {
  x: string;
  y: string;
  place_name: string;
  category_name: string;
  address_name: string;
  road_address_name: string;
  phone: string;
  place_url: string;
  distance: string;
  category_group_code: string;
}

const SearchPopup: React.FC<SearchPopupProps> = ({ isOpen, onClose, onSelect }) => {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.trim();
      setQuery(value);//input에 값이 들어가 있어야만 

      if (value) {
        try {
          const response = await axios.get<{ documents: SearchResult[] }>(
            `https://dapi.kakao.com/v2/local/search/keyword.json`,
            {
              headers: { Authorization: `KakaoAK ${import.meta.env.VITE_REST_API_KEY}` },
              params: {
                query: value,
                radius: 1000, 
              },
            }
          );

          if (response.data.documents.length === 0) {
            // setError("검색 결과가 없습니다. 다른 검색어를 시도해주세요.");
          } else {
            setResults(response.data.documents);
            setError(null);
          }
        } catch (err) {
          console.error("API 호출 실패", err);
          setError("검색 중 문제가 발생했습니다. 다시 시도해주세요.");
        }
      } else {
        setResults([]);
      }
    },
    []
  );

  const handleSelect = useCallback(
    (result: SearchResult) => {
      onSelect({
        x: result.x,
        y: result.y,
        // address: result.address_name,
        address: result.place_name, //세부 주소 설정 시, result.address_name , 장소명 설정 시, result.place_name
      });
      onClose();
    },
    [onSelect, onClose]//onSelect와 동시에 onClose
  );

  //팝업 외부 클릭 시 닫기 처리 함수
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      //클릭한 위치가 팝업 내부가 아니라면 팝업을 닫기
      if ((e.target as HTMLElement).closest(".popup")) return;
      onClose();
    },
    [onClose]
  );

  const styles = useMemo(//디자인 설정을 위한 useMemo
    () => ({
      overlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      } as CSSProperties,
      popup: {
        backgroundColor: "#fff",
        padding: "20px",
        borderRadius: "10px",
        width: "400px", // 팝업 너비 고정
        height: "400px", // 팝업 높이 고정
        boxSizing: "border-box", // 내부 여백 포함 크기 계산
        overflow: "hidden", // 팝업 외부로 내용이 넘치지 않도록 설정
      } as CSSProperties,
      input: {
        width: "100%",
        padding: "10px",
        marginBottom: "10px",
      } as CSSProperties,
      resultList: {
        listStyleType: "none",
        padding: 0,
        margin: 0,
        maxHeight: "calc(100% - 80px)", // 입력 필드와 오류 메시지를 제외한 공간을 계산
        overflowY: "auto", // 스크롤 가능하도록 설정
      } as CSSProperties,
      resultItem: {
        padding: "10px",
        borderBottom: "1px solid #ccc",
        cursor: "pointer",
      } as CSSProperties,
      closeButton: {
        marginTop: "10px",
        padding: "10px 20px",
        backgroundColor: "#f00",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
      } as CSSProperties,
      error: {
        color: "red",
        fontSize: "0.9rem",
        marginBottom: "10px",
      } as CSSProperties,
    }),
    []
  );

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={handleOverlayClick}>
      <div style={styles.popup} className="popup">
        <input
          type="text"
          placeholder="장소를 검색하세요"
          value={query}
          onChange={handleInputChange}
          style={styles.input}
        />
        {error && <div style={styles.error}>{error}</div>}
        <ul style={styles.resultList}>
          {results.map((result, index) => (
            <li
              key={index}
              onClick={() => handleSelect(result)}
              style={styles.resultItem}
            >
              <div><strong>장소명: </strong>{result.place_name}</div>
              <div><strong>주소: </strong>{result.address_name}</div>
              <div><strong>도로명 주소: </strong>{result.road_address_name}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SearchPopup;
