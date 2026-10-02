# Tower Defense Library Asset Mapping

Generated from the project's recovered Library/conversation asset inventory.

## Runtime mapping
- maps/grassland: 화려한 판타지 타워 디펜스 계곡 -> stage1-background.webp
- heroes: 판타지 영웅 4종 스프라이트 아틀라스 -> ranger/knight/wizard/dwarf hero pool
- towers/archer: 판타지 궁수 감시탑 스프라이트 시트
- towers/mage: 마법사와 수정탑 애니메이션 스프라이트 시트
- towers/artillery: 판타지 대포 터렛 애니메이션 스프라이트 시트
- towers/barracks: 중세 판타지 병영 요새 타워 + 판타지 요새 훈련 병영
- units: 중세 기사 애니메이션 스프라이트 시트 + 판타지 전사 부대 라인업
- enemies/goblin: 고블린 전사의 전투 애니메이션 스프라이트 시트
- enemies/flying: 보라 박쥐와 석상 가고일 스프라이트 시트
- bosses: 판타지 보스 몬스터 네 종 세트 + 보랏빛 리치와 서리 거인 + 화산암 골렘
- projectiles: 판타지 투사체 아이콘 4종 세트 + 판타지 투사체 아이콘 네 가지
- vfx: 판타지 스킬 이펙트 / 화려한 판타지 VFX / 마법 효과 / 독·빙결·성스러운 효과
- environment: 길 타일 / 환경 소품 / 이소메트릭 환경 / 나무·효과
- ui: HUD / UI sprite / RPG UI / 장비 / 타워디펜스 아이콘 / 검과 마법 아이콘
- world: 판타지 월드맵 / 모험 지도 / 평화로운 판타지 계곡
- interiors: 무기고 / 지도 서재 / 왕립 도서관

## Stage maps
1. Grassland — 화려한 판타지 타워 디펜스 계곡
2. Forest — 마법의 숲 타워 디펜스 맵
3. Ice — 눈 덮인 얼음 계곡 타워 디펜스 맵
4. Desert — stylized desert map asset
5. Volcano — 용암 화산 요새로 향하는 길
6. Swamp — 안개 낀 등불의 늪지 방어 지도

## QA rule
Only clean isolated runtime crops are referenced by gameplay code. Source sheets remain preserved as source assets; contaminated neighboring fragments must never be used as runtime frames.
