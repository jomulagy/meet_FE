### API REFERENCE
[http://54.180.29.36/api-reference](http://3.35.98.18/swagger-ui/index.html)

### branch 전략
1. 요구사항에 대한 issue 생성
2. issue에 해당하는 branch 생성 (settings, docs 제외)
3. main branch에 병합
4. 병합 완료 후 branch 삭제

### branch naming rule

{{label}}/#{{issue_NO}}

ex)feat/#21 : issue 21번에 대한 branch

### PR RULE

* main branch에는 동작 가능한 코드만 merge 합니다.
* code review 완료된 pr만 merge 합니다.
* PR 머지 후에 자동으로 issue가 닫히도록 설정합니다.
  * Closes #issue No

* pr ground rule
  1. pr 생성
  2. pr 링크를 카카오톡에 공유하기
  3. 변경사항 꼼꼼히 읽기
     * 변경사항 완벽하게 follow up 하고 approve 하기
     * 개선 방향에 대해서 함께 고민하기
  4. 리뷰 완료후, pr 링크에 v표시 하기
  5. pr이 merge 될 때까지 review 주기적으로 확인하기
  6. 모든 review가 resolve되면, merge하기
