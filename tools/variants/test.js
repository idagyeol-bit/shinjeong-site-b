/* 시안 설정 — 기본 설정(tools/site.config.js)과 "다른 점만" 적는다.
   - 파일 이름이 시안 주소가 된다: tools/variants/a.js → 사이트 주소 /a/
   - 적지 않은 항목은 기본 설정 그대로다. 목록([ ])은 통째로 바뀐다.
   - 숫자와 회사 정보(사실)는 여기서 바꿀 수 없다. 시안은 한국어만 만든다.
   - 바꾼 뒤에는 node tools/build.js 로 다시 만든다(기본판과 모든 시안이 함께 만들어진다). */

module.exports = {
  label: '시험 시안',
  tokens: {
    color: {
      '--brand': '#1f7a4d',
      '--brand-hover': '#17603c',
      '--brand-tint': '#e9f4ee'
    }
  },
  home: {
    sections: [
      { id: 'trust', bg: 'white' },
      { id: 'what', bg: 'white' },
      { id: 'process', bg: 'navy' },
      { id: 'projects', bg: 'soft' },
      { id: 'scenes', bg: 'soft' },
      { id: 'company', bg: 'white' }
    ],
    copy: {
      cta: {
        title: '현장 상황을<br>알려 주세요'
      }
    }
  }
};
