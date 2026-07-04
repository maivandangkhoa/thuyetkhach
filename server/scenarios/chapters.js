/**
 * Chapter metadata cho campaign "Đấu Trí" (15 chương / 180 màn theo thiết kế).
 * `requiredStars` = tổng sao cần để MỞ KHOÁ chương (tính ở client từ localStorage;
 * server chỉ công bố con số này). Mỗi chương tối đa 12 màn × 3 sao = 36 sao.
 *
 * Giai đoạn 1: chỉ một số chương có nội dung; chương chưa có scenario sẽ hiện
 * "Sắp ra mắt" ở UI (số màn = 0).
 */
export const CHAPTERS = [
  { id: 1,  slug: 'doi-thuong',   title: 'Đời Thường',          emoji: '🏙️', accent: '#22C55E', requiredStars: 0,   lesson: 'Lịch sự & đọc cảm xúc cơ bản. Tìm đúng động cơ, đừng cộc cằn.' },
  { id: 2,  slug: 'gia-dinh',     title: 'Gia Đình',            emoji: '🏡', accent: '#A78BFA', requiredStars: 18,  lesson: 'Mỗi người trong nhà có một nỗi lo riêng. Hiểu họ thật sự cần gì.' },
  { id: 3,  slug: 'tinh-cam',     title: 'Tình Cảm',            emoji: '💕', accent: '#F472B6', requiredStars: 42,  lesson: 'Không thể thắng bằng lý lẽ suông — phải chạm tới cảm xúc.' },
  { id: 4,  slug: 'cong-so',      title: 'Công Sở',             emoji: '💼', accent: '#38BDF8', requiredStars: 66,  lesson: 'Nói bằng giá trị, KPI, kết quả, lợi ích & rủi ro.' },
  { id: 5,  slug: 'kinh-doanh',   title: 'Kinh Doanh',          emoji: '📈', accent: '#F59E0B', requiredStars: 90,  lesson: 'Bán giá trị chứ không bán giá. Xử lý phản đối, dựng niềm tin, đàm phán.' },
  { id: 6,  slug: 'tam-ly-hoc',   title: 'Tâm Lý Học',          emoji: '🧠', accent: '#C084FC', requiredStars: 114, lesson: 'NPC giấu tổn thương. Phải tự đào ra nỗi sợ thật, họ chủ động đánh lạc hướng.' },
  { id: 7,  slug: 'luat-trat-tu', title: 'Luật & Trật Tự',      emoji: '⚖️', accent: '#94A3B8', requiredStars: 138, lesson: 'Đối mặt người coi trọng luật & bằng chứng. Logic, nhất quán, có cơ sở.' },
  { id: 8,  slug: 'sci-fi',       title: 'Khoa Học Viễn Tưởng', emoji: '🚀', accent: '#4285F4', requiredStars: 162, lesson: 'Đối thủ không phải người — AI, robot, người ngoài hành tinh. Tìm mục tiêu lõi & lỗ hổng logic.' },
  { id: 9,  slug: 'du-hanh-thoi-gian', title: 'Du Hành Thời Gian', emoji: '⏳', accent: '#EAB308', requiredStars: 186, lesson: 'Gặp danh nhân lịch sử với hệ giá trị riêng. Lý lẽ hiện đại không thắng được.' },
  { id: 10, slug: 'hau-tan-the',  title: 'Hậu Tận Thế',         emoji: '☢️', accent: '#F97316', requiredStars: 210, lesson: 'Thế giới sụp đổ, khan hiếm cùng cực. Câu hỏi là "ai xứng được sống?".' },
  { id: 11, slug: 'than-thoai-dong-phuong', title: 'Thần Thoại Đông Phương', emoji: '🐉', accent: '#EF4444', requiredStars: 234, lesson: 'Thần tiên phương Đông: lễ nghĩa, đạo lý, ân oán. Long Vương, Diêm Vương, Ngọc Hoàng.' },
  { id: 12, slug: 'than-thoai-tay-phuong', title: 'Thần Thoại Tây Phương', emoji: '⚡', accent: '#FBBF24', requiredStars: 258, lesson: 'Các vị thần không màng luật người, mỗi vị là một lĩnh vực trừu tượng.' },
  { id: 13, slug: 'superhero',    title: 'Siêu Anh Hùng',       emoji: '🦸', accent: '#3B82F6', requiredStars: 282, lesson: 'Người mang sức mạnh khổng lồ và trách nhiệm khổng lồ.' },
  { id: 14, slug: 'cyberpunk',    title: 'Cyberpunk',           emoji: '🌃', accent: '#06B6D4', requiredStars: 306, lesson: 'Năm 2189, các siêu tập đoàn thống trị thế giới. NPC siêu thông minh, đa số cố lừa người chơi.' },
  { id: 15, slug: 'thuc-tai-mo-phong', title: 'Ma Trận', emoji: '🌌', accent: '#A855F7', requiredStars: 330, lesson: 'NPC phát hiện mình chỉ là một phần của mô phỏng. Và rồi nó bắt đầu đặt câu hỏi về bạn.' },
]

export const getChapter = (id) => CHAPTERS.find((c) => c.id === id)
