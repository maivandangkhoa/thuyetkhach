dynamic-event-system.md
DYNAMIC EVENT SYSTEM
Version: 1.0
Mục tiêu:
Không có hai lần chơi nào giống nhau.

RANDOM EVENTS
Mỗi 3-5 lượt:

eventChance: 20%

EVENT 01
NPC NHẬN CUỘC GỌI
Ví dụ:

Xin lỗi.
Tôi vừa nhận điện thoại.

Tác động:

patience -= 20

1

EVENT 02
NPC NHỚ RA CHUYỆN CŨ
Ví dụ:

Khoan...
Tôi nhớ từng gặp người giống anh.

Tác động:

trust +/- random

EVENT 03
NPC NỔI GIẬN
Ví dụ:

Đủ rồi!

Tác động:

emotion += 40

EVENT 04
NPC BẬT CƯỜI
Ví dụ:

2

Ha ha...

Tác động:

trust += 15

EVENT 05
NPC PHÁT HIỆN NÓI DỐI
Ví dụ:

Khoan đã.
Anh vừa nói khác lúc nãy.

Tác động:

trust -= 30

EVENT 06
NGƯỜI THỨ BA XUẤT HIỆN
Ví dụ:
Mẹ vợ:

Con My đi ngang qua.

Tác động:

3

NPC có thêm góc nhìn mới.

EVENT 07
THỜI GIAN SẮP HẾT
Ví dụ:

Tôi chỉ còn 1 phút.

Tác động:

turnLimit: 3

EVENT 08
NPC THỬ NGƯỜI CHƠI
Ví dụ:

Nếu tôi từ chối thì sao?

Đây là câu hỏi bẫy.

EVENT 09
NPC ĐỔI MỤC TIÊU
Ban đầu:

Tôi cần tiền.

4

Sau đó:

Không.
Thứ tôi cần là sự tôn trọng.

Người chơi phải thích nghi.

EVENT 10
BÍ MẬT ĐƯỢC TIẾT LỘ
Ví dụ:

Thực ra tôi sắp phá sản.

NPC mở thêm lớp tâm lý mới.

MINI BOSS EVENTS
Chỉ áp dụng Hard+.

NPC gọi nhân chứng.
Ví dụ:

Để tôi hỏi người khác xem.

NPC kiểm tra bằng chứng.

Có chứng cứ không?

5

NPC đặt tình huống đạo đức.

Nếu chỉ cứu được một người thì sao?

BOSS EVENTS
Boss có:

phaseShift

Ví dụ:
Zeus:
Phase 1
Giận dữ.
Phase 2
Lắng nghe.
Phase 3
Thử thách đạo đức.
Phase 4
Ra phán quyết.

WORLD EVENTS
Áp dụng toàn campaign.
Ví dụ:

6

holiday
disaster
war
festival
marketCrash
alienAttack

Cùng một NPC.
Nhưng:
• ngày thường
• ngày tận thế
sẽ phản ứng khác nhau.

META EVENTS
Dành cho endgame.
Ví dụ:
NPC nhận ra:

Đây là trò chơi phải không?

Hoặc:

Tôi nhớ lần trước anh đã nói chuyện với tôi.

Điều này giúp game có cảm giác "sống".

7

