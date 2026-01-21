import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
    ar: {
        translation: {
            "hero_title": "REO Services",
            "hero_subtitle": "حياكم الله.. أقدم لكم حلول تقنية احترافية ومضمونة لراوترات الـ 5G",
            "services_header": "الخدمات والأسعار",
            "unlock_title": "فك تشفير الراوتر (Unlock)",
            "unlock_desc": "تشغيل جميع الشرائح على أجهزة برووي (Brovi) و نوكيا (Nokia) و هواوي",
            "ping_title": "تضبيط البنق للألعاب",
            "ping_desc": "إعداد DNS وفتح بورتات لتقليل اللاغ في Valorant وغيرها",
            "speed_title": "سرعة الإنترنت (APN)",
            "speed_desc": "برمجة نقطة الوصول وتثبيت الترددات لأقصى سرعة",
            "commercial_title": "شبكات المطاعم والمحلات",
            "commercial_desc": "استقرار أجهزة مدى وتطبيقات التوصيل",
            "taif_service": "لو كنت في الطائف، أقدر أجيك بنفسي للموقع وأخلص لك كل الأمور التقنية في مكانك ما عندي أي مشكلة.",
            "negotiable": "قابل للتفاوض",
            "order_now": "باشر بالطلب وانطلق",
            "name_label": "الاسم الكريم",
            "location_label": "الموقع (المكان)",
            "payment_label": "طريقة الدفع",
            "cash": "كاش / نقدي",
            "bank": "تحويل بنكي",
            "location_btn": "تحديد موقعي",
            "vpn_warning": "⚠️ يرجى إيقاف الـ VPN أو برامج تغيير DNS لضمان دقة الموقع.",
            "send_whatsapp": "إرسال للواتساب",
            "select_service": "اختر الخدمات",
            "total_value": "الإجمالي التقريبي",
            "sar": "ريال",
            "contact_method": "للتواصل: خاص حراج أو واتساب",
            "modify_artifact": "تعديل الطلب",
            "welcome": "حياكم الله",
            "manifest": "ملخص الطلب",
            "name_placeholder": "الاسم الكريم...",
            "loc_placeholder": "الإحداثيات أو رابط قوقل ماب (يدويًا إذا لم يعمل الزر)...",
            "ready": "جاهز؟",
            "data_check": "مراجعة البيانات",
            "gps_error_secure": "⚠️ لخصوصيتك، المتصفح يتطلب رابطًا آمنًا (HTTPS) لتحديد البيت بدقة. يرجى استخدام الرابط المرسل إليك أو إدخال الموقع يدويًا.",
            "manual_location_guide": "اضغط هنا لمعرفة كيفية نسخ موقعك من الخرائط يدويًا",
            "whatsapp_install_needed": "📱 يرجى التأكد من تثبيت واتساب على جهازك ليتم فتح التطبيق مباشرة."
        }
    },
    en: {
        translation: {
            "hero_title": "REO Services",
            "hero_subtitle": "Welcome! I am a student specializing in networks, offering professional and guaranteed technical solutions for 5G routers.",
            "services_header": "Services & Prices",
            "unlock_title": "Router Unlock",
            "unlock_desc": "Unlock all SIMs on Brovi, Nokia, and Huawei devices",
            "ping_title": "Gaming Ping Optimization",
            "ping_desc": "DNS setup & port forwarding to reduce lag in Valorant & others",
            "speed_title": "Internet Speed (APN)",
            "speed_desc": "APN programming & frequency locking for max speed",
            "commercial_title": "Commercial Networks",
            "commercial_desc": "Stability for Mada devices & delivery apps (Restaurants/Shops)",
            "taif_service": "If you are in Taif, I can come to your location and handle all technical matters on-site. No problem at all.",
            "negotiable": "Negotiable",
            "order_now": "Proceed with Order",
            "name_label": "Full Name",
            "location_label": "Your Location / Place",
            "payment_label": "Payment Method",
            "cash": "Cash",
            "bank": "Bank Transfer",
            "location_btn": "Detect My Location",
            "vpn_warning": "⚠️ Please turn off VPN or DNS changers for accurate location if any was on.",
            "send_whatsapp": "Send to WhatsApp",
            "select_service": "Select Services",
            "total_value": "Approximate Total",
            "sar": "SAR",
            "contact_method": "Contact: Haraj DM or WhatsApp",
            "modify_artifact": "Modify Order",
            "welcome": "Welcome",
            "manifest": "Order Summary",
            "name_placeholder": "Your Name...",
            "loc_placeholder": "Coordinates...",
            "ready": "Ready?",
            "data_check": "Data Review",
            "whatsapp_install_needed": "📱 Please ensure WhatsApp is installed on your device to open the app directly."
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'ar',
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        }
    });

export default i18n;
