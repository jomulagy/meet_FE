import React, { useState, useCallback, useMemo, CSSProperties, useEffect } from "react";
import axios from "axios";

interface Location {
  x: string | null;
  y: string | null;
  address: string;
  type: string;
}

interface SearchPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (location: Location) => void;
}

interface SearchResult {
  x: string | null;
  y: string | null;
  place_name: string;
  type: string;
}

const SearchPopup: React.FC<SearchPopupProps> = ({ isOpen, onClose, onSelect }) => {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);


  const rest_api_key = import.meta.env.VITE_REST_API_KEY; //REST API KEY

  // 입력이 변경될 때마다 300ms 후에 업데이트
  useEffect(() => {
    const handler = setTimeout(() => {
      handleChange(query);
    }, 300);

    return () => {
      clearTimeout(handler); // 이전 타이머를 제거 (입력이 멈출 때까지 대기)
    };
  }, [query]); // text 값이 변경될 때마다 실행됨

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleChange = useCallback(
    async (value: string) => {
      if (value) {
        try {
          const subwayResults = await fetchSubwayStations(value);
          const regionResults = await fetchRegions(value);
          
          // 중복 제거 후 합치기
          const response = Array.from(new Set([...subwayResults, ...regionResults]));

          if (response.length === 0) {
            setError("검색 결과가 없습니다. 다른 검색어를 시도해주세요.");
            setResults([]);
          } else {
            setResults(response);
            setError(null);
          }
        } catch (err) {
          setError("검색 중 문제가 발생했습니다. 다시 시도해주세요.");
        }
      } else {
        setResults([]);
        setError(null);
      }
    },
    []
  );

  const handleSelect = useCallback(
    (result: SearchResult) => {
      onSelect({
        x: result.x,
        y: result.y,
        address: result.place_name, //세부 주소 설정 시, result.address_name , 장소명 설정 시, result.place_name
        type : result.type
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
      setQuery("");
      setResults([]);
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

  // 🚇 지하철역 검색
  const fetchSubwayStations = async (keyword: string): Promise<SearchResult[]> => {
    const resultList: SearchResult[] = [];
    var is_end = false;
    for(var i = 0; i < 45; i++){
      if(!is_end){
        const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${keyword}&category_group_code=SW8&page=${i+1}`;
        const response = await axios.get(
          url,
          {
            headers: { Authorization: `KakaoAK ${rest_api_key}` },
            params: {
              query: keyword
            },
          }
        );
        resultList.push(...response.data.documents);

        is_end = response.data.meta.is_end;
      }
    }

    const filtered = resultList
    .filter((place) => place.place_name.includes(keyword))
    .map((place) => ({
      ...place,
      type: "SUB",
    }));


    return filtered;
  };

  // 📍 행정구역(구/시) 검색
  const fetchRegions = async (keyword: string): Promise<SearchResult[]> => {
    const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${keyword}`;
    const response = await axios.get<{ documents: SearchResult[] }>(
      url,
      {
        headers: { Authorization: `KakaoAK ${rest_api_key}` },
        params: {
          query: keyword
        },
      }
    );

    // 좌표로 구/시 정보 가져오기
    const regionPromises = response.data.documents.map(async (doc: any) => {
      const coordUrl = `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${doc.x}&y=${doc.y}`;
      const regionResponse = await fetch(coordUrl, {
        headers: { Authorization: `KakaoAK ${rest_api_key}` },
      });
      const regionData = await regionResponse.json();

      const region = regionData.documents[0];
      const region_2depth_name = region.region_1depth_name === "서울특별시"
        ? region.region_2depth_name // 서울이면 "구"
        : region.region_2depth_name.split(' ')[0]; // 서울이 아니면 "시"

      // SearchResult 형식으로 반환
      return {
        place_name: region.region_1depth_name + " " + region_2depth_name,
        x: null,
        y: null,
        type: "CTY"
      };
    });
    const results = await Promise.all(regionPromises);
    
    // place_name을 기준으로 중복 제거
    const uniqueResults = Array.from(
      new Map(
        results.map((result) => [
          result.place_name, // place_name을 키로 사용
          result, // 해당 항목을 값으로 사용
        ])
      ).values()
    );
    
    const filtered = uniqueResults.filter((place) =>
      place.place_name.includes(keyword)
    );

    return filtered;
  };

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
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SearchPopup;
