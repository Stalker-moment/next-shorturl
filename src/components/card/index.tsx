// components/ConfirmationCard.tsx
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faArrowLeft, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import styles from './ConfirmationCard.module.css'; // Import CSS Module

interface ConfirmationCardProps {
  url: string; // URL tujuan redirect
}

const COUNTDOWN_SECONDS = 3;
const REDIRECT_DELAY_MS = 900; // Harus >= durasi transisi splash CSS (800ms)
const SHOW_SPLASH_TEXT_BEFORE_REDIRECT_MS = 450; // Tampilkan teks X ms sebelum redirect

const ConfirmationCard: React.FC<ConfirmationCardProps> = ({ url }) => {
  const router = useRouter();
  const [countdown, setCountdown] = useState<number>(COUNTDOWN_SECONDS);
  const [isCountingDown, setIsCountingDown] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false); // Untuk animasi masuk awal
  const [isSplashActive, setIsSplashActive] = useState<boolean>(false);
  const [isSplashTextVisible, setIsSplashTextVisible] = useState<boolean>(false);
  const [animateTick, setAnimateTick] = useState<boolean>(false); // Untuk trigger animasi angka
  const [isCardVisible, setIsCardVisible] = useState<boolean>(true); // Untuk fade out card

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const splashTextTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Efek untuk animasi mount awal card
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100); // Delay kecil
    return () => clearTimeout(timer);
  }, []);

  // Efek untuk countdown timer
  useEffect(() => {
    if (isCountingDown) {
      setAnimateTick(true); // Animasikan angka awal
      intervalRef.current = setInterval(() => {
        setCountdown((prevCountdown) => {
          const nextCountdown = prevCountdown - 1;
          if (nextCountdown >= 0) {
              setAnimateTick(true); // Animasikan setiap tick
          }
          if (nextCountdown < 0) {
            clearInterval(intervalRef.current!);
            setIsCardVisible(false); // Mulai fade out card
            setIsSplashActive(true); // Mulai animasi splash
            return -1; // Tandai selesai
          }
          return nextCountdown;
        });
      }, 1000);
    }

    // Cleanup interval on unmount or if countdown stops
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isCountingDown]);

  // Efek untuk handle animasi tick (reset class)
  useEffect(() => {
      if (animateTick) {
          const timer = setTimeout(() => setAnimateTick(false), 400); // Durasi animasi
          return () => clearTimeout(timer);
      }
  }, [animateTick]);

  // Efek untuk splash screen dan redirect
  useEffect(() => {
    if (isSplashActive) {
      const showTextDelay = REDIRECT_DELAY_MS - SHOW_SPLASH_TEXT_BEFORE_REDIRECT_MS;

      splashTextTimeoutRef.current = setTimeout(() => {
        setIsSplashTextVisible(true);
      }, showTextDelay > 0 ? showTextDelay : 0);

      redirectTimeoutRef.current = setTimeout(() => {
        router.push(url); // Lakukan redirect
      }, REDIRECT_DELAY_MS);
    }

    // Cleanup timeouts on unmount
    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
      if (splashTextTimeoutRef.current) clearTimeout(splashTextTimeoutRef.current);
    };
  }, [isSplashActive, router, url]);

  const handleSure = () => {
    setIsCountingDown(true);
  };

  const handleNotSure = () => {
    router.push('/'); // Kembali ke halaman utama atau halaman lain
  };

  return (
    <>
      {/* Confirmation Card */}
      <div
        id="confirmation-box"
        className={`bg-white dark:bg-gray-800 p-6 md:p-10 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-200 dark:border-gray-700 transition-all duration-500 ease-out ${
          isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        } ${
          !isCardVisible ? 'opacity-0 scale-95' : '' // Transisi keluar card
        }`}
        style={{ transitionProperty: 'opacity, transform' }} // Pastikan properti transisi didefinisikan
      >
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">
          Are you sure?
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-300 mb-1">
          You are about to be redirected to:
        </p>
        <div className="flex items-center justify-center gap-x-1.5 text-sm text-green-600 dark:text-green-400 font-medium mb-3">
          <FontAwesomeIcon icon={faShieldHalved} className="h-4 w-4" />
          <span>Protect Mode On</span>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-indigo-600 dark:text-indigo-400 break-all hover:underline text-base block mb-6"
        >
          {url}
        </a>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
          <button
            id="sureBtn"
            onClick={handleSure}
            disabled={isCountingDown}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <FontAwesomeIcon icon={faCheck} className="h-4 w-4" />
            <span>Sure, Go!</span>
          </button>
          <button
            id="notSureBtn"
            onClick={handleNotSure}
            disabled={isCountingDown}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
            <span>Not Sure</span>
          </button>
        </div>

        {/* Countdown Message */}
        <div className={`text-sm text-gray-500 dark:text-gray-400 min-h-[20px] transition-opacity duration-300 ${isCountingDown ? 'opacity-100' : 'opacity-0'}`}>
          {isCountingDown && countdown >= 0 && (
            <>
              Redirecting in{' '}
              <span id="countdown-number" className="font-semibold text-indigo-500 dark:text-indigo-400">
                <span className={animateTick ? styles.countdownTickAnimation : ''}>
                    {countdown}
                </span>
              </span>{' '}
              seconds...
            </>
          )}
        </div>
      </div>

      {/* Wave Splash Screen */}
      <div
        id="splash-screen"
        className={`fixed inset-x-0 bottom-0 h-screen w-full z-50 pointer-events-none bg-transparent ${styles.splashScreen} ${isSplashActive ? styles.splashScreenActive : ''}`}
      >
        {/* SVG Wave */}
        <svg className="absolute bottom-0 left-0 w-full h-[105%]" preserveAspectRatio="none" viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" className="fill-indigo-600 dark:fill-indigo-800" />
          <path d="M0,48L48,53.3C96,59,192,70,288,90.7C384,111,480,144,576,144C672,144,768,111,864,96C960,80,1056,85,1152,80C1248,75,1344,59,1392,50.7L1440,43L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
                className="fill-indigo-500 dark:fill-indigo-700">
          </path>
        </svg>
        {/* Splash Text */}
        <div id="splash-text" className={`absolute inset-0 flex items-center justify-center text-white text-3xl md:text-4xl font-bold pointer-events-none z-10 ${styles.splashText} ${isSplashTextVisible ? 'opacity-100' : 'opacity-0'}`}>
          Here you go!
        </div>
      </div>
    </>
  );
};

export default ConfirmationCard;