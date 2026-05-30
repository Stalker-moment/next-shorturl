// app/page.tsx
"use client";
import React from 'react';
import Link from 'next/link';
import UrlShortenerForm from '@/components/landing';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowRight, faChartLine, faBolt, faShieldAlt, 
  faMagic, faGlobe, faLayerGroup, faQrcode 
} from '@fortawesome/free-solid-svg-icons';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSession } from 'next-auth/react';

const BRAND_LOGOS = ['GOOGLE', 'NETFLIX', 'SHOPIFY', 'AIRBNB', 'STRIPE', 'NOTION', 'FIGMA', 'GITHUB'];

const FEATURES = [
  { 
    icon: faChartLine, 
    key: "stats",
    iconColor: "text-blue-500 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-500/10"
  },
  { 
    icon: faQrcode, 
    key: "qr",
    iconColor: "text-violet-500 dark:text-violet-400",
    bgColor: "bg-violet-50 dark:bg-violet-500/10"
  },
  { 
    icon: faBolt, 
    key: "speed",
    iconColor: "text-amber-500 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-500/10"
  },
  { 
    icon: faShieldAlt, 
    key: "secure",
    iconColor: "text-emerald-500 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-500/10"
  },
  { 
    icon: faGlobe, 
    key: "domain",
    iconColor: "text-rose-500 dark:text-rose-400",
    bgColor: "bg-rose-50 dark:bg-rose-500/10"
  },
  { 
    icon: faLayerGroup, 
    key: "biolink",
    iconColor: "text-fuchsia-500 dark:text-fuchsia-400",
    bgColor: "bg-fuchsia-50 dark:bg-fuchsia-500/10"
  }
];

