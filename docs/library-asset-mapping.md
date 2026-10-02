# Library asset mapping — Excel source of truth

Source of truth: `tower_defense_game_image_assets.xlsx` → `01_전체자산목록`.

## Coverage

- Excel rows: **166**
- Mapped rows: **166 / 166 (100%)**
- Release rule: mapping alone is not “integrated”; each row is complete only after its canonical runtime file exists in GitHub and game code references it.
- Placeholder / Sprout-Man assets are not valid release assets.
- Sprite sheets require contamination-free frame extraction, fixed anchor, safety padding and 3/4 top-down scale.

## Canonical mapping by row range

| Excel rows | Category | Library source assets | Runtime namespace |
|---|---|---|---|
| 1–8 | maps | 화려한 판타지 타워 디펜스 계곡; 마법의 숲 타워 디펜스 맵; 눈 덮인 얼음 계곡 타워 디펜스 맵; 사막 협곡의 판타지 타워 디펜스 맵; 용암 화산 요새로 향하는 길; 안개 낀 등불의 늪지 방어 지도; 판타지 타워 디펜스 길 타일 세트; 세 가지 타워 디펜스 건설 패드 | assets/maps, assets/tiles |
| 9–34 | towers | 판타지 궁수 감시탑 업그레이드 세트; 판타지 요새 훈련 병영; 화려한 수정 마법사 탑 요새; 스팀펑크 대포탑 업그레이드 라인업; 판타지 타워 디펜스 요새 컬렉션 | assets/towers |
| 35–46 | heroes/allies | 네 명의 판타지 RPG 영웅들; 판타지 전사 부대 라인업; 판타지 전사들의 게임 아트 라인업 | assets/heroes, assets/units |
| 47–64 | enemies | 판타지 몬스터 4종 캐릭터 라인업; 네 마리 판타지 오크 전사 라인업; 사막 암살자와 판타지 몬스터 군단; 보라 박쥐와 석상 가고일 스프라이트 시트 | assets/enemies |
| 65–70 | bosses | 판타지 보스 몬스터 네 종 세트; 보랏빛 리치와 서리 거인의 전투 자산 시트; 화산암 골렘 보스 스프라이트 시트 | assets/bosses |
| 71–86 | projectiles/skills | 판타지 투사체 아이콘 4종 세트; 판타지 투사체 아이콘 네 가지; 판타지 스킬 이펙트 스프라이트 시트 | assets/projectiles, assets/skills |
| 87–98 | VFX | 화려한 판타지 게임 VFX 효과 모음; 판타지 마법 효과 4종 세트; 독초 별빙 성스러운 효과 아이콘 세트 | assets/vfx |
| 99–114 | environment | 판타지 이소메트릭 환경 에셋 세트; 판타지 게임 환경 소품 모음; 판타지 게임 효과와 나무 에셋 세트 | assets/environment |
| 115–130 | UI/HUD | 판타지 타워 디펜스 UI 스프라이트 시트; 판타지 타워 디펜스 HUD 아이콘 세트; 판타지 게임 HUD 아이콘 세트 | assets/ui |
| 131–150 | icons | 판타지 타워 디펜스 아이콘 세트; 검과 마법의 판타지 아이콘 세트; 판타지 장비 아이콘 4종 세트; 광택 게임 아이콘 4종 세트 | assets/icons |
| 151–158 | world/menu | 다채로운 판타지 모험 지도; 판타지 월드맵과 레벨 노드 세트; 성 너머의 평화로운 판타지 계곡; 판타지 성의 화려한 무기고 홀; 아늑한 마법사의 지도 서재; 햇살 가득한 마법 왕립 도서관 | assets/menu |
| 159–166 | animation | 고블린 전사의 전투 애니메이션 스프라이트 시트; 보라 박쥐와 석상 가고일 스프라이트 시트; 판타지 영웅 4종 스프라이트 아틀라스; 중세 기사 애니메이션 스프라이트 시트; 판타지 궁수 감시탑 스프라이트 시트; 마법사와 수정탑 애니메이션 스프라이트 시트; 판타지 대포 터렛 애니메이션 스프라이트 시트; 화산암 골렘 보스 스프라이트 시트 | assets/animations |

## Excel prompt contract

All runtime art must follow the Excel prompt: original cute fantasy tower-defense asset, hand-painted storybook cartoon style, chunky readable silhouettes, warm saturated colors, polished mobile-game quality, consistent 3/4 top-down isometric camera, clean edges, no text/logo/watermark. Maps are opaque; individual assets are transparent. Animation anchors stay fixed.

## Integration order

MVP order follows the spreadsheet: map/pads/path → four base towers → 8–10 enemies → projectile/VFX → heroes/allies → HUD → boss → world map/results. Within each batch, source images are split into canonical assets before code binding; contaminated neighboring fragments are rejected.
