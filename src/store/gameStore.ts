import { create } from 'zustand';

// Types
export type PlayerStatus = 'ACTIVE' | 'FROZEN' | 'BUZZED' | 'ELIMINATED' | 'LOCKED_OUT';
export type GamePhase = 'LOBBY' | 'TYPEWRITER' | 'BUZZED' | 'ANSWERING' | 'STEAL_SELECT' | 'MULTIPLE_CHOICE' | 'PLEA' | 'ROUND_END' | 'SUDDEN_DEATH' | 'GAME_OVER';

export interface Player {
  id: string;
  name: string;
  points: number;
  status: PlayerStatus;
  isBot: boolean;
  isHuman: boolean;
  avatar: string;
  color: string;
}

export interface TriviaQuestion {
  id: string;
  text: string;
  answer: string;
  choices: string[];
  category: string;
}

const ROUND_STAKES = [100, 250, 400, 550, 700, 850, 1000];
const STARTING_POINTS = 1000;

const PLAYER_COLORS = [
  '185 100% 50%', // cyan (human)
  '0 90% 55%',    // red
  '270 80% 60%',  // purple
  '120 70% 45%',  // green
  '35 95% 55%',   // orange
  '320 80% 55%',  // pink
  '55 90% 50%',   // yellow
];

const BOT_NAMES = ['VIPER', 'PHANTOM', 'REAPER', 'SHADOW', 'BLAZE', 'WRAITH'];
const BOT_AVATARS = ['🐍', '👻', '💀', '🌑', '🔥', '👤'];

// Questions bank
const QUESTIONS: TriviaQuestion[] = [
  { id: '1', text: 'What planet is known as the Red Planet?', answer: 'mars', choices: ['Venus', 'Mars', 'Jupiter', 'Saturn'], category: 'Science' },
  { id: '2', text: 'What is the chemical symbol for gold?', answer: 'au', choices: ['Ag', 'Au', 'Fe', 'Cu'], category: 'Science' },
  { id: '3', text: 'Who painted the Mona Lisa?', answer: 'leonardo da vinci', choices: ['Michelangelo', 'Leonardo da Vinci', 'Raphael', 'Donatello'], category: 'Art' },
  { id: '4', text: 'What is the largest ocean on Earth?', answer: 'pacific', choices: ['Atlantic', 'Indian', 'Pacific', 'Arctic'], category: 'Geography' },
  { id: '5', text: 'In what year did World War II end?', answer: '1945', choices: ['1943', '1944', '1945', '1946'], category: 'History' },
  { id: '6', text: 'What is the smallest country in the world?', answer: 'vatican city', choices: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'], category: 'Geography' },
  { id: '7', text: 'What element does "O" represent on the periodic table?', answer: 'oxygen', choices: ['Osmium', 'Oxygen', 'Oganesson', 'Gold'], category: 'Science' },
  { id: '8', text: 'Who wrote "Romeo and Juliet"?', answer: 'shakespeare', choices: ['Dickens', 'Shakespeare', 'Austen', 'Hemingway'], category: 'Literature' },
  { id: '9', text: 'What is the capital of Japan?', answer: 'tokyo', choices: ['Osaka', 'Kyoto', 'Tokyo', 'Nagoya'], category: 'Geography' },
  { id: '10', text: 'How many continents are there?', answer: '7', choices: ['5', '6', '7', '8'], category: 'Geography' },
  { id: '11', text: 'What gas do plants absorb from the atmosphere?', answer: 'carbon dioxide', choices: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], category: 'Science' },
  { id: '12', text: 'Who discovered penicillin?', answer: 'alexander fleming', choices: ['Louis Pasteur', 'Alexander Fleming', 'Marie Curie', 'Joseph Lister'], category: 'Science' },
  { id: '13', text: 'What is the hardest natural substance on Earth?', answer: 'diamond', choices: ['Gold', 'Iron', 'Diamond', 'Platinum'], category: 'Science' },
  { id: '14', text: 'What is the longest river in the world?', answer: 'nile', choices: ['Amazon', 'Nile', 'Mississippi', 'Yangtze'], category: 'Geography' },
];

