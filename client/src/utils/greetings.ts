export const NERD_GREETINGS: string[] = [
  'Hello, World!',
  'It works on my machine!',
  'Ready to ship code?',
  "It's a feature, not bug!",
  "Let's build something awesome!",
  '404: Greeting not found!',
  'May your builds pass!',
  'Semicolon missing on line 42!',
  'Git commit, git push!',
  'Have you tried restarting it?',
  'Zero bugs ahead!',
  'git push --force and pray!',
  'Welcome back, hacker!',
  'Stack Overflow is my co-pilot!',
  "There's no place like 127.0.0.1!",
  'Time to ship features!',
  'Keep calm and code on!',
  'Tabs vs spaces debate begins!',
  'No merge conflicts today!',
  'Coffee in, code out!',
  'Ship it on Friday afternoon!',
  'Clean code incoming!',
  'sudo make me a coffee!',
  'Welcome to the terminal!',
  'Deleted node_modules again today?',
  'Pushing straight to main?',
  'git blame someone else!',
  'Deploying with confidence!',
  'Cache invalidation is hard!',
  'Ready for code review?',
  '99 bugs in the code!',
  'All tests green today!',
  'Fix one bug, spawn three!',
  'Level up your codebase!',
  'Compiling... please wait!',
  'Hello, fellow developer!',
  'Real programmers count from 0!',
  "Let's squash some bugs!",
  'Crafting clean software!',
  'Infinite loop... just kidding!',
  'Compile once, run everywhere!',
  'Rubber duck approves this code!',
  'Speed up the pipeline!',
  'Documentation? We read the code!',
  'Let the review begin!',
  'Regex: now you have two!',
  'Code with great power!',
  'Ctrl+C, Ctrl+V, ship it!',
  'Brew coffee, review code!',
  'Powered by caffeine and AI!',
  'Another clean pull request!',
  'Sleep is for weakly typed!',
  'Ready to merge today?',
  'Optimize all the things!',
  'May your wifi stay fast!',
  'Stay in the flow!',
  'Good vibes and green builds!',
  'Sip coffee, ship features!',
  'Master the pull request!',
  'High performance code awaits!',
  'Debugging like a wizard!',
  'Time to refactor!',
  'Make it fast, clean!',
  'Ready to crush it?',
  'Building the future today!',
  'Sharp logic, clean syntax!',
  'Ship early, ship often!',
  'Keep the pipeline green!',
  'Welcome back, engineer!',
  'Ready for production?',
  "Let's make it work!",
  'Turning ideas into code!',
];

export function getRandomGreeting(): string {
  const index = Math.floor(Math.random() * NERD_GREETINGS.length);
  return NERD_GREETINGS[index];
}

/**
 * Returns a contextual, refreshable greeting tailored for the AI Chat interface.
 * Considers time of day (e.g. "Up late, engineer?" during late night hours)
 * mixed with punchy engineer-focused greetings that make sense.
 */
export function getChatGreeting(): string {
  const hour = new Date().getHours();

  if (hour >= 22 || hour < 5) {
    const lateNightOptions = [
      'Up late, engineer?',
      'Burning the midnight oil?',
      'Late night debugging session?',
      'Sleep is for weakly typed!',
      'Coffee in, code out!',
      'Debugging like a wizard!',
      'Ready to squash some bugs?',
      'May your wifi stay fast!',
      'Welcome back, engineer!',
      'Time to ship features!',
    ];
    return lateNightOptions[Math.floor(Math.random() * lateNightOptions.length)];
  }

  if (hour < 12) {
    const morningOptions = [
      'Good morning, engineer!',
      'Coffee in, code out!',
      'Ready to ship code?',
      'Clean code incoming!',
      'All tests green today!',
      "Let's build something awesome!",
      'Welcome back, engineer!',
      'Turning ideas into code!',
      'Sharp logic, clean syntax!',
    ];
    return morningOptions[Math.floor(Math.random() * morningOptions.length)];
  }

  if (hour < 17) {
    const afternoonOptions = [
      'Good afternoon, engineer!',
      'Keep the pipeline green!',
      'Time to ship features!',
      'Ready for code review?',
      'Stay in the flow!',
      'Deploying with confidence!',
      'Welcome back, engineer!',
      'Ship early, ship often!',
      'Level up your codebase!',
    ];
    return afternoonOptions[Math.floor(Math.random() * afternoonOptions.length)];
  }

  const eveningOptions = [
    'Good evening, engineer!',
    'Wrapping up the sprint?',
    'Ship early, ship often!',
    'High performance code awaits!',
    'Another clean pull request!',
    'Ready for code review?',
    'Welcome back, engineer!',
    'Crafting clean software!',
    'Master the pull request!',
  ];
  return eveningOptions[Math.floor(Math.random() * eveningOptions.length)];
}
