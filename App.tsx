
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  Trophy, RotateCcw, ChevronRight, Sparkles, XCircle, 
  CheckCircle, Target, RefreshCw, Home, Volume2, 
  VolumeX, Hash, Edit3, ArrowRight, Loader2
} from 'lucide-react';
import { CharacterData, GameState, GameMode } from './types';
import { RADICALS_DATA, NUMBERS_DATA, ANIMALS } from './data';
import { fetchCharacterInfo } from './services/gemini';

// Utility to shuffle array
const shuffle = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>('welcome');
  const [mode, setMode] = useState<GameMode>('endless');
  const [focusGroup, setFocusGroup] = useState<CharacterData[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [customGroup, setCustomGroup] = useState<CharacterData[]>([]);
  const [customError, setCustomError] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  
  const [currentRadical, setCurrentRadical] = useState<CharacterData | null>(null);
  const [options, setOptions] = useState<CharacterData[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [selectedOption, setSelectedOption] = useState<CharacterData | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const avatar = useMemo(() => {
    return ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  }, []);

  const [tutorMessage, setTutorMessage] = useState(`Hi! I'm ${avatar.name}. Pick a mode to start!`);

  const speak = (text: string, force = false) => {
    if (isMuted && !force) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  const generateQuestion = useCallback((specificGroup?: CharacterData[]) => {
    let activeGroup = specificGroup;
    if (!activeGroup) {
      if (mode === 'focus') activeGroup = focusGroup;
      else if (mode === 'numbers') activeGroup = NUMBERS_DATA;
      else if (mode === 'custom') activeGroup = customGroup;
      else activeGroup = RADICALS_DATA;
    }

    if (!activeGroup || activeGroup.length === 0) {
      setTutorMessage("No characters found to quiz!");
      return;
    }

    const correct = activeGroup[Math.floor(Math.random() * activeGroup.length)];
    
    let poolForDistractors = RADICALS_DATA;
    if (mode === 'numbers') {
        poolForDistractors = NUMBERS_DATA;
    } else if (mode === 'custom') {
        poolForDistractors = [...RADICALS_DATA, ...NUMBERS_DATA, ...customGroup];
    }

    const distractors: CharacterData[] = [];
    while (distractors.length < 3) {
      const r = poolForDistractors[Math.floor(Math.random() * poolForDistractors.length)];
      if (r.char !== correct.char && !distractors.some(d => d.char === r.char)) {
        distractors.push(r);
      }
    }

    setOptions(shuffle([correct, ...distractors]));
    setCurrentRadical(correct);
    setSelectedOption(null);
    setIsCorrect(null);
  }, [mode, focusGroup, customGroup]);

  const handleStart = (selectedMode: string) => {
    if (selectedMode === 'custom_setup') {
        setGameState('setup_custom');
        setCustomError('');
        setCustomInput('');
        setTutorMessage("Paste your characters below.");
        return;
    }

    const gameMode = selectedMode as GameMode;
    setMode(gameMode);
    setScore(0);
    setStreak(0);
    setTotalAnswered(0);
    setGameState('playing');

    if (gameMode === 'focus') {
      const newGroup = shuffle([...RADICALS_DATA]).slice(0, 5);
      setFocusGroup(newGroup);
      setTutorMessage("I picked 5 random radicals for you. Let's practice!");
      generateQuestion(newGroup);
    } else if (gameMode === 'numbers') {
      setTutorMessage("Learning numbers 0-10. You got this!");
      generateQuestion(NUMBERS_DATA);
    } else {
      setTutorMessage("Endless mode! How many can you get?");
      generateQuestion(RADICALS_DATA);
    }
  };

  const handleCustomStart = async () => {
    if (!customInput.trim()) {
        setCustomError("Please type or paste some characters.");
        return;
    }

    setIsFetching(true);
    setCustomError('');

    const chars = customInput.split('').filter(c => /[\u4e00-\u9fa5]/.test(c));
    const uniqueChars = Array.from(new Set(chars));

    if (uniqueChars.length === 0) {
      setCustomError("No Chinese characters detected.");
      setIsFetching(false);
      return;
    }

    const allLocalData = [...RADICALS_DATA, ...NUMBERS_DATA];
    const localMatches = uniqueChars.map(char => allLocalData.find(r => r.char === char)).filter(Boolean) as CharacterData[];
    
    const missingChars = uniqueChars.filter(char => !allLocalData.some(r => r.char === char));

    let remoteMatches: CharacterData[] = [];
    if (missingChars.length > 0) {
      remoteMatches = await fetchCharacterInfo(missingChars);
    }

    const finalGroup = [...localMatches, ...remoteMatches];

    if (finalGroup.length > 0) {
        setMode('custom');
        setCustomGroup(finalGroup);
        setScore(0);
        setStreak(0);
        setTotalAnswered(0);
        setGameState('playing');
        setTutorMessage(`Custom list ready! ${finalGroup.length} characters loaded.`);
        generateQuestion(finalGroup);
    } else {
        setCustomError('Could not process these characters. Try radicals or simple numbers.');
    }
    setIsFetching(false);
  };

  const handleOptionClick = (option: CharacterData) => {
    if (selectedOption || !currentRadical) return;
    
    speak(currentRadical.char);
    setSelectedOption(option);
    
    const correct = option.char === currentRadical.char;
    setIsCorrect(correct);
    setTotalAnswered(prev => prev + 1);

    if (correct) {
      setScore(prev => prev + 10);
      setStreak(prev => prev + 1);
      setTutorMessage(`Correct! "${currentRadical.char}" is ${currentRadical.meaning}.`);
    } else {
      setStreak(0);
      setTutorMessage(`Oops! "${currentRadical.char}" means ${currentRadical.meaning}.`);
    }

    setTimeout(() => {
      generateQuestion();
    }, 1800);
  };

  const handleExit = () => {
    setGameState('welcome');
    setTutorMessage(`Welcome back! Ready for more?`);
  };

  const getModeTitle = () => {
    if (mode === 'focus') return 'Focus Mode (5)';
    if (mode === 'numbers') return 'Numbers 0-10';
    if (mode === 'custom') return 'Custom List';
    return 'Endless Mode';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center shadow-sm z-20 sticky top-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExit}
            className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl active:scale-95 transition-transform shadow-md shadow-indigo-100"
          >
            字
          </button>
          <div>
            <h1 className="font-extrabold text-lg text-slate-800 leading-none">Radical Master</h1>
            {gameState === 'playing' && (
              <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-0.5">
                {getModeTitle()}
              </p>
            )}
          </div>
        </div>
        
        {gameState === 'playing' ? (
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
                <div className="flex items-center gap-1.5 text-amber-600 font-bold text-sm">
                  <Trophy size={14} />
                  <span>{score}</span>
                </div>
                <div className="flex items-center gap-1.5 text-orange-500 font-bold text-xs">
                  <Sparkles size={12} />
                  <span>{streak} streak</span>
                </div>
            </div>
            <div className="h-8 w-px bg-slate-200 mx-1"></div>
            <div className="flex gap-1">
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <button 
                  onClick={handleExit}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Home size={20} />
                </button>
            </div>
          </div>
        ) : (
           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">
             V2.0 PRO
           </div>
        )}
      </header>

      {/* Main Area */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 flex flex-col justify-center">
        
        {gameState === 'welcome' && (
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="relative inline-block mb-2">
              <div className="text-7xl filter drop-shadow-2xl animate-bounce-slow">{avatar.emoji}</div>
              <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white text-[10px] px-3 py-1 rounded-full font-bold shadow-lg ring-4 ring-white">
                HI, I'M {avatar.name.toUpperCase()}
              </div>
            </div>
            
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Master Chinese</h2>
              <p className="text-slate-500 font-medium">Choose your path to fluency.</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'endless', icon: <RotateCcw size={20}/>, color: 'blue', title: 'Endless Journey', desc: 'Random 214 Kangxi radicals' },
                { id: 'focus', icon: <Target size={20}/>, color: 'purple', title: 'Focus 5', desc: 'Intensive drills on a small batch' },
                { id: 'numbers', icon: <Hash size={20}/>, color: 'emerald', title: 'Numbers 0-10', desc: 'Learn to count like a pro' },
                { id: 'custom_setup', icon: <Edit3 size={20}/>, color: 'orange', title: 'Custom List', desc: 'Practice any characters you want' }
              ].map((m) => (
                <button 
                  key={m.id}
                  onClick={() => handleStart(m.id)}
                  className="group bg-white p-4 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-50 transition-all text-left flex items-center gap-4 active:scale-[0.98]"
                >
                  <div className={`bg-${m.color}-100 p-3 rounded-xl text-${m.color}-600 group-hover:scale-110 transition-transform`}>
                    {m.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{m.title}</h3>
                    <p className="text-xs text-slate-400 font-medium">{m.desc}</p>
                  </div>
                  <ChevronRight className="text-slate-300 group-hover:text-indigo-500 transition-transform group-hover:translate-x-1" size={20} />
                </button>
              ))}
            </div>
          </div>
        )}

        {gameState === 'setup_custom' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Edit3 size={32} />
                </div>
                <h2 className="text-2xl font-black text-slate-800">Create Practice List</h2>
                <p className="text-slate-500 text-sm font-medium px-8">
                   Paste any Chinese characters. Our AI will automatically identify them and fetch their Pinyin and meanings.
                </p>
            </div>

            <div className="relative">
                <textarea
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="e.g. 熊猫, 火, 水, 老师..."
                    disabled={isFetching}
                    className="w-full p-5 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-8 focus:ring-indigo-50 outline-none transition-all font-medium text-lg min-h-[160px] shadow-inner bg-white disabled:bg-slate-50 disabled:cursor-not-allowed"
                />
                {isFetching && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-2xl flex flex-col items-center justify-center gap-2">
                        <Loader2 size={32} className="text-indigo-600 animate-spin" />
                        <span className="text-xs font-bold text-indigo-700 uppercase tracking-widest">AI analyzing characters...</span>
                    </div>
                )}
            </div>

            {customError && (
                <div className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl flex items-center gap-3 border border-red-100">
                    <XCircle size={18} className="shrink-0" />
                    {customError}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                 <button 
                    onClick={() => setGameState('welcome')}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 rounded-2xl transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCustomStart}
                    disabled={isFetching}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isFetching ? 'Processing...' : 'Build List'}
                    {!isFetching && <ArrowRight size={20} />}
                  </button>
            </div>
          </div>
        )}

        {gameState === 'playing' && currentRadical && (
          <div className="space-y-6 w-full animate-in fade-in duration-500">
            
            {/* Tutor Bubble */}
            <div className="flex items-start gap-3 px-2">
              <div className="text-5xl shrink-0 filter drop-shadow-lg">{avatar.emoji}</div>
              <div className="bg-white p-4 rounded-3xl rounded-tl-none shadow-sm border border-slate-100 relative flex-1 min-h-[64px] flex items-center">
                <p className="text-slate-700 text-sm font-bold leading-snug">{tutorMessage}</p>
                <div className="absolute top-0 -left-2 w-0 h-0 border-t-[8px] border-t-white border-l-[8px] border-l-transparent"></div>
              </div>
            </div>

            {/* Main Character Card */}
            <div className="bg-white rounded-[2rem] shadow-2xl shadow-indigo-100 border border-slate-100 p-8 text-center relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>
              
              <button 
                onClick={(e) => { e.stopPropagation(); speak(currentRadical.char, true); }}
                className="absolute top-4 right-4 p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all z-20 group-hover:scale-110"
              >
                <Volume2 size={24} />
              </button>

              <div className="mb-4 text-indigo-400 text-[10px] font-black tracking-[0.3em] uppercase">
                {mode === 'numbers' ? 'Number' : 'Identify Character'}
              </div>
              <div className="hanzi text-8xl font-black text-slate-800 mb-2 select-none transition-transform group-hover:scale-110 duration-500">
                {currentRadical.char}
              </div>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 gap-2.5">
              {options.map((option, idx) => {
                const isSelected = selectedOption?.char === option.char;
                const isCorrectOption = option.char === currentRadical.char;
                
                let buttonStyle = "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-300";
                let icon = null;

                if (selectedOption) {
                  if (isCorrectOption) {
                    buttonStyle = "bg-emerald-50 border-emerald-400 text-emerald-800 shadow-none";
                    icon = <CheckCircle size={20} className="text-emerald-500" />;
                  } else if (isSelected && !isCorrectOption) {
                    buttonStyle = "bg-red-50 border-red-300 text-red-800 shadow-none opacity-60";
                    icon = <XCircle size={20} className="text-red-500" />;
                  } else {
                    buttonStyle = "bg-slate-50 border-slate-100 text-slate-300 opacity-40";
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionClick(option)}
                    disabled={selectedOption !== null}
                    className={`
                      relative p-4 rounded-2xl border-2 font-bold text-left transition-all duration-300
                      flex justify-between items-center shadow-sm active:scale-[0.98]
                      ${buttonStyle}
                    `}
                  >
                    <div className="flex flex-col">
                      <span className="text-lg tracking-tight">{option.pinyin}</span>
                      <span className="text-xs font-medium opacity-60 italic">{option.meaning}</span>
                    </div>
                    {icon}
                  </button>
                );
              })}
            </div>

            {/* Footer Actions */}
            <div className="flex justify-center items-center gap-6">
              <button 
                onClick={() => generateQuestion()}
                className={`text-slate-400 text-xs hover:text-indigo-600 font-bold uppercase tracking-widest transition-all ${selectedOption ? 'opacity-0 pointer-events-none' : ''}`}
              >
                Skip This One
              </button>

              {(mode === 'focus' || mode === 'custom') && (
                <button 
                  onClick={() => {
                    if (mode === 'focus') {
                      const newGroup = shuffle([...RADICALS_DATA]).slice(0, 5);
                      setFocusGroup(newGroup);
                      generateQuestion(newGroup);
                    } else {
                      generateQuestion(customGroup);
                    }
                    setStreak(0);
                  }}
                  className="flex items-center gap-2 text-indigo-600 hover:text-white hover:bg-indigo-600 text-xs font-black bg-indigo-50 px-5 py-2.5 rounded-full transition-all border border-indigo-100 uppercase tracking-widest shadow-sm"
                >
                  <RefreshCw size={14} />
                  {mode === 'custom' ? 'Shuffle List' : 'New Set'}
                </button>
              )}
            </div>

          </div>
        )}

      </main>

      {/* Progress Bar */}
      {gameState === 'playing' && (
        <div className="bg-white border-t border-slate-100 p-4 pb-8">
          <div className="max-w-md mx-auto space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                <span>LVL {Math.floor(score / 100) + 1}</span>
                <span>{score % 100} / 100 XP TO NEXT LEVEL</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700 ease-out" 
                  style={{ width: `${score % 100}%` }}
                ></div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(-5%); }
          50% { transform: translateY(5%); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
