# 🔐 Google-OTP-OS-LOCK: AI-Driven SOAR & 2FA Smart Authentication Portal

An enterprise-grade, intelligent Security Orchestration, Automation, and Response (SOAR) architecture combined with a Multi-Factor Authentication (MFA/2FA) layer and 1-second high-velocity Network Management System (NMS).

 An advanced security gateway designed for autonomous threat mitigation and secure OS-level access control via Google Authenticator (OTP).

---

## 🚀 개요 (Overview)

**Google-OTP-OS-LOCK**은 강력한 2차 인증(Google OTP) 시스템과 실시간 자율 방어 인프라(SOAR)를 융합한 오픈소스 보안 관제 플랫폼입니다. 

본 프로젝트는 내부 인프라(CentOS/Windows Node) 및 Cisco ASA 방화벽 라우팅 환경을 통합 보호합니다. Splunk SIEM과 연동된 고성능 AI 추론 엔진(OpenAI GPT-4o SDK)이 실시간 위협(포트 스캐닝, DNS 무차별 대입 공격 등)을 자동 식별하고, Ansible 자율 워커를 통해 위협 대역을 즉각 격리합니다. 동시에 전용 Electron 데스크톱 클라이언트를 통해 관제 직관성을 극대화한 하이엔드 엔터프라이즈 솔루션입니다.

---

## ✨ 핵심 기능 (Key Features)

- **🔐 Google OTP 2차 인증 인프라 (Advanced 2FA Authentication)**
  - 시스템 접근 및 관리자 SOAR 통제 콘솔 진입 시 Google Authenticator 표준 시간 기반 일회용 비밀번호(TOTP) 알고리즘 적용으로 계정 탈취 원천 차단.
- **🤖 GPT-4o 기반 지능형 관제 리포트 (AI-Powered Threat Analysis)**
  - OpenAI 공식 SDK 연동 및 고도화된 프롬프트 엔지니어링 설계.
  - Cisco ASA 방화벽 Syslog 및 트래픽 패턴을 실시간 추론하여 다차원 연결 분석 보고서(한국어 마크다운 포맷) 자동 생성.
- **📊 1초 주기 SNMP 고속 텔레메트리 (1-Second High-Velocity Telemetry)**
  - 비동기 멀티스레딩(`threading`) 아키텍처를 구현하여 1초 주기 고속 SNMP 엔진과 5초 주기 Ansible Config 워커의 논리적 분리 및 성능 최적화.
  - 인터페이스별 실시간 대역폭 스트림(`ifInOctets`/`ifOutOctets`) 및 하드웨어 자원(CPU/Memory) 시각화.
  - 차트 찢어짐(Overflow) 방지를 위한 CSS Grid 및 `minmax(0, 1fr)` 유동 아키텍처 적용.
- **🛡️ 이원화 격리 객체 제어 및 CIDR 파서 (Dual-Group SOAR Engine & CIDR Parser)**
  - **자동 차단 풀(`AUTO_BLACK_LIST_SPLUNK`)**과 관리자 **수동 차단 풀(`MANUAL_BLACK_LIST_ADMIN`)**의 완전 격리 운영으로 위협 출처 추적성 보장.
  - 단일 호스트(`host`)와 IP 대역(`CIDR /24`) 문법을 자동으로 판별하고 Cisco ASA 표준 서브넷 문법으로 가공하는 `ipaddress` 자동 변환기 탑재.
- **🖥️ Electron 크로스 플랫폼 데스크톱 클라이언트 (Cross-Platform Client)**
  - 윈도우 및 크로스 플랫폼 환경에서 완벽하게 구동되는 네이티브 Electron 데스크톱 GUI 아키텍처 제공.

---

## 🛠️ 시스템 아키텍처 (Architecture)

```text
  [ Client Access ] ──> [ Google OTP 2FA Verification ] ──> [ Access Granted ]
                                       │
                                       ▼
[ Splunk Pipeline ] ──> [ Flask Backend API ] <──> [ OpenAI GPT-4o API ]
                                       │
      ┌────────────────────────────────┴────────────────────────────────┐
      ▼ (1s Interval / Multi-Thread)                                    ▼ (5s Interval / Ansible Config)
[ High-Velocity SNMP Engine ]                                     [ Dynamic Policy Controller ]
  - Hardware Health Telemetry                                       - AUTO_BLACK_LIST_SPLUNK
  - Bandwidth Oscilloscope Chart                                    - MANUAL_BLACK_LIST_ADMIN
                                       └────────────────────────────────┘