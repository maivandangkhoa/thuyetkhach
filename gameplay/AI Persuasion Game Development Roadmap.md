implementation-roadmap.md
AI PERSUASION GAME
DEVELOPMENT ROADMAP
Version: 1.0

TẦM NHÌN SẢN PHẨM
Mục tiêu cuối cùng:
Tạo một game AI hội thoại nơi người chơi phải:
• Thuyết phục
• Đàm phán
• Tranh luận
• Thương lượng
• Đọc tâm lý
với hàng trăm NPC khác nhau.

TÀI LIỆU GỐC
Các file đã có:

npc-difficulty-system.md
conversation-engine.md
npc-archetypes.md
dynamic-event-system.md
progression-system.md
achievement-system.md
meta-progression.md
daily-challenge-system.md
npc-generation-system.md
ai-prompt-architecture.md

1

PHASE 1
CORE GAMEPLAY PROTOTYPE
Thời gian:

1-2 tuần
Mục tiêu:

Chứng minh gameplay có vui hay không.

File sử dụng
npc-difficulty-system.md
Implement:

Easy
Medium
Hard
Bỏ qua:

Boss
Final Boss

conversation-engine.md
Implement:

Greeting
Discovery
Resistance
Breakthrough

2

Decision
Victory

npc-archetypes.md
Implement:

Guardian
Scholar
Lover
Machine

NPC Prototype
Chỉ làm:

Mẹ Vợ
Crush
Sếp
Bảo Vệ
ARK-7

Điều kiện hoàn thành
Người chơi:

sessionTime:
> 10 phút
và muốn chơi tiếp.

3

PHASE 2
AI CORE
Thời gian:

2-3 tuần
Mục tiêu:

NPC giống người thật.

File sử dụng
ai-prompt-architecture.md
Implement:

NPC Engine
Judge Engine
Memory Engine
Chưa làm:

Generator Engine

conversation-engine.md
Implement:

Memory System
Lie Detection
Repetition Penalty
Topic Shift

4

Điều kiện hoàn thành
NPC:

Nhớ được hội thoại
và

Bắt lỗi người chơi khi nói mâu thuẫn

PHASE 3
VERTICAL SLICE
Thời gian:

1-2 tuần
Mục tiêu:

Hoàn thiện 3 chương đầu tiên.

File sử dụng
chapter-01.md
chapter-02.md
chapter-03.md

Tổng:

36 màn

5

progression-system.md
Implement:

XP
Level
Stars
Chapter Unlock

Chưa làm:

Prestige
Skill Tree

Điều kiện hoàn thành
Người chơi có thể:

Chơi liên tục 3-5 giờ

PHASE 4
CLOSED BETA
Thời gian:

1 tuần

File sử dụng
achievement-system.md
Implement:

6

Story Achievement
Performance Achievement

dynamic-event-system.md
Implement:

NPC bật cười
NPC nổi giận
NPC đổi chủ đề
NPC nhớ chuyện cũ

Chỉ số cần đo
D1 Retention
Average Session
Win Rate
Completion Rate

Điều kiện hoàn thành
Ít nhất:

D1 >= 25%

PHASE 5
CONTENT EXPANSION
Thời gian:

3-4 tuần

7

File sử dụng
Toàn bộ:

chapter-04.md
chapter-05.md
chapter-06.md
chapter-07.md
chapter-08.md
chapter-09.md
chapter-10.md
chapter-11.md
chapter-12.md
chapter-13.md
chapter-14.md
chapter-15.md

Kết quả
Từ:

36 màn
thành:

180 màn

Điều kiện hoàn thành
Có:

15 chương
180 màn

8

PHASE 6
META PROGRESSION
Thời gian:

1-2 tuần

File sử dụng
meta-progression.md
Implement:

NPC Scanner
Emotion Radar
Collection Book

Chưa làm:

Legendary Cards

Kết quả
Người chơi có:

Mục tiêu sưu tập dài hạn

9

PHASE 7
ENDLESS MODE
Thời gian:

2 tuần

File sử dụng
npc-generation-system.md
Implement:

Generator Engine

Chỉ sinh:

Easy
Medium
Hard

Chưa sinh:

Boss
Final Boss

Kết quả
Infinite Content

10

PHASE 8
LIVE OPS
Thời gian:

liên tục

File sử dụng
daily-challenge-system.md
Implement:

Daily NPC
Weekly Boss
Monthly Event

Season
Season 1

Rise Of AI

Season 2

Gods Return

Season 3

Multiverse War

11

PHASE 9
SOCIAL & VIRAL
Mục tiêu:

Tăng trưởng tự nhiên.

Tạo file mới
social-viral-system.md

Hall Of Fame
Lưu:

Câu thuyết phục hay nhất tuần

Community Vote
Vote:

Màn đối đáp hay nhất

Share Card
Ví dụ:

Tôi đã thuyết phục được Zeus tha cho nhân loại.

12

TikTok Mode
Tự động xuất:

videoCaption
highlightDialogue

ROADMAP THỰC TẾ
Week 1

npc-difficulty-system
conversation-engine

Week 2

ai-prompt-architecture

Week 3

5 NPC Prototype

Week 4

36 màn đầu

Week 5

XP + Level + Stars

13

Week 6

Achievement

Week 7

Dynamic Events

Week 8

Closed Beta

Week 9-12

180 màn

Week 13

Meta Progression

Week 14

NPC Generator

Week 15

Daily Challenge

14

Week 16+

Season System
Social Features
LiveOps

THỨ TỰ ƯU TIÊN TUYỆT ĐỐI
Không được làm:

180 màn
↓
Gameplay

Phải làm:

Gameplay
↓
AI Engine
↓
Retention
↓
Content
↓
Endless Mode
↓
LiveOps

MILESTONE CUỐI
Khi hoàn thành:

15 Chapters
180 Story Levels
Infinite AI Levels
Achievements

15

Progression
Seasons
Daily Challenge
Live Events
Game sẽ chuyển từ:

AI Chat Game
thành:

AI Persuasion RPG Platform

16

