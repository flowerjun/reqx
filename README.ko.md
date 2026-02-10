<p align="center">
  <img src="public/icons/logo.svg" alt="ReqX" width="160" height="160" />
</p>

<h1 align="center">
  ReqX
</h1>

<p align="center">
  <strong>Exchange your requests</strong>
</p>

<p align="center">
  Chrome DevTools를 위한 올인원 개발자 도구.<br/>
  브라우저를 벗어나지 않고 HTTP 요청을 인터셉트, 모킹, 테스트, 디버깅합니다.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/manifest-v3-blueviolet" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/chrome-116%2B-green" alt="Chrome 116+" />
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" />
</p>

<p align="center">
  <a href="./README.md">English</a> · <a href="./README.ko.md">한국어</a>
</p>

---

## 왜 ReqX인가?

프론트엔드 개발을 하다 보면 이런 상황이 자주 발생합니다:

- 에러 핸들링 테스트를 위해 API 요청을 차단하거나 리다이렉트해야 할 때
- 백엔드가 아직 준비되지 않아서 서버 응답을 모킹해야 할 때
- Postman 같은 외부 도구 없이 바로 HTTP 요청을 보내고 싶을 때
- 디버깅을 위해 요청/응답 헤더를 수정해야 할 때
- 여러 도메인의 쿠키를 관리해야 할 때
- JSON 응답을 TypeScript 타입으로 변환해야 할 때

이런 작업들은 보통 여러 도구를 오가며 해야 합니다. **ReqX는 이 모든 기능을 하나의 DevTools 패널에 통합**하여, 컨텍스트 전환 없이 빠르게 작업할 수 있게 합니다.

---

## 설치 방법

### 다운로드 (권장)

