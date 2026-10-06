import type { Prompt } from '../types';

const generateId = () => Math.random().toString(36).substring(2, 9);

export const defaultPrompts: Prompt[] = [
  // Tier 1: Mild & Sensual (Warm rose/pink accent)
  { id: generateId(), tier: 'tier1', text: 'Give your partner a 60-second hand massage.', isTimed: true, timeSeconds: 60 },
  { id: generateId(), tier: 'tier1', text: 'Maintain deep eye contact for 30 seconds without smiling.', isTimed: true, timeSeconds: 30 },
  { id: generateId(), tier: 'tier1', text: 'Kiss your partner on the cheek in the most tender way possible.', isTimed: false },
  { id: generateId(), tier: 'tier1', text: 'Share a sweet memory you have of your partner.', isTimed: false },
  { id: generateId(), tier: 'tier1', text: 'Gently stroke your partner\'s hair for 30 seconds.', isTimed: true, timeSeconds: 30 },
  { id: generateId(), tier: 'tier1', text: 'Whisper a secret or a fantasy into your partner\'s ear.', isTimed: false },
  { id: generateId(), tier: 'tier1', text: 'Hold hands and interlock fingers for the next 3 turns.', isTimed: false },
  { id: generateId(), tier: 'tier1', text: 'Give your partner a sweet forehead kiss.', isTimed: false },
  { id: generateId(), tier: 'tier1', text: 'Compliment your partner on a physical feature you love.', isTimed: false },
  { id: generateId(), tier: 'tier1', text: 'Trace a shape on your partner\'s palm and have them guess what it is.', isTimed: false },
  { id: generateId(), tier: 'tier1', text: 'Share the moment you knew you were attracted to them.', isTimed: false },
  { id: generateId(), tier: 'tier1', text: 'Give your partner a 60-second foot massage.', isTimed: true, timeSeconds: 60 },
  { id: generateId(), tier: 'tier1', text: 'Let your partner choose a song to play in the background.', isTimed: false },
  { id: generateId(), tier: 'tier1', text: 'Gently kiss your partner\'s neck.', isTimed: false },
  { id: generateId(), tier: 'tier1', text: 'Tell your partner what you love most about their personality.', isTimed: false },

  // Tier 2: Spicy & Disrobing (Crimson/amber accent)
  { id: generateId(), tier: 'tier2', text: 'Remove one non-essential piece of clothing (socks, jewelry, overshirt).', isTimed: false },
  { id: generateId(), tier: 'tier2', text: 'Give your partner a passionate 30-second French kiss.', isTimed: true, timeSeconds: 30 },
  { id: generateId(), tier: 'tier2', text: 'Blindfold your partner for the next 2 turns.', isTimed: false },
  { id: generateId(), tier: 'tier2', text: 'Massage your partner\'s shoulders for 60 seconds.', isTimed: true, timeSeconds: 60 },
  { id: generateId(), tier: 'tier2', text: 'Let your partner remove one item of clothing from you (their choice).', isTimed: false },
  { id: generateId(), tier: 'tier2', text: 'Nibble on your partner\'s earlobe.', isTimed: false },
  { id: generateId(), tier: 'tier2', text: 'Share a fantasy you\'ve never told them before.', isTimed: false },
  { id: generateId(), tier: 'tier2', text: 'Kiss along your partner\'s jawline for 30 seconds.', isTimed: true, timeSeconds: 30 },
  { id: generateId(), tier: 'tier2', text: 'Guide your partner\'s hands over your body for 30 seconds.', isTimed: true, timeSeconds: 30 },
  { id: generateId(), tier: 'tier2', text: 'Remove your shirt or top.', isTimed: false },
  { id: generateId(), tier: 'tier2', text: 'Give your partner a lap dance for one song (or 60 seconds).', isTimed: true, timeSeconds: 60 },
  { id: generateId(), tier: 'tier2', text: 'Let your partner blindfold you and feed you something sweet (or just tease you).', isTimed: false },
  { id: generateId(), tier: 'tier2', text: 'Describe in detail what you want your partner to do to you later.', isTimed: false },
  { id: generateId(), tier: 'tier2', text: 'Leave a gentle bite mark on your partner\'s neck or shoulder.', isTimed: false },
  { id: generateId(), tier: 'tier2', text: 'Kiss your partner anywhere but their lips for 30 seconds.', isTimed: true, timeSeconds: 30 },

  // Tier 3: R18 / Intimate & Explicit (Dark purple/deep red accent)
  { id: generateId(), tier: 'tier3', text: 'Remove your underwear (or the most intimate item you are wearing).', isTimed: false },
  { id: generateId(), tier: 'tier3', text: 'Use an ice cube (or something cold) and trace it slowly down your partner\'s chest/stomach.', isTimed: false },
  { id: generateId(), tier: 'tier3', text: 'Give your partner a sensual 2-minute full body massage (clothing optional).', isTimed: true, timeSeconds: 120 },
  { id: generateId(), tier: 'tier3', text: 'Let your partner explore your body with their hands (no lips) for 60 seconds.', isTimed: true, timeSeconds: 60 },
  { id: generateId(), tier: 'tier3', text: 'Kiss your way down your partner\'s body for 60 seconds.', isTimed: true, timeSeconds: 60 },
  { id: generateId(), tier: 'tier3', text: 'Let your partner tie your hands or restrain you for their next 2 turns.', isTimed: false },
  { id: generateId(), tier: 'tier3', text: 'Tease your partner\'s most sensitive spots without letting them climax for 2 minutes.', isTimed: true, timeSeconds: 120 },
  { id: generateId(), tier: 'tier3', text: 'Take full control: do whatever you want to your partner for the next 2 minutes.', isTimed: true, timeSeconds: 120 },
  { id: generateId(), tier: 'tier3', text: 'Let your partner take full control for the next 2 minutes.', isTimed: true, timeSeconds: 120 },
  { id: generateId(), tier: 'tier3', text: 'Use a feather, silk, or something soft to trace your partner\'s inner thighs.', isTimed: false },
  { id: generateId(), tier: 'tier3', text: 'Make out passionately while grinding against each other for 60 seconds.', isTimed: true, timeSeconds: 60 },
  { id: generateId(), tier: 'tier3', text: 'Perform a slow, sensual striptease down to nothing.', isTimed: false },
  { id: generateId(), tier: 'tier3', text: 'Whisper exactly how you want your partner to touch you right now, then let them do it for 60 seconds.', isTimed: true, timeSeconds: 60 },
  { id: generateId(), tier: 'tier3', text: 'Both players must remove all remaining clothing.', isTimed: false },

  // Tier 4: Oral & Extreme (Deep Crimson/Red accent)
  { id: generateId(), tier: 'tier4', text: 'Perform 60 seconds of oral pleasure on your partner.', isTimed: true, timeSeconds: 60 },
  { id: generateId(), tier: 'tier4', text: 'Perform oral sex on your partner for 2 minutes.', isTimed: true, timeSeconds: 120 },
  { id: generateId(), tier: 'tier4', text: 'Use an ice cube in your mouth while performing oral for 30 seconds.', isTimed: true, timeSeconds: 30 },
  { id: generateId(), tier: 'tier4', text: 'Tease your partner with oral, but stop right before they finish.', isTimed: false },
  { id: generateId(), tier: 'tier4', text: 'Blindfold your partner and perform oral sex on them until they beg you to stop.', isTimed: false },
  { id: generateId(), tier: 'tier4', text: 'Give your partner a deep, passionate blowjob or cunnilingus for 60 seconds.', isTimed: true, timeSeconds: 60 },
  { id: generateId(), tier: 'tier4', text: 'Lick and tease your partner\'s inner thighs before performing oral for 2 minutes.', isTimed: true, timeSeconds: 120 },
  { id: generateId(), tier: 'tier4', text: 'Edge your partner using only your mouth for 3 minutes.', isTimed: true, timeSeconds: 180 },
  { id: generateId(), tier: 'tier4', text: 'Let your partner control the pace while you perform oral on them for 2 minutes.', isTimed: true, timeSeconds: 120 },
  { id: generateId(), tier: 'tier4', text: 'Perform oral on your partner while they play with your hair.', isTimed: false },
];
