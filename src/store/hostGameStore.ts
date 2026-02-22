import { create } from 'zustand';
import { updateGameState, getRoomPlayers } from '@/lib/roomService';
import type { Player, PlayerStatus, GamePhase, TriviaQuestion } from './gameStore';

const ROUND_STAKES = [100, 250, 400, 550, 700, 850, 1000];
const STARTING_POINTS = 1000;
const QUESTIONS_PER_ROUND = 5;

const BOT_NAMES = ['VIPER', 'PHANTOM', 'REAPER', 'SHADOW', 'BLAZE', 'WRAITH'];
const BOT_AVATARS = ['🐍', '👻', '💀', '🌑', '🔥', '👤'];
const PLAYER_COLORS = [
  '185 100% 50%', '0 90% 55%', '270 80% 60%', '120 70% 45%',
  '35 95% 55%', '320 80% 55%', '55 90% 50%',
];

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
  { id: '15', text: 'What is the speed of light in km/s?', answer: '300000', choices: ['150,000', '300,000', '500,000', '1,000,000'], category: 'Science' },
  { id: '16', text: 'Which country gifted the Statue of Liberty to the USA?', answer: 'france', choices: ['England', 'France', 'Spain', 'Germany'], category: 'History' },
  { id: '17', text: 'What is the largest mammal in the world?', answer: 'blue whale', choices: ['Elephant', 'Blue Whale', 'Giraffe', 'Hippopotamus'], category: 'Science' },
  { id: '18', text: 'Who developed the theory of relativity?', answer: 'einstein', choices: ['Newton', 'Einstein', 'Hawking', 'Bohr'], category: 'Science' },
  { id: '19', text: 'What is the capital of Australia?', answer: 'canberra', choices: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'], category: 'Geography' },
  { id: '20', text: 'How many bones are in the adult human body?', answer: '206', choices: ['186', '206', '226', '256'], category: 'Science' },
  { id: '21', text: 'What year did the Titanic sink?', answer: '1912', choices: ['1905', '1912', '1918', '1920'], category: 'History' },
  { id: '22', text: 'Which planet has the most moons?', answer: 'saturn', choices: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'], category: 'Science' },
  { id: '23', text: 'What is the chemical formula for water?', answer: 'h2o', choices: ['CO2', 'H2O', 'NaCl', 'O2'], category: 'Science' },
  { id: '24', text: 'Who was the first person to walk on the Moon?', answer: 'neil armstrong', choices: ['Buzz Aldrin', 'Neil Armstrong', 'Yuri Gagarin', 'John Glenn'], category: 'History' },
  { id: '25', text: 'What is the largest desert in the world?', answer: 'sahara', choices: ['Gobi', 'Sahara', 'Antarctic', 'Arabian'], category: 'Geography' },
  { id: '26', text: 'Which element has the atomic number 1?', answer: 'hydrogen', choices: ['Helium', 'Hydrogen', 'Oxygen', 'Carbon'], category: 'Science' },
  { id: '27', text: 'What language has the most native speakers?', answer: 'mandarin', choices: ['English', 'Spanish', 'Mandarin', 'Hindi'], category: 'Culture' },
  { id: '28', text: 'What is the tallest mountain in the world?', answer: 'everest', choices: ['K2', 'Kangchenjunga', 'Everest', 'Lhotse'], category: 'Geography' },
  { id: '29', text: 'Who wrote "1984"?', answer: 'george orwell', choices: ['Aldous Huxley', 'George Orwell', 'Ray Bradbury', 'H.G. Wells'], category: 'Literature' },
  { id: '30', text: 'What is the currency of Japan?', answer: 'yen', choices: ['Won', 'Yuan', 'Yen', 'Ringgit'], category: 'Culture' },
  { id: '31', text: 'How many players are on a soccer team?', answer: '11', choices: ['9', '10', '11', '12'], category: 'Sports' },
  { id: '32', text: 'What organ pumps blood through the body?', answer: 'heart', choices: ['Liver', 'Heart', 'Lungs', 'Brain'], category: 'Science' },
  { id: '33', text: 'Which country has the largest population?', answer: 'india', choices: ['China', 'India', 'USA', 'Indonesia'], category: 'Geography' },
  { id: '34', text: 'What is the boiling point of water in Celsius?', answer: '100', choices: ['90', '100', '110', '120'], category: 'Science' },
  { id: '35', text: 'Who composed the "Moonlight Sonata"?', answer: 'beethoven', choices: ['Mozart', 'Beethoven', 'Bach', 'Chopin'], category: 'Art' },
];

function fuzzyMatch(input: string, answer: string): boolean {
  const clean = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
  const a = clean(input);
  const b = clean(answer);
  if (a === b) return true;
  if (b.includes(a) && a.length >= 3) return true;
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

function predatorSelectTarget(bot: Player, players: Player[], roundStake: number): string {
  const targets = players.filter(p => p.id !== bot.id && p.status === 'ACTIVE');
  if (targets.length === 0) return '';
  const weights = targets.map(t => {
    let w = t.points / 100;
    if (t.points > roundStake && t.points <= roundStake * 2) w *= 1.3;
    return { id: t.id, weight: Math.max(w, 1) };
  });
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const w of weights) {
    roll -= w.weight;
    if (roll <= 0) return w.id;
  }
  return targets[0].id;
}

// Serializable state that gets synced to Supabase
export interface SyncedGameState {
  phase: GamePhase;
  currentRound: number;
  players: Player[];
  currentQuestion: TriviaQuestion | null;
  questionInRound: number;
  revealedText: string;
  typewriterIndex: number;
  buzzedPlayerId: string | null;
  lockedOutPlayerIds: string[];
  answerResult: 'correct' | 'incorrect' | 'timeout' | null;
  lastSubmittedAnswer: string | null;
  correctAnswer: string | null;
  answeringPlayerName: string | null;
  selectedTargetId: string | null;
  buzzedDuringMC: boolean;
  eliminatedThisRound: string | null;
}

interface HostGameState extends SyncedGameState {
  roomId: string;
  usedQuestionIds: string[];
  answerTimer: number;
  playerAnswer: string;

  // Actions
  initFromRoom: (roomId: string) => Promise<void>;
  syncToDb: () => void;
  setPhase: (phase: GamePhase) => void;
  startRound: () => void;
  startNextQuestion: () => void;
  advanceTypewriter: () => void;
  buzz: (playerId: string) => void;
  submitAnswer: (answer: string) => void;
  selectTarget: (targetId: string) => void;
  selectMultipleChoice: (choice: string) => void;
  endRound: () => void;
  nextRound: () => void;
  resetGame: () => void;
  runBotBuzz: () => void;
  runBotAnswer: () => void;
  runBotTargetSelect: () => void;
}

// Debounced sync to avoid flooding DB
let syncTimeout: ReturnType<typeof setTimeout> | null = null;
function debouncedSync(roomId: string, state: SyncedGameState) {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    updateGameState(roomId, state as unknown as Record<string, any>);
  }, 50);
}

