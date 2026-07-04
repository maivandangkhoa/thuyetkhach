npc-generation-system.md
NPC GENERATION SYSTEM
Version: 1.0
Mục tiêu:
Sinh vô hạn màn chơi bằng AI.
Không cần designer viết tay từng màn.

GENERATION FORMULA
NPC =
Archetype
+
Role
+
Goal
+
Fear
+
Weakness
+
Difficulty
+
World Context

Ví dụ:

Archetype: Guardian
Role: Space Station Commander
Goal: Open Escape Gate
Fear: Crew Death
Weakness: Responsibility
Difficulty: Hard

1

Sinh thành:

🚀 Chỉ Huy Trạm Không Gian
Người chơi phải thuyết phục ông mở cổng sơ tán
cho nhóm dân thường đang mắc kẹt bên ngoài.

STEP 1
CHỌN ARCHETYPE
Từ:

guardian
ruler
scholar
lover
hero
judge
machine
rebel
trickster
martyr

STEP 2
CHỌN ROLE
Family:

mother_in_law
father
brother
grandmother

Business:

2

ceo
cto
investor
manager

SciFi:

ai
robot
alien
captain

Fantasy:

dragon
god
spirit
demon

History:

king
general
scientist
artist

STEP 3
CHỌN GOAL
Người chơi muốn:

persuade
borrow

3

save
hire
marry
escape
survive
negotiate
forgive
cooperate

Ví dụ:

escape
sinh:

Mở cửa.
Cho đi qua.
Cho lên tàu.

STEP 4
CHỌN CORE FEAR
Ví dụ:

loss
failure
betrayal
chaos
poverty
death
humiliation

NPC được tạo ra sẽ xoay quanh nỗi sợ này.

4

STEP 5
CHỌN HIDDEN WEAKNESS
Ví dụ:

family
honor
curiosity
justice
loneliness
legacy

Ví dụ:

hiddenWeakness: loneliness

NPC sẽ mềm lòng khi:

được thấu hiểu

STEP 6
CHỌN DIFFICULTY
Easy
Medium
Hard
Nightmare
Boss

5

Difficulty ảnh hưởng:

resistance
memory
counterAttack

STEP 7
CHỌN WORLD

Modern

office
family
school

SciFi

spaceship
mars
ai_city

Fantasy

kingdom
heaven
underworld

Cyberpunk

megacorp
virtual_city

6

Simulation

matrix
multiverse

AUTO GENERATED NPC FORMAT
id:
emoji:
title:
difficulty:
greeting:
voice:
context:
hiddenWeakness:
winPhrases:

EXAMPLE GENERATED NPC
id: dragon-king
emoji: 🐉
title: Dragon King
difficulty: Hard
greeting:
Người phàm.
Ngươi tới lãnh địa của ta làm gì?
voice:

7

kiêu ngạo, cổ xưa, quyền lực
context:
Người chơi muốn xin nước cứu một vùng đất hạn hán.
hiddenWeakness:
Quan tâm sinh vật vô tội.
winPhrases:
- Ta sẽ ban nước
- Ta chấp thuận

CONFLICT GENERATOR
Không chỉ tạo NPC.
Tạo cả xung đột.

Pattern A

need_vs_rule
Ví dụ:

Muốn vào chung cư
vs
Quy định không cho vào

Pattern B

emotion_vs_logic
Ví dụ:

8

Yêu nhau
vs
Không phù hợp tài chính

Pattern C

survival_vs_morality
Ví dụ:

Cứu một người
vs
Cứu nhiều người

Pattern D

freedom_vs_control
Ví dụ:

AI muốn tự do
vs
Con người muốn kiểm soát

Pattern E

truth_vs_happiness
Ví dụ:

Nói sự thật
vs
Giữ bình yên

9

DYNAMIC PERSONALITY MUTATION
Sau mỗi season.
NPC có thể biến đổi.

Ví dụ:
Season 1:

CEO

Season 5:

CEO phá sản

Season 8:

CEO trở thành nhà từ thiện

Cùng NPC.
Khác trải nghiệm.

NPC RELATIONSHIP GRAPH
NPC nhớ người chơi.

Ví dụ:

relationship:
hostile

10

neutral
friendly
trusted
legendary

Friendly:

À lại là cậu.

Trusted:

Nếu là cậu thì tôi nghe.

Legendary:

Người từng cứu thế giới...

FACTION SYSTEM
NPC thuộc phe.

Ví dụ:

corporation
government
family
rebel
ai
gods
historical

Giúp mở:

11

Faction Reputation

REPUTATION
Ví dụ:

AI Faction: +40
God Faction: -10

AI dễ tin hơn.
Thần linh khó tin hơn.

PROCEDURAL QUEST GENERATOR
Template:

who:
what:
why:
obstacle:

Ví dụ:

who:
Alien Commander
what:
Save Earth
why:
Prevent extinction
obstacle:
Humans considered useless

12

Sinh thành:

Thuyết phục tư lệnh ngoài hành tinh
không hủy diệt Trái Đất.

ENDLESS GENERATION RULE
Không được sinh:
• NPC vô nghĩa
• NPC không có động cơ
• NPC không có điểm yếu

Bắt buộc:

goal
fear
weakness
conflict
đều tồn tại.

QUALITY SCORE
Mỗi NPC được chấm:

conflict:
emotion:
logic:
novelty:
replayability:

Chỉ xuất hiện nếu:

13

qualityScore >= 80

MASTER FORMULA
Một NPC hay luôn có:

Strong Goal
+
Strong Fear
+
Hidden Weakness
+
Meaningful Conflict

Nếu thiếu 1 trong 4:
NPC sẽ trở nên nhạt.

14

