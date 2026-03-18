import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, Question } from '../store/useStore';
import { useVision } from '../hooks/useVision';
import confetti from 'canvas-confetti';
import { CheckCircle, XCircle, Trophy, ArrowRight, Printer, Facebook, Youtube, Phone, Music } from 'lucide-react';
import Footer from '../components/Footer';

export default function Game() {
  const navigate = useNavigate();
  const { questions, settings, gameState, setGameState, addLeaderboardEntry, leaderboard } = useStore();
  const { videoRef, canvasRef, tilt, fingersRaised, isReady, cameraError, initError } = useVision();

  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [tiltLocked, setTiltLocked] = useState(false);

  // Audio objects (initialized once)
  const [correctSound] = useState(() => new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'));
  const [wrongSound] = useState(() => new Audio('https://assets.mixkit.co/active_storage/sfx/2997/2997-preview.mp3'));
  const [winSound] = useState(() => new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'));
  const [bgmSound] = useState(() => {
    if (settings.customSounds?.bgm) {
      const audio = new Audio(settings.customSounds.bgm);
      audio.loop = true;
      audio.volume = 0.3; // Lower volume for BGM
      return audio;
    }
    return null;
  });

  const questionAudioRef = useRef<HTMLAudioElement | null>(null);

  const currentQ = currentQuestions[currentIndex];

  // Handle Audio Questions
  useEffect(() => {
    if (currentQ?.type === 'audio_question' && !selectedAnswer && !isGameOver && isReady) {
      if (questionAudioRef.current) {
        questionAudioRef.current.pause();
      }
      questionAudioRef.current = new Audio(currentQ.question);
      questionAudioRef.current.play().catch(e => console.warn('Audio question play blocked:', e));
    }
    
    if (selectedAnswer && questionAudioRef.current) {
      questionAudioRef.current.pause();
    }

    return () => {
      if (questionAudioRef.current) {
        questionAudioRef.current.pause();
        questionAudioRef.current = null;
      }
    };
  }, [currentQ, selectedAnswer, isGameOver, isReady]);

  // Handle BGM
  useEffect(() => {
    if (bgmSound && isReady && !isGameOver) {
      bgmSound.play().catch(e => console.warn('BGM play blocked:', e));
    }
    
    if (isGameOver && bgmSound) {
      bgmSound.pause();
      bgmSound.currentTime = 0;
    }

    return () => {
      if (bgmSound) {
        bgmSound.pause();
        bgmSound.currentTime = 0;
      }
    };
  }, [bgmSound, isReady, isGameOver]);

  useEffect(() => {
    if (!gameState.teamName) {
      navigate('/');
      return;
    }

    let qs = [...questions];
    if (settings.randomize) {
      qs = qs.sort(() => Math.random() - 0.5);
    }
    setCurrentQuestions(qs.slice(0, settings.questionsPerRound));
  }, [questions, settings, gameState.teamName, navigate]);

  useEffect(() => {
    if (!currentQ || isGameOver) return;

    // Handle selection via head tilt
    if (!selectedAnswer && !tiltLocked) {
      if (tilt === 'left') {
        handleAnswer('A');
      } else if (tilt === 'right') {
        handleAnswer('B');
      }
    }

    // Handle next question via finger raise
    if (selectedAnswer && fingersRaised > 0) {
      handleNext();
    }
  }, [tilt, fingersRaised, selectedAnswer, isGameOver, currentQ, tiltLocked]);

  const playSound = (audio: HTMLAudioElement) => {
    try {
      audio.currentTime = 0;
      audio.play().catch((e) => console.warn('Audio play blocked or failed:', e));
    } catch (e) {
      console.warn('Audio error:', e);
    }
  };

  const handleAnswer = (ans: 'A' | 'B') => {
    if (selectedAnswer) return;
    
    setTiltLocked(true);
    setSelectedAnswer(ans);
    
    const isCorrect = ans === currentQ.correct;
    if (isCorrect) {
      playSound(correctSound);
      setGameState({
        score: gameState.score + 10,
        correctAnswers: gameState.correctAnswers + 1,
      });
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10B981', '#F59E0B', '#3B82F6']
      });
    } else {
      playSound(wrongSound);
    }
  };

  const handleNext = () => {
    if (currentIndex < currentQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      // Add a small delay before unlocking tilt to prevent accidental double selections
      setTimeout(() => setTiltLocked(false), 1000);
    } else {
      setIsGameOver(true);
      playSound(winSound);
      addLeaderboardEntry({
        teamName: gameState.teamName,
        score: gameState.score,
      });
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#10B981', '#F59E0B', '#EF4444', '#3B82F6']
      });
    }
  };

  if (cameraError) {
    return (
      <div className="min-h-screen bg-red-400 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md">
          <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Lỗi Camera</h2>
          <p className="text-gray-600 mb-6">{cameraError}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-colors w-full"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-orange-400 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md">
          <XCircle className="w-20 h-20 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Lỗi tải dữ liệu AI</h2>
          <p className="text-gray-600 mb-6">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition-colors w-full"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="min-h-screen bg-emerald-400 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800">Đang khởi động AI...</h2>
          <p className="text-gray-500 mt-2">Vui lòng cho phép truy cập Camera</p>
        </div>
      </div>
    );
  }

  if (isGameOver) {
    return (
      <div className="min-h-screen bg-indigo-500 flex flex-col items-center justify-center p-4 relative">
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-10 max-w-lg w-full text-center border-4 sm:border-8 border-yellow-400 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-red-500 via-yellow-400 to-emerald-500"></div>
          
          <Trophy className="mx-auto text-yellow-500 mb-4 sm:mb-6 w-16 h-16 sm:w-20 sm:h-20" />
          
          <h1 className="text-3xl sm:text-5xl font-black text-indigo-600 mb-2 uppercase tracking-tight">
            KẾT QUẢ
          </h1>
          
          <div className="bg-indigo-50 rounded-2xl p-4 sm:p-6 my-6 sm:my-8 border-2 border-indigo-100">
            <h2 className="text-xl sm:text-3xl font-bold text-gray-800 mb-4">
              Nhóm: <span className="text-indigo-600">{gameState.teamName}</span>
            </h2>
            
            <div className="flex justify-center gap-4 sm:gap-8 text-left">
              <div>
                <p className="text-gray-500 font-medium text-sm sm:text-lg uppercase">Điểm số</p>
                <p className="text-3xl sm:text-5xl font-black text-orange-500">{gameState.score}</p>
              </div>
              <div className="w-px bg-indigo-200"></div>
              <div>
                <p className="text-gray-500 font-medium text-sm sm:text-lg uppercase">Câu đúng</p>
                <p className="text-3xl sm:text-5xl font-black text-emerald-500">
                  {gameState.correctAnswers}/{currentQuestions.length}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/certificate')}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 text-xl sm:text-2xl font-black py-3 sm:py-4 px-4 sm:px-8 rounded-2xl shadow-[0_4px_0_rgb(202,138,4)] sm:shadow-[0_6px_0_rgb(202,138,4)] hover:shadow-[0_2px_0_rgb(202,138,4)] hover:translate-y-1 transition-all flex items-center justify-center gap-2 sm:gap-3"
            >
              <Printer className="w-6 h-6 sm:w-7 sm:h-7" />
              IN GIẤY KHEN
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 text-lg sm:text-xl font-bold py-3 sm:py-4 px-4 sm:px-8 rounded-2xl transition-colors"
            >
              Quay lại trang đăng nhập
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!currentQ) return null;

  return (
    <div className="min-h-[100dvh] bg-sky-100 flex flex-col p-2 sm:p-4 md:p-8 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-3 sm:mb-6 bg-white p-3 sm:p-4 rounded-2xl shadow-sm border-2 border-sky-200 gap-2 sm:gap-0">
        <div className="text-lg sm:text-2xl font-bold text-sky-800 text-center sm:text-left">
          Nhóm: <span className="text-orange-500">{gameState.teamName}</span>
        </div>
        <div className="flex gap-2 sm:gap-6 text-sm sm:text-xl font-bold">
          <div className="bg-emerald-100 text-emerald-700 px-3 py-1 sm:px-4 sm:py-2 rounded-xl border border-emerald-200 whitespace-nowrap">
            Câu: {currentIndex + 1}/{currentQuestions.length}
          </div>
          <div className="bg-orange-100 text-orange-700 px-3 py-1 sm:px-4 sm:py-2 rounded-xl border border-orange-200 whitespace-nowrap">
            Điểm: {gameState.score}
          </div>
        </div>
      </div>

      {/* Main Content & Sidebar */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 sm:gap-6 min-h-0">
        {/* Left: Main Game Area */}
        <div className="flex-1 flex flex-col gap-3 sm:gap-6 min-h-0">
          {/* Question Area */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-8 text-center border-4 border-sky-300 flex-1 flex flex-col justify-center items-center relative overflow-hidden min-h-[120px] sm:min-h-[200px]">
            {currentQ.type === 'image_question' ? (
              <img src={currentQ.question} alt="Question" className="max-h-full max-w-full object-contain rounded-xl z-10" />
            ) : currentQ.type === 'audio_question' ? (
              <div className="flex flex-col items-center gap-4 z-10">
                <div className="w-24 h-24 bg-sky-100 rounded-full flex items-center justify-center text-sky-500 animate-pulse">
                  <Music size={48} />
                </div>
                <h2 className="text-xl sm:text-3xl font-bold text-sky-800">Nghe và chọn đáp án đúng</h2>
                <button 
                  onClick={() => {
                    if (questionAudioRef.current) {
                      questionAudioRef.current.currentTime = 0;
                      questionAudioRef.current.play();
                    }
                  }}
                  className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 transition-colors"
                >
                  <Music size={20} /> Nghe lại
                </button>
              </div>
            ) : (
              <h2 className="text-xl sm:text-3xl md:text-5xl font-black text-gray-800 leading-tight z-10 px-2 sm:px-16 md:px-32 w-full break-words">
                {currentQ.question}
              </h2>
            )}
          </div>

          {/* Answers Area */}
          <div className="grid grid-cols-2 gap-3 sm:gap-6 flex-1 sm:flex-none sm:h-64 md:h-80 min-h-[200px]">
          {/* Option A */}
          <div 
            className={`relative rounded-2xl sm:rounded-3xl border-4 sm:border-8 transition-all duration-300 flex flex-col items-center justify-center p-3 sm:p-6 cursor-pointer overflow-hidden
              ${selectedAnswer === 'A' 
                ? currentQ.correct === 'A' 
                  ? 'border-emerald-500 bg-emerald-100 scale-105 shadow-2xl z-10' 
                  : 'border-red-500 bg-red-100 scale-95 opacity-70'
                : 'border-rose-400 bg-rose-50 hover:bg-rose-100 shadow-lg'
              }
              ${tilt === 'left' && !selectedAnswer ? 'scale-105 border-rose-500 shadow-2xl z-10' : ''}
            `}
            onClick={() => handleAnswer('A')}
          >
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4 w-8 h-8 sm:w-12 sm:h-12 bg-rose-500 text-white rounded-full flex items-center justify-center text-lg sm:text-2xl font-black shadow-md z-20">
              A
            </div>
            
            <div className="w-full h-full flex items-center justify-center mt-6 sm:mt-0">
              {currentQ.A_type === 'image' || (currentQ.type === 'image' && !currentQ.A_type) ? (
                <img src={currentQ.A} alt="Option A" className="max-h-full max-w-full object-contain rounded-lg sm:rounded-xl" />
              ) : (
                <span className="text-2xl sm:text-4xl md:text-6xl font-bold text-gray-800 text-center break-words px-2">{currentQ.A}</span>
              )}
            </div>

            {selectedAnswer === 'A' && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl sm:rounded-2xl backdrop-blur-sm z-30">
                {currentQ.correct === 'A' ? (
                  <div className="flex flex-col items-center animate-bounce p-2 text-center">
                    <span className="text-5xl sm:text-7xl md:text-8xl">🌟</span>
                    <span className="text-lg sm:text-2xl md:text-3xl font-black text-emerald-600 mt-2 bg-white px-3 py-1 sm:px-4 sm:py-1 rounded-full shadow-md whitespace-nowrap">ĐÚNG RỒI!</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center animate-pulse p-2 text-center">
                    <span className="text-5xl sm:text-7xl md:text-8xl">🤪</span>
                    <span className="text-lg sm:text-2xl md:text-3xl font-black text-red-600 mt-2 bg-white px-3 py-1 sm:px-4 sm:py-1 rounded-full shadow-md whitespace-nowrap">SAI MẤT TIÊU!</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Option B */}
          <div 
            className={`relative rounded-2xl sm:rounded-3xl border-4 sm:border-8 transition-all duration-300 flex flex-col items-center justify-center p-3 sm:p-6 cursor-pointer overflow-hidden
              ${selectedAnswer === 'B' 
                ? currentQ.correct === 'B' 
                  ? 'border-emerald-500 bg-emerald-100 scale-105 shadow-2xl z-10' 
                  : 'border-red-500 bg-red-100 scale-95 opacity-70'
                : 'border-blue-400 bg-blue-50 hover:bg-blue-100 shadow-lg'
              }
              ${tilt === 'right' && !selectedAnswer ? 'scale-105 border-blue-500 shadow-2xl z-10' : ''}
            `}
            onClick={() => handleAnswer('B')}
          >
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-8 h-8 sm:w-12 sm:h-12 bg-blue-500 text-white rounded-full flex items-center justify-center text-lg sm:text-2xl font-black shadow-md z-20">
              B
            </div>
            
            <div className="w-full h-full flex items-center justify-center mt-6 sm:mt-0">
              {currentQ.B_type === 'image' || (currentQ.type === 'image' && !currentQ.B_type) ? (
                <img src={currentQ.B} alt="Option B" className="max-h-full max-w-full object-contain rounded-lg sm:rounded-xl" />
              ) : (
                <span className="text-2xl sm:text-4xl md:text-6xl font-bold text-gray-800 text-center break-words px-2">{currentQ.B}</span>
              )}
            </div>

            {selectedAnswer === 'B' && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl sm:rounded-2xl backdrop-blur-sm z-30">
                {currentQ.correct === 'B' ? (
                  <div className="flex flex-col items-center animate-bounce p-2 text-center">
                    <span className="text-5xl sm:text-7xl md:text-8xl">🌟</span>
                    <span className="text-lg sm:text-2xl md:text-3xl font-black text-emerald-600 mt-2 bg-white px-3 py-1 sm:px-4 sm:py-1 rounded-full shadow-md whitespace-nowrap">ĐÚNG RỒI!</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center animate-pulse p-2 text-center">
                    <span className="text-5xl sm:text-7xl md:text-8xl">🤪</span>
                    <span className="text-lg sm:text-2xl md:text-3xl font-black text-red-600 mt-2 bg-white px-3 py-1 sm:px-4 sm:py-1 rounded-full shadow-md whitespace-nowrap">SAI MẤT TIÊU!</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Right: Sidebar (Camera + Leaderboard) */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          {/* Camera View */}
          <div className="bg-white rounded-2xl shadow-sm border-2 border-sky-200 p-2 relative aspect-video overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover transform scale-x-[-1] rounded-xl bg-gray-900" playsInline muted />
            <canvas ref={canvasRef} className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] transform scale-x-[-1]" />
            {/* Status indicators */}
            <div className="absolute bottom-4 left-4 flex gap-2">
              <span className={`w-4 h-4 rounded-full shadow-md border border-white/50 ${tilt === 'left' ? 'bg-red-500' : tilt === 'right' ? 'bg-blue-500' : 'bg-green-500'}`}></span>
              <span className={`w-4 h-4 rounded-full shadow-md border border-white/50 ${fingersRaised > 0 ? 'bg-yellow-400' : 'bg-gray-500'}`}></span>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-white rounded-2xl shadow-sm border-2 border-sky-200 p-4 flex-1 flex flex-col">
            <h3 className="text-lg font-bold text-sky-800 mb-4 flex items-center gap-2 pb-2 border-b-2 border-sky-100">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Top 5 Vinh Danh
            </h3>
            <div className="space-y-3 flex-1 overflow-y-auto">
              {leaderboard.length === 0 ? (
                <p className="text-gray-500 text-sm text-center italic mt-4">Chưa có dữ liệu</p>
              ) : (
                leaderboard.map((entry, idx) => (
                  <div key={entry.id} className="flex items-center justify-between bg-sky-50 p-3 rounded-xl border border-sky-100 hover:bg-sky-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold shadow-sm ${idx === 0 ? 'bg-yellow-400 text-yellow-900' : idx === 1 ? 'bg-gray-300 text-gray-800' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-sky-200 text-sky-800'}`}>
                        {idx + 1}
                      </span>
                      <span className="font-bold text-gray-700 truncate max-w-[120px]" title={entry.teamName}>{entry.teamName}</span>
                    </div>
                    <span className="font-black text-orange-500 text-lg">{entry.score}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white rounded-2xl shadow-sm border-2 border-sky-200 p-3 flex justify-center gap-4">
            <a 
              href="https://www.facebook.com/vanhuong1982" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:scale-110 transition-transform bg-blue-50 p-2 rounded-full"
              title="Facebook Tác giả"
            >
              <Facebook size={20} />
            </a>
            <a 
              href="https://zalo.me/0355936256" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-800 hover:scale-110 transition-transform bg-green-50 p-2 rounded-full"
              title="Zalo Tác giả"
            >
              <Phone size={20} />
            </a>
            <a 
              href="https://www.youtube.com/@SO%E1%BA%A0NGI%E1%BA%A2NGTV" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-red-600 hover:text-red-800 hover:scale-110 transition-transform bg-red-50 p-2 rounded-full"
              title="Youtube Soạn Giảng TV"
            >
              <Youtube size={20} />
            </a>
          </div>
        </div>
      </div>

      {/* Next Question Hint */}
      {selectedAnswer && (
        <div className="fixed bottom-16 sm:bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-900/90 text-white px-4 py-3 sm:px-8 sm:py-4 rounded-full shadow-2xl flex items-center gap-2 sm:gap-4 animate-bounce z-50 w-[90%] sm:w-auto justify-center">
          <span className="text-2xl sm:text-3xl">☝️</span>
          <span className="text-lg sm:text-2xl font-bold text-center">Giơ 1 ngón tay để tiếp tục!</span>
          <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7" />
        </div>
      )}
      <Footer />
    </div>
  );
}
