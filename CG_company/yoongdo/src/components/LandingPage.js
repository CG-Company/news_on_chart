"use client";
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import BlurText from './BlurText';
import Aurora from './Aurora';
import { TrendingUp, BarChart3, Newspaper, Zap, Sparkles, Star, ArrowRight, Play } from 'lucide-react';

const LandingPage = ({ onEnterApp, onNavigate }) => {
  const [showContent, setShowContent] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // 페이지 로드 후 조금 지연 후 애니메이션 시작
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
      {/* Aurora 배경 */}
      <Aurora 
        colorStops={["#2563eb", "#000000", "#8b5cf6"]}
        amplitude={1.5}
        blend={0.4}
        speed={0.6}
      />
      
      {/* 배경 그래픽 요소들 */}
      <div className="absolute inset-0 overflow-hidden z-2">
        {/* 원형 그래픽들 */}
        <motion.div
          className="absolute top-10 left-10 w-96 h-96 border border-gray-700 rounded-full opacity-20"
          initial={{ scale: 0, rotate: 0 }}
          animate={{ scale: 1, rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute top-32 right-20 w-64 h-64 border border-gray-600 rounded-full opacity-15"
          initial={{ scale: 0, rotate: 0 }}
          animate={{ scale: 1, rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute bottom-20 left-32 w-80 h-80 border border-gray-700 rounded-full opacity-10"
          initial={{ scale: 0, rotate: 0 }}
          animate={{ scale: 1, rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute bottom-10 right-10 w-52 h-52 border border-gray-600 rounded-full opacity-25"
          initial={{ scale: 0, rotate: 0 }}
          animate={{ scale: 1, rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />

        {/* 곡선 라인들 */}
        <svg className="absolute inset-0 w-full h-full opacity-10">
          <motion.path
            d="M0,300 Q400,100 800,300 T1600,300"
            stroke="rgb(156, 163, 175)"
            strokeWidth="1"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 3, delay: 1 }}
          />
          <motion.path
            d="M0,500 Q600,200 1200,500 T2400,500"
            stroke="rgb(156, 163, 175)"
            strokeWidth="1"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 3, delay: 1.5 }}
          />
        </svg>
      </div>

      {/* 상단 네비게이션 */}
      <motion.nav
        className="relative z-20 flex items-center justify-between p-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded transform rotate-12 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg">CG finance</span>
        </div>
        
        <div className="hidden md:flex space-x-8 text-gray-300">
          <motion.button
            onClick={() => onNavigate('chart')}
            className="hover:text-white transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            NEWS & CHART
          </motion.button>
          <motion.button
            onClick={() => onNavigate('analysis')}
            className="hover:text-white transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ANALYSIS
          </motion.button>
          <motion.button
            onClick={() => onNavigate('community')}
            className="hover:text-white transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            COMMUNITY
          </motion.button>
        </div>

        <motion.button
          className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-6 py-2 rounded-full font-bold hover:shadow-lg transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onEnterApp}
        >
          START
        </motion.button>
      </motion.nav>

      {/* 메인 컨텐츠 */}
      <div className="relative z-20 flex flex-col items-center justify-center min-h-[80vh] px-4">
        {/* 서브 타이틀 */}
        <motion.div
          className="flex items-center space-x-2 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <span className="text-gray-400 text-sm font-medium">Next-generation of Stock Analysis.</span>
        </motion.div>

        {/* 메인 타이틀 */}
        <div className="text-center mb-8">
          <BlurText
            text="NEWS ON CHART"
            className="text-6xl md:text-8xl font-bold text-white mb-4 justify-center"
            delay={150}
            animateBy="words"
            direction="top"
          />
          <motion.div
            className="flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 2 }}
          >
            <BarChart3 className="w-12 h-12 text-yellow-500 ml-4" />
          </motion.div>
        </div>

        {/* 설명 텍스트 */}
        <motion.div
          className="text-center max-w-2xl mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.5 }}
        >
          <BlurText
            text="Analyze news and stock prices in one chart for investment insights."
            className="text-xl text-gray-300 mb-6 justify-center"
            delay={100}
            animateBy="words"
            direction="top"
          />
        </motion.div>

        {/* CTA 버튼 */}
        <motion.div
          className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.2 }}
        >
          <motion.button
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all flex items-center space-x-2"
            whileHover={{ scale: 1.05, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
            whileTap={{ scale: 0.95 }}
            onClick={onEnterApp}
          >
            <TrendingUp className="w-5 h-5" />
            <span>Get Started</span>
          </motion.button>
        </motion.div>

        {/* 기능 아이콘들 */}
        <motion.div
          className="flex items-center space-x-8 mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.5 }}
        >
          <div className="flex flex-col items-center space-y-2 text-gray-400">
            <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <span className="text-sm">실시간 차트</span>
          </div>
          <div className="flex flex-col items-center space-y-2 text-gray-400">
            <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
              <Newspaper className="w-6 h-6" />
            </div>
            <span className="text-sm">뉴스 분석</span>
          </div>
          <div className="flex flex-col items-center space-y-2 text-gray-400">
            <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-sm">AI 인사이트</span>
          </div>
        </motion.div>
      </div>

      {/* 하단 정보 */}
      <motion.div
        className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-center z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 3 }}
      >
        <div className="flex items-center space-x-2 text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm">Next-Gen Stock Analysis</span>
        </div>
      </motion.div>
    </div>
  );
};

export default LandingPage; 