// components/register/index.tsx
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLink, faEye, faEyeSlash, faSpinner, faArrowRight, faTimes, faHandshake, faShieldAlt, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import ThemeToggle from '@/components/ThemeToggle';
import GoogleSignInButton from '@/components/GoogleSignInButton';



const TermsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={onClose}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-xl max-h-[80vh] flex flex-col overflow-hidden relative"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center text-violet-600 dark:text-violet-400">
                  <FontAwesomeIcon icon={faHandshake} className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight">{t("auth.terms.modal_title")}</h3>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
              </button>
            </div>
            
            {/* Scrollable Terms Content */}
            <div className="p-8 space-y-6 overflow-y-auto max-h-[55vh] text-slate-600 dark:text-slate-400 text-sm leading-relaxed scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
              {language === 'en' ? (
                <>
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base mb-2">1. Introduction & Acceptance</h4>
                    <p>
                      Welcome to nyoo.me. By creating an account or using our platform, you agree to comply with and be bound by these Terms of Service. Please read them carefully before using our services.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base mb-2">2. Account Registration & Security</h4>
                    <p>
                      To access certain features, you must register for an account. You agree to provide accurate, current, and complete information. You are solely responsible for protecting your account credentials and for all activities that occur under your account. nyoo.me will not be liable for any loss or damage arising from your failure to protect your credentials.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base mb-2">3. Acceptable Use Policy</h4>
                    <p>
                      You agree not to use nyoo.me to shorten, share, or generate QR codes for any links that:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Contain malicious software, malware, ransomware, or phishing scripts.</li>
                      <li>Promote illegal activities, fraud, or scam campaigns.</li>
                      <li>Infringe upon intellectual property or copyright of third parties.</li>
                      <li>Distribute spam, unwanted advertising, or highly offensive material.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base mb-2">4. Rights and Terminations</h4>
                    <p>
                      We reserve the absolute right to suspend, terminate, or delete any shortened link, QR code, or user account at our sole discretion, without prior notice or liability, if we determine that you have violated these Terms.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base mb-2">5. Disclaimer of Warranties</h4>
                    <p>
                      The service is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties, expressed or implied, regarding the reliability, uptime, speed, or availability of the link redirection or QR code features.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base mb-2">6. Limitation of Liability</h4>
                    <p>
                      In no event shall nyoo.me, its operators, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or traffic, arising out of your use of the service.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base mb-2">1. Pendahuluan & Persetujuan</h4>
                    <p>
                      Selamat datang di nyoo.me. Dengan mendaftar akun atau menggunakan platform kami, Anda setuju untuk mematuhi dan terikat oleh Syarat & Ketentuan Layanan ini. Harap baca dengan cermat sebelum menggunakan layanan kami.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base mb-2">2. Pendaftaran & Keamanan Akun</h4>
                    <p>
                      Untuk mengakses fitur tertentu, Anda harus melakukan pendaftaran akun. Anda setuju untuk memberikan informasi yang akurat, terkini, dan lengkap. Anda bertanggung jawab penuh atas perlindungan kredensial akun Anda serta segala aktivitas di bawah akun Anda. nyoo.me tidak bertanggung jawab atas kerugian yang timbul dari kegagalan Anda menjaga keamanan akun.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base mb-2">3. Kebijakan Penggunaan Layanan</h4>
                    <p>
                      Anda setuju untuk tidak menggunakan nyoo.me untuk memperpendek, membagikan, atau membuat QR code dari tautan yang:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Mengandung perangkat lunak berbahaya, malware, ransomware, atau skrip phishing.</li>
                      <li>Mempromosikan aktivitas ilegal, penipuan, atau kampanye spam.</li>
                      <li>Melanggar hak kekayaan intelektual atau hak cipta pihak ketiga.</li>
                      <li>Menyebarkan spam, iklan massal tak diinginkan, atau konten yang sangat ofensif.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base mb-2">4. Hak & Penangguhan Layanan</h4>
                    <p>
                      Kami berhak sepenuhnya untuk menangguhkan, membatasi, atau menghapus tautan pendek, QR code, atau akun pengguna kapan saja tanpa pemberitahuan sebelumnya, jika kami mengidentifikasi adanya pelanggaran terhadap Syarat & Ketentuan ini.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base mb-2">5. Pernyataan Batasan Jaminan</h4>
                    <p>
                      Layanan ini disediakan "APA ADANYA" dan "SEBAGAIMANA TERSEDIA". Kami tidak memberikan jaminan apa pun, baik tersurat maupun tersirat, mengenai keandalan, ketersediaan, kecepatan redirect, atau performa kode QR kami.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base mb-2">6. Batasan Tanggung Jawab</h4>
                    <p>
                      nyoo.me, pengelola, atau afiliasinya tidak bertanggung jawab atas segala kerugian tidak langsung, insidental, khusus, konsekuensial, atau kehilangan keuntungan, data, atau trafik yang timbul dari penggunaan layanan ini oleh Anda.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-900/50">
              <button onClick={onClose} className="px-8 py-3 bg-violet-600 text-white rounded-xl font-bold text-sm shadow-md shadow-violet-500/20 hover:bg-violet-700 transition-all active:scale-[0.98]">
                {t("auth.terms.close_btn")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const RegisterPage = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t("auth.register.err_confirm_password"));
      return;
    }
    if (!agreeTerms) {
      setError(t("auth.register.err_agree_terms"));
      return;
    }

    setLoading(true);

    try {
      const apiRes = await fetch(`/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password })
      });

      const data = await apiRes.json();

      if (apiRes.ok) {
        router.push('/login?registered=true');
      } else {
        setError(data.error || t("auth.register.err_register_fail"));
        setLoading(false);
      }
    } catch {
      setError(t("auth.register.err_network"));
      setLoading(false);
    }
  };

  const handleGoogleSuccess = () => {
    // Hard redirect ensures the new session cookie is picked up correctly.
    window.location.href = '/manage';
  };

  const handleGoogleError = (msg: string) => {
    setError(msg);
  };



  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300 relative overflow-hidden text-slate-900 dark:text-slate-100 font-sans">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 dark:bg-violet-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 dark:bg-indigo-600/5 rounded-full blur-[120px]" />
      </div>

      {/* Minimal Navbar */}
      <header className="relative z-50 bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 transition-transform active:scale-[0.98] group">
            <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
              <FontAwesomeIcon icon={faLink} className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tighter">nyoo.me</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <ThemeToggle />
            <Link href="/login" className="text-sm font-bold px-5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all bg-white dark:bg-slate-900 shadow-sm">
              {t("auth.register.login_btn")}
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-6 py-12 relative z-10 w-full">
        <div className="w-full max-w-xl">
          {/* Title Section */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-3">
              {t("auth.register.title_part1")} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-indigo-400">{t("auth.register.title_part2")}</span>
            </h1>
            <p className="text-slate-500 font-medium">{t("auth.register.subtitle")}</p>
          </div>

          {/* Card */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800 p-8 sm:p-12 space-y-8 shadow-2xl shadow-slate-200/50 dark:shadow-none">
            {error && (
              <div className="p-4 text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl flex items-center gap-2">
                <span>{error}</span>
              </div>
            )}

            {/* Form — full register form first */}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="space-y-2 md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">{t("auth.register.name_label")}</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder={t("auth.register.name_placeholder")}
                  className="w-full h-12 px-4 border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl text-sm font-medium focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">{t("auth.register.email_label")}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="nama@email.com"
                  className="w-full h-12 px-4 border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl text-sm font-medium focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">{t("auth.register.password_label")}</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder={t("auth.register.password_placeholder")}
                    className="w-full h-12 px-4 border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl text-sm font-medium focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600 p-2 transition-colors">
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">{t("auth.register.confirm_password_label")}</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder={t("auth.register.confirm_password_placeholder")}
                    className="w-full h-12 px-4 border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl text-sm font-medium focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600 p-2 transition-colors">
                    <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 flex items-center gap-3 py-2 px-1">
                <button 
                  type="button" 
                  onClick={() => setAgreeTerms(!agreeTerms)}
                  className={`w-6 h-6 rounded-lg border transition-all flex items-center justify-center shrink-0 ${agreeTerms ? 'bg-violet-600 border-violet-500' : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800'}`}
                >
                  {agreeTerms && <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3 text-white" />}
                </button>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-tight">
                  {t("auth.register.agree_terms_pre")}{" "}
                  <button type="button" onClick={() => setIsTermsOpen(true)} className="text-violet-600 dark:text-violet-400 hover:text-violet-700 font-bold underline underline-offset-4">
                    {t("auth.register.agree_terms_link")}
                  </button>{" "}
                  {t("auth.register.agree_terms_post")}
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="md:col-span-2 w-full h-14 bg-violet-600 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-3 hover:bg-violet-700 transition-all active:scale-[0.98] shadow-lg shadow-violet-600/30 mt-2"
              >
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                    <span>{t("auth.register.submit_loading")}</span>
                  </>
                ) : (
                  <>
                    <span>{t("auth.register.submit")}</span> 
                    <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px]">
                <span className="px-4 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{t("auth.register.or")}</span>
              </div>
            </div>

            {/* Google Button — via GSI */}
            <GoogleSignInButton
              mode="signup"
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
            />
          </div>


          {/* Footer Links */}
          <div className="mt-8 text-center text-sm font-medium text-slate-600 dark:text-slate-400">
            {t("auth.register.login_prompt")}{" "}
            <Link href="/login" className="text-violet-600 dark:text-violet-400 font-bold hover:underline transition-colors ml-1">
              {t("auth.register.login_link")}
            </Link>
          </div>
        </div>
      </main>

      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />

      <footer className="py-8 text-center opacity-50">
        <p className="text-xs font-bold text-slate-500">© {new Date().getFullYear()} NYOO.ME</p>
      </footer>
    </div>
  );
};

export default RegisterPage;