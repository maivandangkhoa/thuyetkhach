conversation-engine.md
CONVERSATION ENGINE
Version: 1.0
Mục tiêu:
Biến game từ:

Chat -> tìm keyword -> thắng
thành:

Đọc tâm lý -> xây dựng niềm tin -> phá kháng cự -> thắng

VÒNG ĐỜI MỘT TRẬN ĐẤU
graph LR
A[Greeting]
--> B[Discovery]
B --> C[Resistance]
C --> D[Breakthrough]
D --> E[Decision]
E --> F[Victory]

STAGE 1 - GREETING
Mục tiêu:
Tạo định kiến ban đầu.

1

Ví dụ:
Mẹ vợ:

Cậu có gì mà đòi cưới con gái tôi?
ARK-7:

Truy cập bị từ chối.
Crush:

Tôi không cho số người lạ.

NPC lúc này:

trust: 10
respect: 10
rất thấp.

STAGE 2 - DISCOVERY
Mục tiêu:
Cho người chơi tìm điểm yếu.
NPC bắt đầu tiết lộ:
• giá trị
• nỗi sợ
• mục tiêu
Ví dụ:

2

Tôi không sợ nghèo.
Tôi chỉ sợ con gái tôi khổ.
=> Điểm yếu thật được hé lộ.

STAGE 3 - RESISTANCE
NPC chủ động phản đối.
Ví dụ:

Nghe hay đấy.
Nhưng tại sao tôi phải tin cậu?

Resistance Types

financial:
social:
ethical:
logical:
emotional:

Ví dụ:
Mẹ vợ:

financial: 9

CTO:

logical: 10

3

Crush:

emotional: 9

STAGE 4 - BREAKTHROUGH
Người chơi chạm đúng điểm yếu.
Ví dụ:

Cháu không hứa sẽ giàu.
Nhưng cháu hứa con gái bác sẽ không phải một mình.

NPC chuyển trạng thái:

guarded: false

Đây là thời điểm:
• giọng nói mềm hơn
• ít phản công hơn

STAGE 5 - DECISION
NPC cân nhắc.
Ví dụ:

Tôi chưa chắc...
nhưng cậu làm tôi suy nghĩ.

4

Nếu:

trust >= threshold
NPC vào trạng thái quyết định.

STAGE 6 - VICTORY
NPC chủ động nói win phrase.
Ví dụ:

Thôi được.
Mẹ đồng ý cho cưới.

HỆ THỐNG NHỚ HỘI THOẠI
NPC nhớ:

facts:
promises:
lies:
emotions:

Ví dụ:

Tôi kiếm 30 triệu/tháng.
Fact được lưu.

5 lượt sau:

5

Tôi thất nghiệp.
NPC phát hiện mâu thuẫn.

DETECT LIE SYSTEM
Mỗi NPC có:

lieTolerance:

Easy

lieTolerance: 8

Boss

lieTolerance: 2

Nếu vượt ngưỡng:

trust -= 30
respect -= 20

REPETITION PENALTY
Spam cùng ý tưởng.
Ví dụ:

Xin đi mà.

6

Xin đi mà.
Xin đi mà.

NPC:

annoyance += 15

Sau ngưỡng:

Anh đang lặp lại chính mình.

TOPIC SHIFT SYSTEM
Một số NPC cố tình đổi chủ đề.
Ví dụ:

Thế còn chuyện tiền bạc?

Nếu người chơi:
• né tránh
• không trả lời
thì:

trust -= 10

EMOTIONAL SPIKE
Khi NPC bị chạm đúng trauma.

7

Ví dụ:

Đừng nhắc chuyện đó nữa.

NPC:

emotion += 40

Lúc này:
• dễ thắng hơn
• dễ thua hơn

SOFT LOCK
NPC từ chối tiếp tục.
Ví dụ:

Cuộc nói chuyện kết thúc.

Điều kiện:

trust <= 0
hoặc

annoyance >= 100

RECOVERY SYSTEM
Người chơi có thể cứu vãn.

8

Ví dụ:

Tôi xin lỗi.

Nếu phù hợp:

trust += 15

PERFECT WIN
Không chỉ thắng.
Mà thắng tuyệt đối.
Điều kiện:

trust >= 90
respect >= 90

Phần thưởng:

gold:
bonusXP:
secretDialogue:

SECRET ENDINGS
Một số NPC có ending ẩn.
Ví dụ:
Crush:
Normal:

9

Cho anh số.
Secret:

Cuối tuần mình đi chơi nhé.

Mẹ vợ:
Normal:

Mẹ đồng ý.
Secret:

Bao giờ cưới?

10

