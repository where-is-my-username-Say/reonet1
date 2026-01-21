import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  Wifi,
  Gamepad2,
  Zap,
  Building2,
  Languages,
  MapPin,
  CheckCircle2,
  Send,
  AlertTriangle,
  ChevronRight,
  CreditCard,
  Wallet
} from 'lucide-react';
import { InteractiveBackground } from './components/InteractiveBackground';
import { RippleEffect } from './components/RippleEffect';
import { useLocation } from './hooks/useLocation';
import { LanguageSelector } from './components/LanguageSelector';
import './i18n';
import { TiltCard } from './components/TiltCard';
import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

// Dark/Neon Theme Service Colors
const services = [
  { id: 'unlock', price: 150, icon: Wifi, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  { id: 'ping', price: 80, icon: Gamepad2, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { id: 'speed', price: 50, icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  { id: 'commercial', price: 150, icon: Building2, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
];

function App() {
  const { t, i18n } = useTranslation();
  const [hasChosenLanguage, setHasChosenLanguage] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | ''>('');
  const [step, setStep] = useState(1);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const { address, setAddress, detectLocation, loading: locationLoading, error: locationError } = useLocation();

  const toggleLanguage = () => {
    const nextLng = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(nextLng);
  };

  const toggleService = (id: string) => {
    setSelectedServices(prev => {
      // Toggle logic: if exists, remove. if not, add.
      if (prev.includes(id)) {
        return prev.filter(s => s !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSend = async () => {
    // Generate unique ID based on timestamp
    const orderId = Date.now().toString();

    // Calculate total price
    const total = selectedServices.reduce((acc, curr) => acc + (services.find(s => s.id === curr)?.price || 0), 0);

    // Prepare order data
    const orderData = {
      orderId: orderId,
      date: new Date().toISOString(),
      status: 'new',
      customer: {
        name: name || 'N/A',
        location: address || 'N/A',
        payment: paymentMethod || 'N/A',
      },
      services: selectedServices.map(id => ({
        id,
        name: t(id + '_title'),
        price: services.find(s => s.id === id)?.price
      })),
      total: total,
      currency: t('sar')
    };

    try {
      // Save to Firebase
      await addDoc(collection(db, "orders"), orderData);
      console.log("Order saved to Firebase:", orderId);
    } catch (e) {
      console.error("Error adding document: ", e);
    }

    // Build detailed WhatsApp message
    const servicesList = selectedServices.map(id => {
      const service = services.find(s => s.id === id);
      return `• ${t(id + '_title')} - ${service?.price} ${t('sar')}`;
    }).join('\n');

    const msg = `🔷 طلب خدمة رقم: ${orderId}

📋 الخدمات المطلوبة:
${servicesList}

💰 الإجمالي: ${total} ${t('sar')}

👤 الاسم: ${name || 'غير محدد'}
📍 الموقع: ${address || 'غير محدد'}
💳 طريقة الدفع: ${paymentMethod === 'cash' ? t('cash') : t('bank')}`;

    const encodedMsg = encodeURIComponent(msg);
    const phoneNumber = "966571081589";

    if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
      window.location.href = `https://wa.me/${phoneNumber}?text=${encodedMsg}`;
    } else {
      window.open(`https://web.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMsg}`, "_blank");
    }
  };

  useEffect(() => {
    document.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const [isProcessing, setIsProcessing] = useState(false);

  const handleNext = async () => {
    if (step < 3) {
      setIsProcessing(true);
      // Premium artificial delay for "preparing your order" feel
      await new Promise(r => setTimeout(r, 600));
      setStep(prev => prev + 1);
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8, x: "50%", y: "50%", transformOrigin: "bottom right" },
    visible: { opacity: 1, scale: 1, x: 0, y: 0, transition: { type: "spring", damping: 25, stiffness: 200 } },
    exit: { opacity: 0, scale: 0.8, x: "-50%", y: "50%", transition: { duration: 0.3 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (!hasChosenLanguage) {
    return <LanguageSelector onSelect={() => setHasChosenLanguage(true)} />;
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden w-full flex flex-col font-sans text-base-content selection:bg-primary/30">
      <div className="fixed inset-0 z-0">
        <InteractiveBackground />
      </div>
      <RippleEffect />

      {/* Grid Pattern Overlay */}
      <div className="fixed inset-0 bg-grid-pattern opacity-10 pointer-events-none z-0" />

      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 p-6 flex justify-between items-center bg-black/50 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-2 bg-gradient-to-r from-primary to-secondary rounded-xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative px-5 py-2 bg-black rounded-xl border border-white/10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-black text-xl italic tracking-tighter">R</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black tracking-widest text-white leading-none">REO<span className="text-primary">NET</span></span>
                <span className="text-[8px] font-bold text-primary/50 uppercase tracking-[0.3em] leading-none mt-1">Fiber Tech</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={toggleLanguage}
          className="bg-white/5 px-5 py-2 rounded-full flex items-center gap-2 hover:bg-white/10 border border-white/10 transition-colors group"
        >
          <Languages className="w-4 h-4 text-primary group-hover:rotate-180 transition-transform duration-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            {i18n.language === 'ar' ? 'EN' : 'عربي'}
          </span>
        </button>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center p-6 pt-20 pb-12 w-full max-w-7xl mx-auto">
        <AnimatePresence mode="wait">

          {/* STEP 1: SERVICE SELECTION */}
          {step === 1 && (
            <motion.div
              key="step1"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full flex flex-col items-center gap-10"
            >
              <div className="text-center space-y-6 max-w-4xl">
                <motion.h1
                  variants={itemVariants}
                  className="text-5xl md:text-8xl neon-text leading-none"
                >
                  <span className="text-primary">REO</span> SERVICES
                </motion.h1>
                <motion.p
                  variants={itemVariants}
                  className="text-lg md:text-2xl text-white/60 font-medium leading-relaxed max-w-2xl mx-auto"
                >
                  {t('hero_subtitle')}
                </motion.p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
                {services.map((s, i) => (
                  <motion.div
                    key={s.id}
                    variants={itemVariants}
                    className="h-full flex flex-col"
                  >
                    <TiltCard
                      isSelected={selectedServices.includes(s.id)}
                      onClick={() => toggleService(s.id)}
                      className="cursor-pointer group"
                      floatOffset={i * 7.5}
                      floatSpeed={0.7 + (i * 0.15)}
                    >
                      <div className={`p-6 rounded-[2rem] ${s.bg} ${s.border} border-2 group-hover:scale-110 transition-transform duration-300`}>
                        <s.icon className={`w-10 h-10 ${s.color}`} />
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-xl font-black uppercase tracking-tight text-white">{t(s.id + '_title')}</h3>
                        <p className="text-sm text-white/50 font-medium leading-relaxed">{t(s.id + '_desc')}</p>
                      </div>

                      <div className="mt-auto pt-6 border-t border-white/10 w-full flex items-center justify-between">
                        <div className="text-left rtl:text-right">
                          <span className="text-3xl font-black text-white">{s.price}</span>
                          <span className="text-xs text-primary font-bold uppercase ml-1">{t('sar')}</span>
                        </div>
                        {selectedServices.includes(s.id) ? (
                          <CheckCircle2 className="w-8 h-8 text-primary drop-shadow-[0_0_10px_var(--primary-glow)]" />
                        ) : (
                          <div className="w-8 h-8 rounded-full border-2 border-white/20 group-hover:border-primary/50 transition-colors" />
                        )}
                      </div>
                    </TiltCard>
                  </motion.div>
                ))}
              </div>

              <motion.div variants={itemVariants} layoutId="order-flow-card" className="z-20">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNext}
                  disabled={selectedServices.length === 0 || isProcessing}
                  className="btn-primary flex items-center gap-4 text-xl disabled:opacity-50 disabled:cursor-not-allowed group min-w-[280px]"
                >
                  {isProcessing ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                  ) : (
                    <>
                      {t('order_now')}
                      <ChevronRight className="w-6 h-6 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                    </>
                  )}
                </motion.button>
              </motion.div>
            </motion.div>
          )}

          {/* STEP 2: DETAILS */}
          {step === 2 && (
            <motion.div
              key="step2"
              layoutId="order-flow-card"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-3xl glass-card p-10 md:p-16 flex flex-col gap-10"
              style={{ borderRadius: '2.5rem' }}
            >
              <motion.div variants={itemVariants} className="flex items-center justify-between pb-8 border-b border-white/10">
                <h2 className="text-3xl md:text-5xl neon-text">{t('name_label')}</h2>
                <div className="flex -space-x-3 rtl:space-x-reverse">
                  {selectedServices.map(id => {
                    const s = services.find(x => x.id === id);
                    if (!s) return null;
                    return (
                      <div key={id} className={`w-12 h-12 rounded-full border-4 border-[#030305] ${s.bg} flex items-center justify-center`}>
                        <s.icon className={`w-5 h-5 ${s.color}`} />
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              <div className="space-y-8">
                <motion.div variants={itemVariants} className="space-y-3">
                  <label className="text-xs text-primary font-bold tracking-[0.2em] uppercase px-4">{t('name_label')}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('name_placeholder')}
                    className="input-field"
                  />
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-3">
                  <div className="flex justify-between items-center px-4 flex-wrap gap-2">
                    <label className="text-xs text-primary font-bold tracking-[0.2em] uppercase">{t('location_label')}</label>
                    {locationSuccess && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-xs text-green-400 flex items-center gap-1 font-bold bg-green-500/10 px-3 py-1 rounded-full"
                      >
                        <CheckCircle2 className="w-3 h-3" /> تم النسخ للحافظة ✓
                      </motion.span>
                    )}
                    {locationError && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-red-400 flex items-center gap-1 font-bold bg-red-500/10 px-3 py-1 rounded-full"
                      >
                        <AlertTriangle className="w-3 h-3" /> {locationError}
                      </motion.span>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={t('loc_placeholder')}
                      className="input-field pr-16 rtl:pl-16 rtl:pr-6"
                    />
                    <button
                      onClick={() => {
                        setLocationSuccess(false);
                        detectLocation(() => {
                          setLocationSuccess(true);
                          setTimeout(() => setLocationSuccess(false), 3000);
                        });
                      }}
                      className="absolute top-1/2 -translate-y-1/2 right-3 rtl:right-auto rtl:left-3 p-3 bg-white/5 hover:bg-white/10 rounded-[1rem] transition-colors text-white/50 hover:text-primary"
                    >
                      {locationLoading ? (
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent animate-spin rounded-full" />
                      ) : (
                        <MapPin className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-4">
                  <label className="text-xs text-primary font-bold tracking-[0.2em] uppercase px-4">{t('payment_label')}</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      className={`flex flex-col items-center gap-3 p-6 rounded-[2rem] border-2 transition-all ${paymentMethod === 'cash'
                        ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(var(--primary-glow-rgb),0.2)]'
                        : 'border-white/5 bg-white/5 hover:bg-white/10'
                        }`}
                    >
                      <Wallet className={`w-8 h-8 ${paymentMethod === 'cash' ? 'text-primary' : 'text-white/40'}`} />
                      <span className={`font-bold tracking-wide ${paymentMethod === 'cash' ? 'text-white' : 'text-white/40'}`}>{t('cash')}</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('bank')}
                      className={`flex flex-col items-center gap-3 p-6 rounded-[2rem] border-2 transition-all ${paymentMethod === 'bank'
                        ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(var(--primary-glow-rgb),0.2)]'
                        : 'border-white/5 bg-white/5 hover:bg-white/10'
                        }`}
                    >
                      <CreditCard className={`w-8 h-8 ${paymentMethod === 'bank' ? 'text-primary' : 'text-white/40'}`} />
                      <span className={`font-bold tracking-wide ${paymentMethod === 'bank' ? 'text-white' : 'text-white/40'}`}>{t('bank')}</span>
                    </button>
                  </div>
                </motion.div>
              </div>

              <motion.div variants={itemVariants} className="flex gap-4 pt-4">
                <button onClick={handleBack} className="btn-secondary flex-1">{t('modify_artifact')}</button>
                <button
                  onClick={handleNext}
                  disabled={!name.trim() || !address.trim() || !paymentMethod || isProcessing}
                  className="btn-primary flex-1 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  {isProcessing ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                  ) : t('ready')}
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* STEP 3: CONFIRM */}
          {step === 3 && (
            <motion.div
              key="step3"
              layoutId="order-flow-card"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-2xl glass-card p-10 md:p-14 text-center space-y-6"
              style={{ borderRadius: '2.5rem' }}
            >
              <div className="space-y-4">
                <motion.div variants={itemVariants} className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_-5px_var(--primary-glow)]">
                  <CheckCircle2 className="w-12 h-12 text-primary" />
                </motion.div>
                <motion.h2 variants={itemVariants} className="text-3xl md:text-5xl neon-text">{t('data_check')}</motion.h2>
              </div>

              <motion.div variants={itemVariants} className="glass-panel p-8 rounded-[2rem] text-left rtl:text-right space-y-6">
                <div className="flex justify-between border-b border-white/10 pb-4">
                  <span className="text-white/40 font-bold text-sm tracking-widest">{t('name_label')}</span>
                  <span className="font-bold text-lg text-white">{name || '---'}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-4">
                  <span className="text-white/40 font-bold text-sm tracking-widest">{t('location_label')}</span>
                  <span className="font-bold text-lg text-white truncate max-w-[200px]">{address || '---'}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-4">
                  <span className="text-white/40 font-bold text-sm tracking-widest">{t('payment_label')}</span>
                  <span className="font-bold text-lg text-white">{paymentMethod === 'cash' ? t('cash') : t('bank')}</span>
                </div>
                <div className="space-y-3 pt-2">
                  <span className="text-white/40 font-bold text-sm tracking-widest block">{t('services_header')}</span>
                  {selectedServices.map(id => (
                    <div key={id} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                      <span className="font-bold text-white/90">{t(id + '_title')}</span>
                      <span className="text-primary font-black">{services.find(s => s.id === id)?.price} {t('sar')}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="flex flex-col items-center gap-2 py-4">
                <span className="text-white/40 font-bold uppercase tracking-widest text-xs">{t('total_value')}</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black text-primary text-shadow-glow">
                    {selectedServices.reduce((acc, curr) => acc + (services.find(s => s.id === curr)?.price || 0), 0)}
                  </span>
                  <span className="text-xl font-bold text-white/60">{t('sar')}</span>
                </div>
                <span className="text-xs text-white/40 font-bold bg-white/5 px-3 py-1 rounded-full">{t('negotiable')}</span>
              </motion.div>

              <motion.div variants={itemVariants} className="flex flex-col gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={handleSend}
                  className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-xl py-6 rounded-full flex items-center justify-center gap-3 transition-colors shadow-[0_0_30px_rgba(37,211,102,0.3)]"
                >
                  <Send className="w-6 h-6" />
                  {t('send_whatsapp')}
                </motion.button>
                <button onClick={handleBack} className="text-white/30 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest py-2">
                  {t('modify_artifact')}
                </button>
              </motion.div>

            </motion.div>
          )}

        </AnimatePresence>

        {/* Footer */}
        <div className="mt-20 max-w-2xl text-center space-y-4 opacity-60">
          <div className="flex justify-center">
            <div className="w-16 h-1 bg-white/10 rounded-full" />
          </div>
          <p className="text-sm font-medium text-white/50">
            {t('taif_service')}
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;