1. [Releases](https://github.com/flowerjun/interceptly/releases) 페이지로 이동
2. 최신 `reqx-v*.zip` 파일 다운로드
3. 압축 해제
4. `chrome://extensions` 접속
5. 우측 상단 **개발자 모드** 활성화
6. **압축해제된 확장 프로그램을 로드합니다** 클릭
7. 압축 해제한 `dist/` 폴더 선택

### 소스에서 빌드

```bash
pnpm install
pnpm build
```

이후 위 안내대로 `chrome://extensions`에서 `dist/` 폴더를 로드합니다.

### DevTools에서 열기

1. 아무 웹사이트 접속 (예: `https://jsonplaceholder.typicode.com`)
2. DevTools 열기 (`F12` 또는 `Cmd + Option + I`)
3. 상단 탭에서 **ReqX** 클릭

---

## 기능 소개

### Interceptor - 요청 차단, 지연, 리다이렉트

<img src="images/interceptor-view.png" alt="Interceptor View" width="720" />

HTTP 요청의 동작을 제어하는 규칙을 만들 수 있습니다:

- **Block** - 서버에 요청이 도달하지 않도록 차단합니다. 오프라인 시나리오나 에러 바운더리 테스트에 유용합니다.
- **Delay** - 밀리초 단위로 인위적인 지연을 추가합니다. 느린 네트워크 시뮬레이션에 활용합니다.
- **Redirect** - 요청을 다른 URL로 리다이렉트합니다. **Preserve Path**를 켜면 매칭된 부분만 치환됩니다 (예: `dev.api.com` -> `staging.api.com`으로 바꾸면서 전체 경로와 쿼리스트링은 유지).
- **Modify Headers** - 요청/응답 헤더를 즉석에서 추가, 제거, 변경합니다.

**URL 매칭**은 `contains`, `equals`, `regex`, `wildcard` 연산자를 지원하며, HTTP 메서드로도 필터링할 수 있습니다.

개별 규칙마다 토글이 있고, 인터셉터 전체를 켜고 끄는 글로벌 스위치도 있습니다.

### API Client - DevTools에서 바로 요청 보내기

<img src="images/api-client-view.png" alt="API Client View" width="720" />

Postman과 유사한 내장 HTTP 클라이언트입니다:

- **모든 HTTP 메서드**: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
- **쿼리 파라미터**: Key-Value 에디터 + URL 붙여넣기 시 자동 감지
- **헤더**: 커스텀 요청 헤더 (개별 활성화/비활성화)
- **바디**: JSON (문법 하이라이팅), Form Data, Raw 텍스트, 바이너리 파일 업로드
- **인증**: Bearer Token, Basic Auth, API Key
- **스크립트**: Pre-request / Post-response JavaScript 실행
- **응답 뷰어**: 상태 코드, 소요 시간, 크기, 포맷된 바디, 응답 헤더

확장 프로그램의 서비스 워커를 통해 실행되므로 **CORS 제한이 없습니다**.

### Mocking - API 응답 모킹

<img src="images/mocking-view.png" alt="Mocking View" width="720" />

실제 서버 없이 커스텀 응답을 반환합니다:

<img src="images/mock-rule-editor.png" alt="Mock Rule Editor" width="720" />

- **상태 코드**, **지연 시간**, **바디 타입** (JSON / Text / HTML), **응답 헤더** 설정 가능
- 모킹 규칙은 인터셉트 규칙보다 **먼저** 평가됩니다
- Chrome DevTools Protocol을 통해 네트워크 레벨에서 동작하므로, 모든 네트워크 요청(XHR, fetch, 스크립트, 이미지)에 적용됩니다

백엔드가 준비되기 전 프론트엔드 개발이나, 특정 서버 응답을 재현할 때 유용합니다.

### Headers - 요청/응답 헤더 오버라이드

매칭되는 URL의 헤더를 자동으로 수정하는 전용 규칙을 만들 수 있습니다:

- **Set**: 헤더 값을 추가하거나 덮어쓰기
- **Remove**: 헤더를 완전히 제거
- **Append**: 기존 헤더 값에 추가
- **요청** 헤더와 **응답** 헤더 모두 지원
- 하나의 규칙에 여러 수정 항목 추가 가능

인증 토큰 주입, 디버그 헤더 추가, 쿠키 제거, 캐시 정책 설정 등에 활용합니다.

### Cookies - 브라우저 쿠키 관리

- 검색 및 도메인 필터링으로 쿠키 탐색
- **현재 탭 도메인으로 자동 필터링**하여 빠른 접근
- 쿠키 생성, 수정, 삭제
- 쿠키 플래그 표시: Secure, HttpOnly, Session, SameSite
- 특정 도메인의 쿠키 일괄 삭제

### Collections - API 요청 저장 및 관리

<img src="images/collections-view.png" alt="Collections View" width="720" />

- API Client 요청을 컬렉션(폴더)으로 저장
- **환경변수**: `{{BASE_URL}}` 같은 변수를 정의하고 Development / Staging / Production 간 전환
- **Import / Export**: JSON 파일로 컬렉션 공유

### Type Extractor - JSON to TypeScript 변환

<img src="images/type-extractor-view.png" alt="Type Extractor View" width="720" />

JSON을 붙여넣으면 TypeScript 인터페이스를 즉시 생성합니다:

- 입력하는 대로 실시간 변환
- 최상위 인터페이스 이름 커스터마이징
- 중첩 객체, 배열, 유니온 타입, nullable 필드 처리
- 원클릭 클립보드 복사
- 리사이즈 가능한 분할 패널

### Settings

<img src="images/settings-view.png" alt="Settings View" width="720" />

- **테마**: Light, Dark, System (OS 설정에 따라 자동 전환)
- **페이지 오버레이**: 규칙이 활성화되었을 때 페이지 내 오버레이 표시/숨기기
- **Export / Import**: 모든 규칙, 컬렉션, 설정을 백업하고 복원

### 실시간 알림

규칙이 활성화되어 있을 때, ReqX가 현재 상태를 알려줍니다:

- **활성 표시**: 규칙 목록에서 활성화된 각 규칙 옆에 펄스 점이 표시됩니다
- **페이지 오버레이**: 각 활성 기능(Interceptor, Mocking, Headers)별 독립 배지와 규칙 매칭 시 토스트 알림
- **브라우저 뱃지**: 확장 프로그램 아이콘에 활성화된 기능 수가 표시됩니다
- **DevTools 헤더**: 기능이 활성화되면 패널 헤더에 경고 인디케이터 표시

---

## 라이선스

이 프로젝트는 [MIT 라이선스](./LICENSE)로 배포됩니다.

---

<p align="center">
  Made by <a href="https://github.com/flowerjun">flowerjun</a>
</p>
