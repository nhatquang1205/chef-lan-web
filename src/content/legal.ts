import type { Locale } from "@/i18n/config";

export type LegalDoc = "terms" | "privacy" | "refund";

interface Section {
  heading: string;
  paragraphs: string[];
}

export interface LegalContent {
  title: string;
  intro: string;
  sections: Section[];
}

/** Shown on every document. Update when the text changes. */
export const LEGAL_UPDATED = "2026-11-05";

/**
 * DRAFT wording for the owner and a lawyer to review before launch: the refund window, the
 * support hours and the operator's registered details are placeholders for business decisions.
 */
export const legal: Record<Locale, Record<LegalDoc, LegalContent>> = {
  vi: {
    terms: {
      title: "Điều khoản sử dụng",
      intro: "Khi tạo tài khoản hoặc mua khóa học trên website này, bạn đồng ý với các điều khoản dưới đây. Website do Bon Bocon (Chef Lan) vận hành.",
      sections: [
        {
          heading: "1. Tài khoản",
          paragraphs: [
            "Bạn cung cấp thông tin chính xác khi đăng ký và chịu trách nhiệm bảo mật mật khẩu của mình.",
            "Mỗi tài khoản chỉ dành cho một người dùng. Không chia sẻ tài khoản hoặc liên kết xem video cho người khác.",
          ],
        },
        {
          heading: "2. Khóa học và quyền truy cập",
          paragraphs: [
            "Khi thanh toán được xác nhận, bạn được cấp quyền xem khóa học hoặc bài học đã mua theo thời hạn ghi trên trang khóa học (trọn đời nếu không ghi thời hạn).",
            "Quyền truy cập là quyền sử dụng cá nhân, không thể chuyển nhượng. Chúng tôi có thể thu hồi quyền truy cập nếu phát hiện việc chia sẻ tài khoản hoặc vi phạm điều khoản.",
          ],
        },
        {
          heading: "3. Bản quyền nội dung",
          paragraphs: [
            "Toàn bộ video, công thức, hình ảnh và tài liệu thuộc quyền sở hữu của Bon Bocon. Bạn không được sao chép, ghi hình, tải xuống, phân phối lại hoặc bán lại nội dung dưới bất kỳ hình thức nào.",
            "Bạn được phép nấu các món trong khóa học cho gia đình, bạn bè hoặc kinh doanh của riêng bạn.",
          ],
        },
        {
          heading: "4. Giá và thanh toán",
          paragraphs: [
            "Giá được hiển thị bằng đồng Việt Nam (VND) trên từng khóa học. Chúng tôi có thể thay đổi giá và chương trình giảm giá; giá áp dụng là giá tại thời điểm bạn thanh toán.",
            "Thanh toán bằng chuyển khoản ngân hàng qua mã QR trên trang thanh toán của SePay. Khi thanh toán được xác nhận, hệ thống tự mở quyền truy cập cho bạn. Nếu có sự cố, bạn vẫn có thể liên hệ trực tiếp với Chef Lan để được hỗ trợ.",
            "Đơn hàng có thời hạn thanh toán. Thanh toán sau thời hạn hoặc sai số tiền sẽ không được mở tự động; hãy liên hệ Chef Lan kèm mã đơn.",
          ],
        },
        {
          heading: "5. Giới hạn trách nhiệm",
          paragraphs: [
            "Nội dung nhằm mục đích hướng dẫn nấu ăn. Bạn tự chịu trách nhiệm về an toàn thực phẩm, dị ứng và thiết bị bếp khi thực hành.",
            "Chúng tôi nỗ lực duy trì website hoạt động ổn định nhưng không bảo đảm không bị gián đoạn.",
          ],
        },
        {
          heading: "6. Thay đổi và liên hệ",
          paragraphs: [
            "Chúng tôi có thể cập nhật điều khoản; bản mới có hiệu lực khi đăng tải trên trang này.",
            "Mọi thắc mắc xin liên hệ qua fanpage Facebook của Chef Lan (facebook.com/Chefphuonglandoan) hoặc số 0932 046 296.",
          ],
        },
      ],
    },
    privacy: {
      title: "Chính sách bảo mật",
      intro: "Chúng tôi tôn trọng quyền riêng tư của bạn. Trang này giải thích dữ liệu nào được thu thập và cách chúng tôi sử dụng.",
      sections: [
        {
          heading: "1. Dữ liệu chúng tôi thu thập",
          paragraphs: [
            "Thông tin tài khoản: họ tên, email, số điện thoại (nếu bạn cung cấp) và mật khẩu (được lưu dưới dạng mã băm, chúng tôi không đọc được mật khẩu).",
            "Thông tin thanh toán: mã đơn hàng, số tiền và thời điểm giao dịch mà SePay báo về. Chúng tôi không lưu số thẻ hay mật khẩu ngân hàng của bạn.",
            "Thông tin sử dụng: các khóa học và bài học bạn sở hữu. Lịch sử xem video chỉ được lưu trên trình duyệt của bạn (localStorage) và không gửi về máy chủ.",
          ],
        },
        {
          heading: "2. Mục đích sử dụng",
          paragraphs: [
            "Tạo và quản lý tài khoản, cấp quyền xem khóa học, hỗ trợ bạn khi cần và liên hệ về việc đăng ký khóa học.",
            "Chúng tôi không bán dữ liệu cá nhân của bạn cho bên thứ ba.",
          ],
        },
        {
          heading: "3. Bên thứ ba",
          paragraphs: [
            "Video được cung cấp qua Bunny Stream. Khi bạn xem video, nhà cung cấp này nhận địa chỉ IP và thông tin thiết bị cần thiết để phát video.",
            "Thanh toán được xử lý qua cổng thanh toán SePay: bạn được chuyển sang trang của SePay để thanh toán, và SePay báo kết quả cho chúng tôi để xác nhận đơn hàng của bạn.",
            "Website lưu phiên đăng nhập trong trình duyệt của bạn (localStorage) để giữ trạng thái đăng nhập; không dùng cookie quảng cáo.",
          ],
        },
        {
          heading: "4. Lưu trữ và bảo mật",
          paragraphs: [
            "Dữ liệu được lưu trên máy chủ do chúng tôi quản lý và truyền qua kết nối HTTPS. Chúng tôi giới hạn quyền truy cập dữ liệu cho người cần thiết.",
          ],
        },
        {
          heading: "5. Quyền của bạn",
          paragraphs: [
            "Bạn có thể yêu cầu xem, chỉnh sửa hoặc xóa dữ liệu cá nhân của mình bằng cách nhắn tin cho fanpage Facebook của Chef Lan (facebook.com/Chefphuonglandoan). Chúng tôi sẽ phản hồi trong thời gian hợp lý.",
          ],
        },
      ],
    },
    refund: {
      title: "Chính sách hoàn tiền",
      intro: "Khóa học là nội dung số được cung cấp ngay sau khi xác nhận thanh toán. Chính sách dưới đây áp dụng cho các khoản thanh toán trên website này.",
      sections: [
        {
          heading: "1. Khi nào được hoàn tiền",
          paragraphs: [
            "Bạn được hoàn tiền nếu: bạn thanh toán nhưng chưa được cấp quyền truy cập và chúng tôi không khắc phục được; hoặc nội dung bạn mua không phát được do lỗi từ phía chúng tôi và không thể sửa trong vòng 7 ngày.",
            "Bạn có thể yêu cầu hoàn tiền trong vòng 7 ngày kể từ ngày thanh toán nếu chưa xem quá 10% tổng thời lượng khóa học.",
          ],
        },
        {
          heading: "2. Khi nào không hoàn tiền",
          paragraphs: [
            "Không hoàn tiền khi bạn đã xem phần lớn nội dung, khi tài khoản bị thu hồi do chia sẻ hoặc vi phạm điều khoản, hoặc khi yêu cầu được gửi sau thời hạn trên.",
          ],
        },
        {
          heading: "3. Cách yêu cầu",
          paragraphs: [
            "Nhắn tin cho fanpage Facebook của Chef Lan (facebook.com/Chefphuonglandoan) hoặc gọi 0932 046 296, kèm email tài khoản, mã đơn hàng và thông tin thanh toán. Chúng tôi phản hồi trong vòng 3 ngày làm việc.",
            "Khoản hoàn tiền được chuyển về phương thức bạn đã dùng để thanh toán trong vòng 14 ngày kể từ khi yêu cầu được chấp nhận.",
          ],
        },
      ],
    },
  },
  en: {
    terms: {
      title: "Terms of use",
      intro: "By creating an account or buying a course on this website you agree to the terms below. The website is operated by Bon Bocon (Chef Lan).",
      sections: [
        {
          heading: "1. Your account",
          paragraphs: [
            "Give accurate details when you sign up and keep your password safe.",
            "An account is for one person. Do not share the account or video links with others.",
          ],
        },
        {
          heading: "2. Courses and access",
          paragraphs: [
            "Once payment is confirmed you can watch the course or lesson you bought for the period shown on its page (lifetime if none is shown).",
            "Access is personal and not transferable. We may withdraw it if we find account sharing or a breach of these terms.",
          ],
        },
        {
          heading: "3. Content rights",
          paragraphs: [
            "All videos, recipes, images and materials belong to Bon Bocon. You may not copy, record, download, redistribute or resell them in any form.",
            "You may cook the dishes for your family, friends or your own business.",
          ],
        },
        {
          heading: "4. Prices and payment",
          paragraphs: [
            "Prices are in Vietnamese dong (VND) on each course. We may change prices and discounts; the price that applies is the one at the time you pay.",
            "You pay by bank transfer with a QR code on SePay's payment page. Once the payment is confirmed, access opens automatically. If something goes wrong you can still contact Chef Lan for help.",
            "An order must be paid within its time limit. A payment after that time or for a different amount is not unlocked automatically; contact Chef Lan with the order code.",
          ],
        },
        {
          heading: "5. Liability",
          paragraphs: [
            "The content is cooking instruction. You are responsible for food safety, allergies and kitchen equipment when you practise.",
            "We work to keep the website running but do not guarantee it will never be interrupted.",
          ],
        },
        {
          heading: "6. Changes and contact",
          paragraphs: [
            "We may update these terms; the new version applies once posted on this page.",
            "Questions: message Chef Lan's Facebook page (facebook.com/Chefphuonglandoan) or call 0932 046 296.",
          ],
        },
      ],
    },
    privacy: {
      title: "Privacy policy",
      intro: "We respect your privacy. This page explains what data we collect and how we use it.",
      sections: [
        {
          heading: "1. Data we collect",
          paragraphs: [
            "Account details: name, email, phone (if you give one) and password (stored as a hash; we cannot read it).",
            "Usage: the courses and lessons you own. Your watch history is kept only in your browser (localStorage) and is not sent to our servers.",
            "Payment details: order code, amount and the time of the transaction as SePay reports it. We do not store your card numbers or bank passwords.",
          ],
        },
        {
          heading: "2. How we use it",
          paragraphs: [
            "To create and manage your account, grant access to courses, support you and contact you about enrolment.",
            "We do not sell your personal data to third parties.",
          ],
        },
        {
          heading: "3. Third parties",
          paragraphs: [
            "Videos are delivered through Bunny Stream. When you watch, this provider receives the IP address and device information needed to play the video.",
            "Payments are processed through the SePay payment gateway: you are sent to SePay's page to pay, and SePay tells us the result so we can confirm your order.",
            "The website keeps your sign-in session in your browser (localStorage); we use no advertising cookies.",
          ],
        },
        {
          heading: "4. Storage and security",
          paragraphs: [
            "Data is stored on servers we manage and sent over HTTPS. Access is limited to people who need it.",
          ],
        },
        {
          heading: "5. Your rights",
          paragraphs: [
            "You can ask to see, correct or delete your personal data by messaging Chef Lan's Facebook page (facebook.com/Chefphuonglandoan). We will reply within a reasonable time.",
          ],
        },
      ],
    },
    refund: {
      title: "Refund policy",
      intro: "Courses are digital content, available as soon as payment is confirmed. This policy applies to payments made on this website.",
      sections: [
        {
          heading: "1. When you get a refund",
          paragraphs: [
            "You are refunded if you paid but were not given access and we cannot fix it, or if the content you bought cannot be played because of a fault on our side that we cannot fix within 7 days.",
            "You can ask for a refund within 7 days of payment if you have watched no more than 10% of the course's total duration.",
          ],
        },
        {
          heading: "2. When you do not",
          paragraphs: [
            "No refund once you have watched most of the content, if the account was withdrawn for sharing or breaching the terms, or if the request comes after the period above.",
          ],
        },
        {
          heading: "3. How to ask",
          paragraphs: [
            "Message Chef Lan's Facebook page (facebook.com/Chefphuonglandoan) or call 0932 046 296 with your account email, order code and payment details. We reply within 3 working days.",
            "Approved refunds go back to the payment method you used within 14 days.",
          ],
        },
      ],
    },
  },
};
