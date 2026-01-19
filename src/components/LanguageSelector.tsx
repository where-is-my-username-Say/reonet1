import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface LanguageSelectorProps {
    onSelect: () => void;
}

export const LanguageSelector = ({ onSelect }: LanguageSelectorProps) => {
    const { i18n } = useTranslation();

    const handleSelect = (lang: string) => {
        i18n.changeLanguage(lang);
        document.dir = lang === 'ar' ? 'rtl' : 'ltr';
        onSelect();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-base-100 text-base-content overflow-hidden">
            {/* Background patterns */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-base-100 to-base-100 flex items-center justify-center">
                <div className="w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl absolute -top-1/2 left-1/2 -translate-x-1/2" />
                <div className="w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl absolute -bottom-1/2 right-1/2 translate-x-1/2" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative z-10 w-full max-w-lg p-8 md:p-12 flex flex-col items-center gap-12"
            >
                <div className="text-center space-y-4">
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-4xl md:text-5xl font-black tracking-tight"
                    >
                        Select Language
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-xl text-base-content/60 font-medium font-arabic"
                    >
                        اختر اللغة للمتابعة
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <motion.button
                        whileHover={{ scale: 1.05, borderColor: 'var(--color-primary)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSelect('ar')}
                        className="group relative h-40 rounded-3xl border-2 border-base-200 bg-base-100/50 backdrop-blur-md hover:bg-base-200/50 transition-all flex flex-col items-center justify-center gap-3 overflow-hidden shadow-sm hover:shadow-xl"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="text-5xl mb-2">🇸🇦</span>
                        <span className="text-2xl font-black font-arabic">العربية</span>
                        <span className="text-sm text-base-content/40 uppercase tracking-widest font-bold group-hover:text-primary transition-colors">Arabic</span>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05, borderColor: 'var(--color-secondary)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSelect('en')}
                        className="group relative h-40 rounded-3xl border-2 border-base-200 bg-base-100/50 backdrop-blur-md hover:bg-base-200/50 transition-all flex flex-col items-center justify-center gap-3 overflow-hidden shadow-sm hover:shadow-xl"
                    >
                        <div className="absolute inset-0 bg-gradient-to-bl from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="text-5xl mb-2">🇺🇸</span>
                        <span className="text-2xl font-black">English</span>
                        <span className="text-sm text-base-content/40 uppercase tracking-widest font-bold font-arabic group-hover:text-secondary transition-colors">إنجليزي</span>
                    </motion.button>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center"
                >
                    <p className="text-sm text-base-content/30 font-medium">
                        Project <span className="font-bold text-primary">REOnet</span> v3.0
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
};