function fuzzyMatch(input: string, answer: string): boolean {
  const clean = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
  const a = clean(input);
  const b = clean(answer);
  if (a === b) return true;
  if (b.includes(a) && a.length >= 3) return true;
  // Levenshtein distance <= 2 for short answers
  if (a.length >= 3 && b.length >= 3) {
    let dist = 0;
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    if (longer.length - shorter.length > 2) return false;
    for (let i = 0; i < longer.length; i++) {
      if (longer[i] !== shorter[i]) dist++;
    }
    return dist <= 2;
  }
  return false;
}

// Predator Bot AI: targets highest-scoring or near-elimination players
function predatorSelectTarget(bot: Player, players: Player[], roundStake: number): string {
  const targets = players.filter(p => p.id !== bot.id && p.status === 'ACTIVE');
  if (targets.length === 0) return '';
  
  // Strategy: 70% chance target highest scorer, 30% target someone near freeze threshold
  const random = Math.random();
  if (random < 0.7) {
    // Target highest scorer
    return targets.sort((a, b) => b.points - a.points)[0].id;
  } else {
    // Target someone close to being frozen (just above threshold)
    const vulnerable = targets
      .filter(p => p.points > roundStake && p.points <= roundStake * 2)
      .sort((a, b) => a.points - b.points);
    return vulnerable.length > 0 ? vulnerable[0].id : targets.sort((a, b) => b.points - a.points)[0].id;
  }
}

interface GameState {
  // Game state
  phase: GamePhase;
  currentRound: number;
  players: Player[];
  currentQuestion: TriviaQuestion | null;
  usedQuestionIds: string[];
  
  // Typewriter state
  revealedText: string;
  typewriterIndex: number;
  
  // Buzz state
  buzzedPlayerId: string | null;
  answerTimer: number;
  lockedOutPlayerIds: string[];
  
  // Answer state
  playerAnswer: string;
  answerResult: 'correct' | 'incorrect' | 'timeout' | null;
  
  // Steal state
  selectedTargetId: string | null;
  
  // Round results
  eliminatedThisRound: string | null;
  
  // Actions
  initGame: () => void;
  setPhase: (phase: GamePhase) => void;
  startRound: () => void;
  advanceTypewriter: () => void;
  buzz: (playerId: string) => void;
  submitAnswer: (answer: string) => void;
  selectTarget: (targetId: string) => void;
  selectMultipleChoice: (choice: string) => void;
  attemptPlea: (playerId: string) => void;
  endRound: () => void;
  nextRound: () => void;
  setPlayerAnswer: (answer: string) => void;
  resetGame: () => void;
  runBotBuzz: () => void;
  runBotAnswer: () => void;
  runBotTargetSelect: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'LOBBY',
  currentRound: 0,
  players: [],
  currentQuestion: null,
  usedQuestionIds: [],
  revealedText: '',
  typewriterIndex: 0,
  buzzedPlayerId: null,
  answerTimer: 5,
  lockedOutPlayerIds: [],
  playerAnswer: '',
  answerResult: null,
  selectedTargetId: null,
  eliminatedThisRound: null,

  initGame: () => {
    const human: Player = {
      id: 'human',
      name: 'YOU',
      points: STARTING_POINTS,
      status: 'ACTIVE',
      isBot: false,
      isHuman: true,
      avatar: '⚡',
      color: PLAYER_COLORS[0],
    };
    
    const bots: Player[] = BOT_NAMES.map((name, i) => ({
      id: `bot-${i}`,
      name,
      points: STARTING_POINTS,
      status: 'ACTIVE' as PlayerStatus,
      isBot: true,
      isHuman: false,
      avatar: BOT_AVATARS[i],
      color: PLAYER_COLORS[i + 1],
    }));

    set({
      players: [human, ...bots],
      currentRound: 0,
      phase: 'LOBBY',
      usedQuestionIds: [],
      eliminatedThisRound: null,
    });
  },