function getSyncState(state: HostGameState): SyncedGameState {
  return {
    phase: state.phase,
    currentRound: state.currentRound,
    players: state.players,
    currentQuestion: state.currentQuestion,
    questionInRound: state.questionInRound,
    revealedText: state.revealedText,
    typewriterIndex: state.typewriterIndex,
    buzzedPlayerId: state.buzzedPlayerId,
    lockedOutPlayerIds: state.lockedOutPlayerIds,
    answerResult: state.answerResult,
    lastSubmittedAnswer: state.lastSubmittedAnswer,
    correctAnswer: state.correctAnswer,
    answeringPlayerName: state.answeringPlayerName,
    selectedTargetId: state.selectedTargetId,
    buzzedDuringMC: state.buzzedDuringMC,
    eliminatedThisRound: state.eliminatedThisRound,
  };
}

export const useHostGameStore = create<HostGameState>((set, get) => ({
  roomId: '',
  phase: 'LOBBY',
  currentRound: 0,
  players: [],
  currentQuestion: null,
  usedQuestionIds: [],
  questionInRound: 0,
  revealedText: '',
  typewriterIndex: 0,
  buzzedPlayerId: null,
  answerTimer: 5,
  lockedOutPlayerIds: [],
  playerAnswer: '',
  answerResult: null,
  lastSubmittedAnswer: null,
  correctAnswer: null,
  answeringPlayerName: null,
  selectedTargetId: null,
  buzzedDuringMC: false,
  eliminatedThisRound: null,

  syncToDb: () => {
    const state = get();
    if (state.roomId) {
      debouncedSync(state.roomId, getSyncState(state));
    }
  },

  initFromRoom: async (roomId: string) => {
    const dbPlayers = await getRoomPlayers(roomId);

    // Map DB players to game Player objects
    const gamePlayers: Player[] = dbPlayers.map((p: any, i: number) => ({
      id: p.player_session_id, // use session ID so player devices can match
      name: p.player_name,
      points: STARTING_POINTS,
      status: 'ACTIVE' as PlayerStatus,
      isBot: false,
      isHuman: false, // no human in host mode - all are remote players
      avatar: p.avatar,
      color: p.color,
    }));

    // Fill remaining slots with bots up to 7
    const botsNeeded = 7 - gamePlayers.length;
    for (let i = 0; i < botsNeeded; i++) {
      gamePlayers.push({
        id: `bot-${i}`,
        name: BOT_NAMES[i],
        points: STARTING_POINTS,
        status: 'ACTIVE' as PlayerStatus,
        isBot: true,
        isHuman: false,
        avatar: BOT_AVATARS[i],
        color: PLAYER_COLORS[(gamePlayers.length) % PLAYER_COLORS.length],
      });
    }

    set({
      roomId,
      players: gamePlayers,
      currentRound: 0,
      phase: 'LOBBY',
      usedQuestionIds: [],
      eliminatedThisRound: null,
    });

    // Initial sync
    get().syncToDb();
  },

  setPhase: (phase) => {
    set({ phase });
    get().syncToDb();
  },

  startRound: () => {
    const state = get();
    const round = state.currentRound + 1;
    const players = state.players.map(p => {
      if (p.status === 'ELIMINATED') return p;
      return { ...p, status: 'ACTIVE' as PlayerStatus };
    });
    set({ currentRound: round, players, questionInRound: 0, eliminatedThisRound: null });
    get().startNextQuestion();
  },

  startNextQuestion: () => {
    const state = get();
    const nextQ = state.questionInRound + 1;
    const available = QUESTIONS.filter(q => !state.usedQuestionIds.includes(q.id));
    const question = available[Math.floor(Math.random() * available.length)] || QUESTIONS[0];

    set({
      questionInRound: nextQ,
      currentQuestion: question,
      usedQuestionIds: [...state.usedQuestionIds, question.id],
      revealedText: '',
      typewriterIndex: 0,
      buzzedPlayerId: null,
      lockedOutPlayerIds: [],
      playerAnswer: '',
      answerResult: null,
      lastSubmittedAnswer: null,
      correctAnswer: null,
      answeringPlayerName: null,
      selectedTargetId: null,
      buzzedDuringMC: false,
      phase: 'TYPEWRITER',
    });
    get().syncToDb();
  },

  advanceTypewriter: () => {
    const state = get();
    if (!state.currentQuestion || state.phase !== 'TYPEWRITER') return;
    const nextIndex = state.typewriterIndex + 1;
    const fullText = state.currentQuestion.text;

    if (nextIndex >= fullText.length) {
      set({ revealedText: fullText, typewriterIndex: nextIndex, phase: 'MULTIPLE_CHOICE' });
    } else {
      set({ revealedText: fullText.substring(0, nextIndex), typewriterIndex: nextIndex });
    }
    // Sync every 5 chars to reduce DB writes during typewriter
    if (nextIndex % 5 === 0 || nextIndex >= fullText.length) {
      get().syncToDb();
    }
  },

  buzz: (playerId) => {
    const state = get();
    if (state.phase !== 'TYPEWRITER' && state.phase !== 'MULTIPLE_CHOICE') return;
    const player = state.players.find(p => p.id === playerId);
    if (!player || player.status !== 'ACTIVE') return;
    if (state.lockedOutPlayerIds.includes(playerId)) return;

    set({
      buzzedPlayerId: playerId,
      phase: 'ANSWERING',
      buzzedDuringMC: state.phase === 'MULTIPLE_CHOICE',
      answerTimer: 5,
      answerResult: null,
      playerAnswer: '',
    });
    get().syncToDb();
  },

  submitAnswer: (answer) => {
    const state = get();
    if (!state.currentQuestion || !state.buzzedPlayerId) return;
    const isCorrect = fuzzyMatch(answer, state.currentQuestion.answer);
    const playerName = state.players.find(p => p.id === state.buzzedPlayerId)?.name || '';

    if (isCorrect) {
      set({
        answerResult: 'correct',
        lastSubmittedAnswer: answer,
        correctAnswer: state.currentQuestion.answer,
        revealedText: state.currentQuestion.text,
        answeringPlayerName: playerName,
        phase: 'STEAL_SELECT',
      });
      get().syncToDb();
    } else {
      const stake = ROUND_STAKES[state.currentRound - 1];
      const players = state.players.map(p => {
        if (p.id === state.buzzedPlayerId) {
          const newPoints = Math.max(0, p.points - stake);
          return { ...p, points: newPoints, status: (newPoints < stake ? 'FROZEN' : 'ACTIVE') as PlayerStatus };
        }
        return p;
      });
      const newLockedOut = [...state.lockedOutPlayerIds, state.buzzedPlayerId!];
      set({
        answerResult: 'incorrect',
        lastSubmittedAnswer: answer,
        correctAnswer: null,
        answeringPlayerName: playerName,
        players,
        lockedOutPlayerIds: newLockedOut,
      });
      get().syncToDb();

      setTimeout(() => {
        const current = get();
        if (current.answerResult === 'incorrect') {
          if (current.lockedOutPlayerIds.length >= 2) {
            set({
              phase: 'MULTIPLE_CHOICE',
              revealedText: current.currentQuestion!.text,
              buzzedPlayerId: null,
              answerResult: null,
              lastSubmittedAnswer: null,
              correctAnswer: null,
              answeringPlayerName: null,
              buzzedDuringMC: false,
            });
          } else {
            set({ phase: 'TYPEWRITER', buzzedPlayerId: null, answerResult: null, lastSubmittedAnswer: null, correctAnswer: null, answeringPlayerName: null });
          }
          get().syncToDb();
        }
      }, 2500);
    }
  },

  selectTarget: (targetId) => {
    const state = get();
    if (state.phase !== 'STEAL_SELECT' || !state.buzzedPlayerId || state.selectedTargetId) return;
    const stake = ROUND_STAKES[state.currentRound - 1];
    const players = state.players.map(p => {
      if (p.id === state.buzzedPlayerId) return { ...p, points: p.points + stake };
      if (p.id === targetId) {
        const newPoints = Math.max(0, p.points - stake);
        return { ...p, points: newPoints, status: (newPoints < stake ? 'FROZEN' : p.status) as PlayerStatus };
      }
      return p;
    });
    set({ selectedTargetId: targetId, players });
    get().syncToDb();

    setTimeout(() => {
      const current = get();
      if (current.questionInRound >= QUESTIONS_PER_ROUND) {
        set({ phase: 'ROUND_END' });
        get().endRound();
      } else {
        get().startNextQuestion();
      }
    }, 2000);
  },

  selectMultipleChoice: (choice) => {
    const state = get();
    if (!state.currentQuestion || !state.buzzedPlayerId) return;
    const isCorrect = fuzzyMatch(choice, state.currentQuestion.answer);
    const playerName = state.players.find(p => p.id === state.buzzedPlayerId)?.name || '';

    if (isCorrect) {
      set({
        answerResult: 'correct',
        lastSubmittedAnswer: choice,
        correctAnswer: state.currentQuestion.answer,
        revealedText: state.currentQuestion.text,
        answeringPlayerName: playerName,
        phase: 'STEAL_SELECT',
      });
      get().syncToDb();
    } else {
      const stake = ROUND_STAKES[state.currentRound - 1];
      const players = state.players.map(p => {
        if (p.id === state.buzzedPlayerId) {
          const newPoints = Math.max(0, p.points - stake);
          return { ...p, points: newPoints, status: (newPoints < stake ? 'FROZEN' : 'ACTIVE') as PlayerStatus };
        }
        return p;
      });
      set({
        answerResult: 'incorrect',
        lastSubmittedAnswer: choice,
        correctAnswer: state.currentQuestion.answer,
        answeringPlayerName: playerName,
        players,
      });
      get().syncToDb();

      setTimeout(() => {
        const current = get();
        if (current.answerResult === 'incorrect') {
          if (current.questionInRound >= QUESTIONS_PER_ROUND) {
            set({ phase: 'ROUND_END' });
            get().endRound();
          } else {
            get().startNextQuestion();
          }
        }
      }, 2500);
    }
  },

  endRound: () => {
    const state = get();
    const activePlayers = state.players.filter(p => p.status !== 'ELIMINATED');
    if (activePlayers.length <= 1 || state.currentRound >= 7) {
      set({ phase: 'GAME_OVER' });
      get().syncToDb();
      return;
    }
    const lowest = activePlayers.sort((a, b) => a.points - b.points)[0];
    const players = state.players.map(p => {
      if (p.id === lowest.id) return { ...p, status: 'ELIMINATED' as PlayerStatus };
      return p;
    });
    set({ players, eliminatedThisRound: lowest.id, phase: 'ROUND_END' });
    get().syncToDb();
  },

  nextRound: () => {
    const state = get();
    const activePlayers = state.players.filter(p => p.status !== 'ELIMINATED');
    if (activePlayers.length <= 1 || state.currentRound >= 7) {
      set({ phase: 'GAME_OVER' });
      get().syncToDb();
    } else {
      get().startRound();
    }
  },

  resetGame: () => {
    set({
      phase: 'LOBBY',
      currentRound: 0,
      players: [],
      currentQuestion: null,
      usedQuestionIds: [],
      questionInRound: 0,
      revealedText: '',
      typewriterIndex: 0,
      buzzedPlayerId: null,
      lockedOutPlayerIds: [],
      answerResult: null,
      lastSubmittedAnswer: null,
      correctAnswer: null,
      answeringPlayerName: null,
      selectedTargetId: null,
      buzzedDuringMC: false,
      eliminatedThisRound: null,
    });
  },

  runBotBuzz: () => {
    const state = get();
    if (state.phase !== 'TYPEWRITER' && state.phase !== 'MULTIPLE_CHOICE') return;
    const activeBots = state.players.filter(
      p => p.isBot && p.status === 'ACTIVE' && !state.lockedOutPlayerIds.includes(p.id)
    );
    if (activeBots.length === 0) return;
    const revealPercent = state.currentQuestion
      ? state.typewriterIndex / state.currentQuestion.text.length
      : 0;
    const buzzChance = state.phase === 'MULTIPLE_CHOICE'
      ? 0.05 + Math.random() * 0.05
      : 0.01 + revealPercent * 0.03;
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
    const botSkill = 0.40 + Math.random() * 0.15;
    const correct = Math.random() < botSkill;
    setTimeout(() => {
      const current = get();
      if (current.phase !== 'ANSWERING') return;
      if (current.buzzedDuringMC) {
        if (correct) {
          const correctChoice = current.currentQuestion!.choices.find(c =>
            fuzzyMatch(c, current.currentQuestion!.answer)
          );
          get().selectMultipleChoice(correctChoice || current.currentQuestion!.choices[0]);
        } else {
          const wrongChoices = current.currentQuestion!.choices.filter(c =>
            !fuzzyMatch(c, current.currentQuestion!.answer)
          );
          get().selectMultipleChoice(wrongChoices[Math.floor(Math.random() * wrongChoices.length)]);
        }
      } else {
        if (correct) {
          get().submitAnswer(current.currentQuestion!.answer);
        } else {
          get().submitAnswer('wrong answer');
        }
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
