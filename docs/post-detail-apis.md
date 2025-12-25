# PostDetail 화면 API 사양

PostDetail 페이지에서 사용하는 데이터 모델과 필요한 API를 정리했습니다. 각 엔드포인트는 `postId` 기반으로 동작하며, 응답 예시는 화면에 하드코딩된 값과 동일한 필드 구성을 따릅니다.

## 공통 모델

### PostDetail
```json
{
  "id": "post-1",
  "title": "팀 빌딩 회의 일정 잡기",
  "content": "이번 주 금요일까지 가능한 시간과 장소를 투표해주세요.",
  "authorName": "지민",
  "createdAt": "2024-05-20 14:30",
  "isAuthor": true
}
```
- 화면에서 게시물 본문, 작성자 여부 판단에 사용. 필드는 `PostDetail` 타입과 동일합니다.

### Vote
`src/types/vote.ts`에서 사용하는 구조입니다.
```json
{
  "id": "vote-1",
  "title": "회의 날짜 투표",
  "type": "date",         // date | place | text
  "activeYn": "Y",        // 진행 여부
  "status": "before",     // before | after | complete
  "deadline": "2024-05-24 18:00", // 선택 사항
  "allowDuplicate": true,   // 중복 선택 허용 여부
  "options": [
    {
      "id": "d1",
      "label": "5/25(토)",
      "count": 4,
      "voted": false,
      "memberList": [{ "name": "지민" }, { "name": "서연" }]
    }
  ]
}
```
- `status`는 화면 상태(투표 전/후/완료)를 결정하고, `activeYn`은 투표 종료 여부를 표시합니다.

### ParticipationVote (참여 여부 투표)
```json
{
  "id": "participation-1",
  "activeYn": "Y",
  "hasVoted": false,
  "yesCount": 0,
  "noCount": 0,
  "participantCount": 0,
  "yesMembers": [{ "name": "지민" }],
  "noMembers": [{ "name": "현수" }]
}
```
- 투표 종료 시 `participantCount`는 `yesCount`로 업데이트됩니다.

## 엔드포인트

### 1) 게시글 상세 조회
- `GET /posts/{postId}`
- Response: `PostDetail`
- 용도: 상단 게시글 카드 렌더링.

### 2) 게시글별 투표 목록 조회
- `GET /posts/{postId}/votes`
- Response: `Vote[]`
- 용도: 화면 초기 로딩 시 모든 투표 카드 렌더링.

### 3) 투표 생성
- `POST /posts/{postId}/votes`
- Request Body:
```json
{
  "title": "회의 장소 투표",
  "type": "place",
  "deadline": "2024-05-24 20:00",
  "allowDuplicate": false
}
```
- Response: 생성된 `Vote` 객체(초기 `options`는 빈 배열, `activeYn`="Y", `status`="before").
- 용도: "투표 추가" 모달 저장 시 호출.

### 4) 투표 옵션 추가
- `POST /posts/{postId}/votes/{voteId}/options`
- Request Body:
```json
{ "label": "온라인" }
```
- Response: 추가된 옵션이 포함된 `Vote` 객체.
- 용도: 투표 생성/수정 시 새로운 선택지를 붙일 때 사용.

### 5) 투표 참여
- `POST /posts/{postId}/votes/{voteId}/ballots`
- Request Body:
```json
{
  "optionIds": ["d1", "d3"],
  "allowDuplicate": true
}
```
- Response: 갱신된 `Vote` 객체(선택된 옵션의 `count` 증가, 해당 옵션의 `voted` true, `status`="after").
- 비고: `allowDuplicate=false`인 경우 `optionIds`는 길이 1.

### 6) 투표 재참여(초기화)
- `PATCH /posts/{postId}/votes/{voteId}/status`
- Request Body:
```json
{ "status": "before" }
```
- Response: `Vote` 객체(`status`를 `before`로 되돌리고, 클라이언트는 이전 선택지를 다시 표시).
- 용도: "재투표" 클릭 시 서버에서 상태 리셋.

### 7) 투표 종료
- `PATCH /posts/{postId}/votes/{voteId}/status`
- Request Body:
```json
{ "status": "complete", "activeYn": "N" }
```
- Response: `Vote` 객체(`activeYn`="N", `status`="complete").
- 용도: 개별 "투표 종료" 버튼 처리.

### 8) 전체 투표 종료 후 참여 여부 투표 생성
- `POST /posts/{postId}/participation`
- Request Body: `{}` (본문 없음)
- Response: 새 `ParticipationVote` (`activeYn`="Y", 카운트 0 초기화).
- 용도: "투표 종료" 후 참여 여부 투표를 만들 때.

### 9) 참여 여부 투표 조회
- `GET /posts/{postId}/participation`
- Response: `ParticipationVote` 또는 `null`(없을 경우).
- 용도: 모든 투표가 닫힌 뒤 참여 여부 카드 렌더링.

### 10) 참여 여부 투표 참여/변경
- `POST /posts/{postId}/participation/ballot`
- Request Body:
```json
{ "choice": "yes" } // yes | no
```
- Response: 갱신된 `ParticipationVote` (`hasVoted` true, 카운트 및 멤버 리스트 업데이트).
- 비고: 이미 투표한 경우 기존 선택을 취소하고 새 선택으로 반영.

### 11) 참여 여부 투표 종료
- `PATCH /posts/{postId}/participation/status`
- Request Body:
```json
{ "activeYn": "N", "participantCount": 12 }
```
- Response: 종료 상태의 `ParticipationVote` (`participantCount`는 최종 `yesCount`).
- 용도: "투표 종료" 클릭 시 참여자 명단 표시를 위해 사용.