  setPhase: (phase) => set({ phase }),

  startRound: () => {
    const state = get();
    const round = state.currentRound + 1;
    const stake = ROUND_STAKES[round - 1];
    
    // Update frozen status
    const players = state.players.map(p => {
      if (p.status === 'ELIMINATED') return p;
      if (p.points < stake) return { ...p, status: 'FROZEN' as PlayerStatus };
      return { ...p, status: 'ACTIVE' as PlayerStatus };
    });

    // Pick unused question
    const available = QUESTIONS.filter(q => !state.usedQuestionIds.includes(q.id));
    const question = available[Math.floor(Math.random() * available.length)] || QUESTIONS[0];

    set({
      currentRound: round,
      players,
      currentQuestion: question,
      usedQuestionIds: [...state.usedQuestionIds, question.id],
      revealedText: '',
      typewriterIndex: 0,
      buzzedPlayerId: null,
      lockedOutPlayerIds: [],
      playerAnswer: '',
      answerResult: null,
      selectedTargetId: null,
      eliminatedThisRound: null,
      phase: 'TYPEWRITER',
    });
  },

  advanceTypewriter: () => {
    const state = get();
    if (!state.currentQuestion || state.phase !== 'TYPEWRITER') return;
    
    const nextIndex = state.typewriterIndex + 1;
    const fullText = state.currentQuestion.text;
    
    if (nextIndex >= fullText.length) {
      // Full text revealed, go to multiple choice
      set({
        revealedText: fullText,
        typewriterIndex: nextIndex,
        phase: 'MULTIPLE_CHOICE',
      });
      return;
    }
    
    set({
      revealedText: fullText.substring(0, nextIndex),
      typewriterIndex: nextIndex,
    });
  },

  buzz: (playerId) => {
    const state = get();
    if (state.phase !== 'TYPEWRITER') return;
    
    const player = state.players.find(p => p.id === playerId);
    if (!player || player.status !== 'ACTIVE') return;
    if (state.lockedOutPlayerIds.includes(playerId)) return;

    set({
      buzzedPlayerId: playerId,
      phase: 'ANSWERING',
      answerTimer: 5,
      answerResult: null,
      playerAnswer: '',
    });
  },

  submitAnswer: (answer) => {
    const state = get();
    if (!state.currentQuestion || !state.buzzedPlayerId) return;
    
    const isCorrect = fuzzyMatch(answer, state.currentQuestion.answer);
    
    if (isCorrect) {
      set({ answerResult: 'correct', phase: 'STEAL_SELECT' });
    } else {
      const stake = ROUND_STAKES[state.currentRound - 1];
      const players = state.players.map(p => {
        if (p.id === state.buzzedPlayerId) {
          return { ...p, points: Math.max(0, p.points - stake) };
        }
        return p;
      });
      
      set({
        answerResult: 'incorrect',
        players,
        lockedOutPlayerIds: [...state.lockedOutPlayerIds, state.buzzedPlayerId],
      });

      // Resume typewriter after delay
      setTimeout(() => {
        const current = get();
        if (current.answerResult === 'incorrect') {
          set({ phase: 'TYPEWRITER', buzzedPlayerId: null, answerResult: null });
        }
      }, 2000);
    }
  },

  selectTarget: (targetId) => {
    const state = get();
    if (state.phase !== 'STEAL_SELECT' || !state.buzzedPlayerId) return;
    
    const stake = ROUND_STAKES[state.currentRound - 1];
    const players = state.players.map(p => {
      if (p.id === state.buzzedPlayerId) {
        return { ...p, points: p.points + stake };
      }
      if (p.id === targetId) {
        return { ...p, points: Math.max(0, p.points - stake) };
      }
      return p;
    });

    set({
      selectedTargetId: targetId,
      players,
      phase: 'ROUND_END',
    });
  },