const HomePage = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  const { language, t } = useLanguage();
  const { data: session } = useSession();
  const [lowestPrice, setLowestPrice] = React.useState<number | null>(null);
  const [activePlans, setActivePlans] = React.useState<any[]>([]);
  const [showPlansModal, setShowPlansModal] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/user/pricing/plans")
      .then(res => res.json())
      .then(json => {
        const plans = json.data || [];
        setActivePlans(plans);
        const nonFreePrices = plans
          .filter((p: any) => p.id !== "FREE" && p.isActive && p.price > 0)
          .map((p: any) => p.price);
        if (nonFreePrices.length > 0) {
          const minPrice = Math.min(...nonFreePrices);
          setLowestPrice(minPrice);
        }
      })
      .catch(err => console.error("Error loading pricing plans for landing page:", err));
  }, []);

  const priceDisplay = lowestPrice !== null
    ? (language === 'en' 
        ? `Starts at Rp${lowestPrice.toLocaleString("id-ID")} / package` 
        : `Mulai Rp${lowestPrice.toLocaleString("id-ID")} / paket`)
    : t("home.pricing.premium.desc");

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-violet-500/30 overflow-x-hidden relative">
      
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 z-[200] origin-left"
        style={{ scaleX }}
      />

      <Navbar />

      <main className="flex-grow pt-[4.5rem] relative z-10 w-full">
        
        {/* Hero Section */}
        <section className="relative w-full flex flex-col items-center">
          <UrlShortenerForm />
        </section>

        {/* Branding Marquee */}
        <section className="py-8 bg-slate-50 dark:bg-slate-800/20 border-y border-slate-200/70 dark:border-slate-700/40 overflow-hidden">
          <div className="relative flex overflow-x-hidden">
            {/* Track 1 */}
            <div className="flex gap-12 items-center animate-marquee whitespace-nowrap shrink-0 pr-12">
              {[...BRAND_LOGOS, ...BRAND_LOGOS].map((brand, i) => (
                <span key={i} className="text-base font-black tracking-widest text-slate-300 dark:text-slate-700 uppercase select-none">{brand}</span>
              ))}
            </div>
            {/* Track 2 — offset by -50% to create seamless loop */}
            <div className="flex gap-12 items-center animate-marquee whitespace-nowrap shrink-0 pr-12" style={{ animationDelay: '-15s' }} aria-hidden>
              {[...BRAND_LOGOS, ...BRAND_LOGOS].map((brand, i) => (
                <span key={i} className="text-base font-black tracking-widest text-slate-300 dark:text-slate-700 uppercase select-none">{brand}</span>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-slate-50 dark:from-[#0f172a] to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-slate-50 dark:from-[#0f172a] to-transparent z-10" />
          </div>
          <p className="text-center mt-4 text-[10px] font-bold text-slate-400 dark:text-slate-600 tracking-[0.2em] uppercase">
            {language === 'en' ? 'TRUSTED BY USERS WORLDWIDE 🌍' : 'DIPERCAYA PENGGUNA DI SELURUH DUNIA 🌍'}
          </p>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 relative">
          <div className="max-w-6xl mx-auto px-5 sm:px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <span className="px-4 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs font-bold mb-5 inline-block border border-violet-200 dark:border-violet-800/50">
                  {t("home.features.badge")}
                </span>
                <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight mb-5">
                  {t("home.features.title_part1")} <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-fuchsia-500">{t("home.features.title_part2")}</span>
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-base font-medium leading-relaxed max-w-xl mx-auto">
                  {t("home.features.desc")}
                </p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((feat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.06 }}
                  className="glass-card hover:-translate-y-1.5 hover:shadow-md transition-all duration-200 p-7 flex flex-col group"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg mb-5 ${feat.bgColor} ${feat.iconColor} group-hover:scale-110 transition-transform duration-200`}>
                    <FontAwesomeIcon icon={feat.icon} />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2.5 tracking-tight">
                    {t(`home.feature.${feat.key}.title` as any)}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                    {t(`home.feature.${feat.key}.desc` as any)}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Account Comparison */}
        <section className="py-16 relative overflow-hidden bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-5 sm:px-6 relative z-10 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-bold mb-14 tracking-tight text-slate-900 dark:text-white"
            >
              {t("home.pricing.title_part1")} <span className="text-violet-500">{t("home.pricing.title_part2")}</span>
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {/* Guest Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="glass-card p-7 text-left flex flex-col"
              >
                <div className="flex items-center gap-4 mb-7">
                  <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-base font-bold text-slate-500 dark:text-slate-400">G</div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t("home.pricing.guest.title")}</h3>
                </div>
                <ul className="space-y-3.5 mb-8 flex-grow">
                  <li className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5 text-violet-500 shrink-0"/>
                    {t("home.pricing.guest.feat1")}
                  </li>
                  <li className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5 text-violet-500 shrink-0"/>
                    {t("home.pricing.guest.feat2")}
                  </li>
                  <li className="flex items-center gap-3 text-sm font-medium text-slate-400 dark:text-slate-600">
                    <span className="w-3.5 h-3.5 flex items-center justify-center text-slate-300 dark:text-slate-700 shrink-0">✕</span>
                    {t("home.pricing.guest.feat3")}
                  </li>
                  <li className="flex items-center gap-3 text-sm font-medium text-slate-400 dark:text-slate-600">
                    <span className="w-3.5 h-3.5 flex items-center justify-center text-slate-300 dark:text-slate-700 shrink-0">✕</span>
                    {t("home.pricing.guest.feat4")}
                  </li>
                </ul>
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-400">{t("home.pricing.guest.limit")}</p>
                </div>
              </motion.div>

              {/* Pro Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="p-7 rounded-2xl bg-violet-600 border-2 border-violet-400 dark:border-violet-500 shadow-xl shadow-violet-500/30 text-left relative overflow-hidden group flex flex-col"
              >
                {/* Decorative glow */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-3 right-3">
                  <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full backdrop-blur-sm">{t("home.pricing.pro.badge")}</span>
                </div>
                <div className="flex items-center gap-4 mb-7">
                  <div className="w-11 h-11 rounded-2xl bg-white text-violet-600 flex items-center justify-center text-base font-bold shadow-md">P</div>
                  <h3 className="text-lg font-bold text-white">{t("home.pricing.pro.title")}</h3>
                </div>
                <ul className="space-y-3.5 mb-8 flex-grow">
                  <li className="flex items-center gap-3 text-sm font-medium text-white">
                    <FontAwesomeIcon icon={faChartLine} className="w-3.5 h-3.5 text-violet-200 shrink-0"/>
                    {t("home.pricing.pro.feat1")}
                  </li>
                  <li className="flex items-center gap-3 text-sm font-medium text-white">
                    <FontAwesomeIcon icon={faQrcode} className="w-3.5 h-3.5 text-violet-200 shrink-0"/>
                    {t("home.pricing.pro.feat2")}
                  </li>
                  <li className="flex items-center gap-3 text-sm font-medium text-white">
                    <FontAwesomeIcon icon={faMagic} className="w-3.5 h-3.5 text-violet-200 shrink-0"/>
                    {t("home.pricing.pro.feat3")}
                  </li>
                  <li className="flex items-center gap-3 text-sm font-medium text-white">
                    <FontAwesomeIcon icon={faLayerGroup} className="w-3.5 h-3.5 text-violet-200 shrink-0"/>
                    {t("home.pricing.pro.feat4")}
                  </li>
                </ul>
                <Link
                  href="/signup"
                  className="block text-center py-3.5 bg-white text-violet-700 rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-md mt-auto text-sm"
                >
                  {t("home.pricing.pro.btn")}
                </Link>
              </motion.div>

              {/* Premium Promo Card ("Ala-ala Iklan") */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-7 rounded-2xl bg-gradient-to-br from-slate-950 via-[#0b0e14] to-indigo-950 border-2 border-fuchsia-500/40 dark:border-fuchsia-500/50 shadow-2xl shadow-fuchsia-500/20 text-left relative overflow-hidden group flex flex-col transform hover:-translate-y-1.5 transition-all duration-300"
              >
                {/* Decorative glows */}
                <div className="absolute -top-16 -right-16 w-48 h-48 bg-fuchsia-500/20 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
                <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

                <div className="absolute top-3 right-3">
                  <span className="px-3 py-1 bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white text-[9px] font-black rounded-full shadow-lg shadow-fuchsia-500/30 uppercase tracking-widest animate-pulse">
                    {t("home.pricing.premium.badge")}
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-7 relative z-10">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-white flex items-center justify-center text-base font-bold shadow-md shadow-fuchsia-500/20">💎</div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-tight">{t("home.pricing.premium.title")}</h3>
                </div>

                <ul className="space-y-3.5 mb-8 flex-grow relative z-10">
                  <li className="flex items-center gap-3 text-sm font-semibold text-zinc-100">
                    <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5 text-fuchsia-400 shrink-0"/>
                    {t("home.pricing.premium.feat1")}
                  </li>
                  <li className="flex items-center gap-3 text-sm font-semibold text-zinc-100">
                    <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5 text-fuchsia-400 shrink-0"/>
                    {t("home.pricing.premium.feat2")}
                  </li>
                  <li className="flex items-center gap-3 text-sm font-semibold text-zinc-100">
                    <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5 text-fuchsia-400 shrink-0"/>
                    {t("home.pricing.premium.feat3")}
                  </li>
                  <li className="flex items-center gap-3 text-sm font-semibold text-zinc-100">
                    <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5 text-fuchsia-400 shrink-0"/>
                    {t("home.pricing.premium.feat4")}
                  </li>
                </ul>

                <div className="pt-4 border-t border-white/10 mb-6 flex flex-col justify-end text-left relative z-10">
                  <span className="text-[10px] text-zinc-400 uppercase font-black tracking-widest block">Harga Mulai Dari</span>
                  <span className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-indigo-400">
                    {priceDisplay}
                  </span>
                </div>

                <button
                  onClick={() => setShowPlansModal(true)}
                  className="block w-full text-center py-3.5 bg-gradient-to-r from-fuchsia-500 to-indigo-500 hover:from-fuchsia-600 hover:to-indigo-600 text-white rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-fuchsia-500/20 text-xs uppercase tracking-widest relative z-10"
                >
                  {t("home.pricing.premium.btn")}
                </button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 relative">
          <div className="max-w-4xl mx-auto px-5 sm:px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 p-8 sm:p-16 text-center rounded-3xl shadow-sm border border-violet-200/50 dark:border-violet-800/30"
            >
              <span className="px-4 py-1.5 rounded-full bg-violet-200/60 dark:bg-violet-800/30 text-violet-700 dark:text-violet-400 text-xs font-bold mb-6 inline-block">
                {language === 'en' ? '🎉 Free Forever' : '🎉 Gratis Selamanya'}
              </span>
              <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight mb-5">
                {language === 'en' ? 'Start Creating Your Amazing Links Today!' : 'Mulai Bikin Link Hebatmu Hari Ini Juga!'}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-base max-w-md mx-auto mb-10 font-medium leading-relaxed">
                {language === 'en' 
                  ? "Thousands of people have joined and felt how easy it is to manage links. Now it's your turn!" 
                  : "Ribuan orang udah gabung dan ngerasain gampangnya ngatur link. Sekarang giliran kamu!"}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Link href="/signup">
                  <button
                    id="cta-signup-btn"
                    className="w-full sm:w-auto px-8 py-3.5 bg-violet-600 text-white font-bold rounded-2xl hover:bg-violet-700 transition-all shadow-lg shadow-violet-500/30 hover:-translate-y-0.5 text-sm"
                  >
                    {language === 'en' ? "Let's Sign Up! 🚀" : "Yuk, Daftar Akun! 🚀"}
                  </button>
                </Link>
                <Link href="/#features">
                  <button
                    id="cta-learn-btn"
                    className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm border border-slate-200 dark:border-slate-700 text-sm hover:-translate-y-0.5"
                  >
                    {language === 'en' ? "Learn More 🤔" : "Pelajari Dulu 🤔"}
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

      </main>

      <AnimatePresence>
        {showPlansModal && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <div className="absolute inset-0" onClick={() => setShowPlansModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0b0f19]/95 border border-white/10 text-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 relative flex flex-col max-h-[90vh] z-10"
            >
              {/* Pulsing neon glows in the modal background */}
              <div className="absolute -top-32 -right-32 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6 shrink-0 relative z-10">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💎</span>
                  <div className="text-left">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-fuchsia-400">Pilihan Paket Premium</h4>
                    <h3 className="text-base sm:text-lg font-bold truncate uppercase tracking-tight">Expand Your Boundaries</h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowPlansModal(false)}
                  className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white text-xs font-bold transition-all"
                >
                  ✕
                </button>
              </div>

              {/* Plans Comparison Grid */}
              <div className="flex-grow overflow-y-auto pr-1 space-y-4 max-h-[60vh] relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {/* Free Plan (Always included as a base comparison) */}
                  <div className="bg-white/5 border border-white/5 p-5 rounded-2xl flex flex-col justify-between hover:border-white/10 transition-all opacity-80 text-left">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-extrabold text-sm uppercase text-zinc-300">Free Basic</h4>
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-zinc-700/50 text-zinc-300">Aktif</span>
                      </div>
                      <div className="text-xl font-black text-zinc-100 mb-4">Rp0 <span className="text-[10px] font-normal text-zinc-400">/ selamanya</span></div>
                      <ul className="space-y-2 text-[11px] text-zinc-400 mb-6">
                        <li>⏱️ Durasi: <b>Selamanya</b></li>
                        <li>🚀 Limit Link: <b>100 Aset</b></li>
                        <li>📝 Pastes: <b>20 Paste</b></li>
                        <li>🔒 Paste Rooms: <b>1 Room</b></li>
                        <li>🌐 Custom DNS: <b>1 Domain</b></li>
                      </ul>
                    </div>
                    <Link
                      href={session ? "/manage" : "/signup"}
                      className="block text-center py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all font-sans"
                    >
                      {session ? "Buka Dashboard" : "Mulai Gratis"}
                    </Link>
                  </div>

                  {/* Active Premium plans loaded dynamically */}
                  {activePlans
                    .filter((p: any) => p.id !== "FREE" && p.isActive)
                    .map((plan: any) => {
                      const signupUrl = `/signup?callbackUrl=/manage/billing&planId=${plan.id}`;
                      const checkoutUrl = "/manage/billing";
                      const buttonUrl = session ? checkoutUrl : signupUrl;

                      return (
                        <div
                          key={plan.id}
                          className="bg-gradient-to-b from-[#111625] to-[#0a0d18] border border-fuchsia-500/20 p-5 rounded-2xl flex flex-col justify-between hover:border-fuchsia-500/40 transition-all relative group shadow-lg text-left"
                        >
                          {plan.isPayAsYouGo && (
                            <span className="absolute top-4 right-4 px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 text-[8px] font-black uppercase tracking-widest border border-violet-500/30">
                              Pay As You Go
                            </span>
                          )}
                          <div>
                            <div className="mb-3">
                              <h4 className="font-extrabold text-sm uppercase text-white truncate">{plan.name}</h4>
                              <span className="text-[8px] font-mono text-fuchsia-400 font-bold uppercase tracking-wider">{plan.id}</span>
                            </div>
                            <div className="text-xl font-black text-fuchsia-400 mb-4">
                              Rp{plan.price.toLocaleString("id-ID")}
                              <span className="text-[10px] font-normal text-zinc-400"> / {plan.days} hari</span>
                            </div>
                            <ul className="space-y-2 text-[11px] text-zinc-300 mb-6 font-medium">
                              <li>⏱️ Durasi: <b>{plan.days} Hari</b></li>
                              <li>🚀 Limit Link: <b>{plan.maxAssets} Combined</b></li>
                              <li>📝 Pastes: <b>{plan.maxPastes} Paste</b></li>
                              <li>🔒 Paste Rooms: <b>{plan.maxRooms} Rooms</b></li>
                              <li>🌐 Custom DNS: <b>{plan.maxDomains} Domains</b></li>
                            </ul>
                          </div>
                          <Link
                            href={buttonUrl}
                            className="block text-center py-2.5 bg-gradient-to-r from-fuchsia-500 to-indigo-500 hover:from-fuchsia-600 hover:to-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 font-sans"
                          >
                            {session ? "Upgrade Sekarang ⚡" : "Daftar & Langganan ⚡"}
                          </Link>
                        </div>
                      );
                    })}

                  {activePlans.filter((p: any) => p.id !== "FREE" && p.isActive).length === 0 && (
                    <div className="col-span-2 bg-white/5 rounded-2xl p-8 text-center flex items-center justify-center border border-dashed border-white/10">
                      <p className="text-xs text-zinc-400 uppercase font-bold tracking-widest">Tidak ada paket tambahan yang tersedia saat ini.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default HomePage;