  selectMultipleChoice: (choice) => {
    const state = get();
    if (!state.currentQuestion) return;
    
    const isCorrect = fuzzyMatch(choice, state.currentQuestion.answer);
    if (isCorrect) {
      set({ answerResult: 'correct', buzzedPlayerId: 'human', phase: 'STEAL_SELECT' });
    } else {
      set({ answerResult: 'incorrect' });
      setTimeout(() => set({ phase: 'ROUND_END' }), 2000);
    }
  },

  attemptPlea: (playerId) => {
    const state = get();
    const stake = ROUND_STAKES[state.currentRound - 1];
    const maxReward = stake * 2;
    const reward = Math.floor(Math.random() * maxReward * 0.6) + Math.floor(maxReward * 0.4);
    
    // 40% chance of success
    const success = Math.random() < 0.4;
    
    if (success) {
      const players = state.players.map(p => {
        if (p.id === playerId) {
          const newPoints = p.points + reward;
          return {
            ...p,
            points: newPoints,
            status: (newPoints >= stake ? 'ACTIVE' : 'FROZEN') as PlayerStatus,
          };
        }
        return p;
      });
      set({ players });
    }
  },

  endRound: () => {
    const state = get();
    const activePlayers = state.players.filter(p => p.status !== 'ELIMINATED');
    
    if (activePlayers.length <= 1 || state.currentRound >= 7) {
      set({ phase: 'GAME_OVER' });
      return;
    }

    // Find lowest scorer
    const lowest = activePlayers.sort((a, b) => a.points - b.points)[0];
    const players = state.players.map(p => {
      if (p.id === lowest.id) return { ...p, status: 'ELIMINATED' as PlayerStatus };
      return p;
    });

    set({ players, eliminatedThisRound: lowest.id, phase: 'ROUND_END' });
  },

  nextRound: () => {
    const state = get();
    const activePlayers = state.players.filter(p => p.status !== 'ELIMINATED');
    
    if (activePlayers.length <= 1 || state.currentRound >= 7) {
      set({ phase: 'GAME_OVER' });
    } else {
      get().startRound();
    }
  },

  setPlayerAnswer: (answer) => set({ playerAnswer: answer }),

  resetGame: () => {
    get().initGame();
  },

  runBotBuzz: () => {
    const state = get();
    if (state.phase !== 'TYPEWRITER') return;
    
    const activeBots = state.players.filter(
      p => p.isBot && p.status === 'ACTIVE' && !state.lockedOutPlayerIds.includes(p.id)
    );
    
    if (activeBots.length === 0) return;
    
    // Each bot has a small chance to buzz per typewriter tick
    // Higher chance when more text is revealed
    const revealPercent = state.currentQuestion 
      ? state.typewriterIndex / state.currentQuestion.text.length 
      : 0;
    
    const buzzChance = 0.01 + revealPercent * 0.03;
    
    for (const bot of activeBots) {
      if (Math.random() < buzzChance) {
        get().buzz(bot.id);
        return;
      }
    }
  },

  runBotAnswer: () => {
    const state = get();
    if (state.phase !== 'ANSWERING' || !state.buzzedPlayerId) return;
    
    const bot = state.players.find(p => p.id === state.buzzedPlayerId);
    if (!bot || !bot.isBot || !state.currentQuestion) return;
    
    // 60% chance bot answers correctly
    const correct = Math.random() < 0.6;
    
    setTimeout(() => {
      if (correct) {
        get().submitAnswer(state.currentQuestion!.answer);
      } else {
        get().submitAnswer('wrong answer');
      }
    }, 1000 + Math.random() * 2000);
  },

  runBotTargetSelect: () => {
    const state = get();
    if (state.phase !== 'STEAL_SELECT' || !state.buzzedPlayerId) return;
    
    const bot = state.players.find(p => p.id === state.buzzedPlayerId);
    if (!bot || !bot.isBot) return;
    
    const stake = ROUND_STAKES[state.currentRound - 1];
    const targetId = predatorSelectTarget(bot, state.players, stake);
    
    setTimeout(() => {
      if (targetId) get().selectTarget(targetId);
    }, 1000 + Math.random() * 1500);
  },
}));
