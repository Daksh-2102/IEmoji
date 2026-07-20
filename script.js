/* ==========================================================================
   iEmoji Keyboard - Interactive JavaScript Logic
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  
  // --- Audio Context for Synthetic Key Click Sounds ---
  let audioCtx = null;
  const soundToggle = document.getElementById("soundToggle");
  const soundPackSelect = document.getElementById("soundPackSelect");
  const vibrateToggle = document.getElementById("vibrateToggle");

  function playKeyClickSound() {
    if (!soundToggle || !soundToggle.checked) return;
    
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      // Resume if suspended (browser security policies)
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const soundPack = soundPackSelect ? soundPackSelect.value : "ios-tap";
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      if (soundPack === 'ios-tap') {
        // Classic high-pitched, short triangle wave tap
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.05);

        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 3;

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.07);
      } 
      else if (soundPack === 'mechanical') {
        // Double-click texture, metallic high-frequency burst
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1500, audioCtx.currentTime + 0.015);
        
        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.02);

        // Spring tick
        const tick = audioCtx.createOscillator();
        const tickGain = audioCtx.createGain();
        tick.type = 'sine';
        tick.frequency.setValueAtTime(4500, audioCtx.currentTime);
        
        tickGain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        tickGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.006);
        
        osc.connect(gainNode);
        tick.connect(tickGain);
        
        gainNode.connect(audioCtx.destination);
        tickGain.connect(audioCtx.destination);
        
        osc.start();
        tick.start();
        
        osc.stop(audioCtx.currentTime + 0.03);
        tick.stop(audioCtx.currentTime + 0.01);
      } 
      else if (soundPack === 'bubble-pop') {
        // Soft descending pop
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(280, audioCtx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.13);
      }
    } catch (e) {
      console.warn("AudioContext failed to load or play", e);
    }
  }

  // --- Keyboard Layout System ---
  const KEYBOARD_STATES = {
    ALPHA_LOWER: 'ALPHA_LOWER',
    ALPHA_UPPER: 'ALPHA_UPPER',
    NUMERIC: 'NUMERIC',
    EMOJI: 'EMOJI'
  };

  // Keyboard character definitions
  const layouts = {
    alpha: [
      ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
      ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
      ['123', 'emoji', 'space', 'return']
    ],
    numeric: [
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
      ['-', '/', ':', ';', '(', ')', '$', '&', '@', '"'],
      ['#+=', '.', ',', '?', '!', "'", 'backspace'],
      ['abc', 'emoji', 'space', 'return']
    ],
    emoji: [
      ['😄', '😂', '🥰', '😍', '😘', '😜', '🤔', '🙄', '😬', '😴'],
      ['👍', '👎', '🔥', '🎉', '❤️', '💔', '💀', '👀', '🚀', '💯'],
      ['🌟', '🌈', '🍕', '🍔', '🍟', '🍺', '🚗', '📱', 'backspace'],
      ['abc', '123', 'space', 'return']
    ]
  };

  const EMOJI_CATEGORIES = {
    smileys: {
      icon: '😀',
      emojis: [
        '😂', '❤️', '🤣', '👍', '😭', '🙏', '😘', '🥰', '😍', '😊',
        '🎉', '😁', '🥺', '🔥', '😉', '💀', '👏', '😎', '💖', '💙',
        '💩', '🙈', '🙌', '🤩', '😜', '🤔', '🙄', '😬', '😴', '💯',
        '👀', '✨', '😋', '🥳', '😏', '🎈', '🎁', '🎂', '🌹', '🌸',
        '💘', '💕', '🤝', '👑', '🌈', '⚡', '💜', '🧡', '💛', '💚',
        '🤎', '🖤', '🤍', '💔', '❣️', '💞', '💓', '💗', '💝', '👥'
      ]
    },
    animals: {
      icon: '🐱',
      emojis: [
        '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
        '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐝', '🐛',
        '🦋', '🐞', '🐜', '🕷️', '🕸️', '🐢', '🐍', '🐙', '🦑', '🦞',
        '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅',
        '🐆', '🦓', '🦍', '🐘', '🦏', '🐪', '🐫', '🦒', '🐃', '🐂',
        '🐄', '🐎', '🐖', '🐏', '🐑', '🐐', '🦌', '🐕', '🐈', '🐇',
        '🐾', '🐉', '🌵', '🎄', '🌲', '🌳', '🌴', '🌱', '🌿', '🍀',
        '🍁', '🍂', '🍃'
      ]
    },
    food: {
      icon: '🍔',
      emojis: [
        '🍏', '🍎', '🍌', '🍉', '🍇', '🍓', '🍒', '🍍', '🥥', '🥝',
        '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🥔',
        '🍠', '🥐', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🥞', '🥓',
        '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🌮',
        '🌯', '🥗', '🥘', '🍲', '🥣', '🍦', '🍩', '🍪', '🎂', '🍰',
        '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '🥛', '☕', '🍵',
        '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥤', '🥢'
      ]
    },
    activities: {
      icon: '⚽',
      emojis: [
        '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸',
        '🥅', '🏒', '🏑', '🏏', '⛳', '🏹', '🎣', '🥊', '🥋', '🛹',
        '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🏋️', '🤼', '🤸', '🤺',
        '🚴', '🚵', '🏇', '🎭', '🎨', '🎬', '🎤', '🎧', '🎫', '🎟️',
        '🎪', '🎡', '🎢', '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓',
        '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛴', '🚲', '🛵', '🏍️',
        '🚨', '🚄', '🚅', '✈️', '🚀', '🚁', '⛵', '🚢', '⚓', '🌋',
        '⛺', '🏖️', '🏜️', '🏝️', '🎮', '🕹️', '🏆'
      ]
    },
    symbols: {
      icon: '💡',
      emojis: [
        '💡', '⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '📷', '📸',
        '📹', '🎥', '📽️', '📞', '☎️', '📟', '📠', '电视', '📺', '📻',
        '🎙️', '🎚️', '🎛️', '🧭', '⏰', '⏳', '🔑', '🗝️', '🔨', '⛏️',
        '⚒️', '🛠️', '🗡️', '⚔️', '🛡️', '🔧', '🔩', '⚙️', '🗜️', '⚖️',
        '🔗', '⛓️', '💉', '💊', '🩹', '🧼', '🪞', '🧴', '🧻', '🧹',
        '🧺', '🛏️', '🛋️', '🚪', '🚬', '⚰️', '⚱️', '🏺', '🔮', '🧿',
        '✉️', '📦', '🏷️', '📜', '📄', '📚', '📓', '✏️', '✅', '⚠️',
        '🔇', '🔔'
      ]
    }
  };

  // --- Typing Test Global Variables ---
  let typingTestActive = false;
  let typingTestTarget = "iphone emojis look incredible on android devices! 👍";
  let typingTestIndex = 0;
  let typingTestErrors = 0;
  let typingTestStartTime = 0;
  let timerInterval = null;

  // Setup the keyboards
  setupKeyboard("keyboardKeys", "chatInputText", "chatInputPlaceholder", "chatMessages", "chatSendBtn");
  setupKeyboard("playKeyboardKeys", "playInputText", "playInputPlaceholder", "playChatMessages", "playSendBtn");

  function setupKeyboard(keyboardContainerId, inputAreaId, placeholderId, chatMessagesId, sendBtnId) {
    const keyboardContainer = document.getElementById(keyboardContainerId);
    const inputArea = document.getElementById(inputAreaId);
    const placeholder = document.getElementById(placeholderId);
    const chatMessages = document.getElementById(chatMessagesId);
    const sendBtn = document.getElementById(sendBtnId);
    
    if (!keyboardContainer || !inputArea) return;

    let currentState = KEYBOARD_STATES.ALPHA_LOWER;

    function renderKeyboard() {
      keyboardContainer.innerHTML = "";
      
      if (currentState === KEYBOARD_STATES.EMOJI) {
        keyboardContainer.classList.add("emoji-keyboard-active");
        
        // 1. Categories bar
        const categoryBar = document.createElement("div");
        categoryBar.className = "emoji-category-bar";
        
        // Track current active category
        if (!keyboardContainer.activeEmojiCategory) {
          keyboardContainer.activeEmojiCategory = "smileys";
        }
        
        Object.keys(EMOJI_CATEGORIES).forEach(catKey => {
          const tab = document.createElement("button");
          tab.className = "emoji-cat-tab";
          if (keyboardContainer.activeEmojiCategory === catKey) {
            tab.classList.add("active");
          }
          tab.textContent = EMOJI_CATEGORIES[catKey].icon;
          tab.addEventListener("click", (e) => {
            e.preventDefault();
            // Trigger sound & haptics for tab click
            if (keyboardContainerId === 'playKeyboardKeys') {
              if (vibrateToggle && vibrateToggle.checked && navigator.vibrate) {
                navigator.vibrate(10);
              }
            }
            playKeyClickSound();
            
            keyboardContainer.activeEmojiCategory = catKey;
            renderKeyboard();
          });
          categoryBar.appendChild(tab);
        });
        keyboardContainer.appendChild(categoryBar);
        
        // 2. Scrollable Emoji Grid
        const grid = document.createElement("div");
        grid.className = "emoji-scroll-grid";
        
        const currentCategory = EMOJI_CATEGORIES[keyboardContainer.activeEmojiCategory];
        currentCategory.emojis.forEach(emoji => {
          const emojiBtn = document.createElement("button");
          emojiBtn.className = "key emoji-grid-key";
          emojiBtn.textContent = emoji;
          emojiBtn.addEventListener("click", (e) => {
            e.preventDefault();
            
            // Check vibration toggle for physical vibration
            if (keyboardContainerId === 'playKeyboardKeys') {
              if (vibrateToggle && vibrateToggle.checked && navigator.vibrate) {
                navigator.vibrate(12);
              }
            }
            
            playKeyClickSound();
            handleKeyPress(emoji);
          });
          grid.appendChild(emojiBtn);
        });
        keyboardContainer.appendChild(grid);
        
        // 3. Bottom controls bar
        const bottomRow = document.createElement("div");
        bottomRow.className = "kb-row emoji-bottom-row";
        
        const controls = [
          { label: 'abc', action: () => { currentState = KEYBOARD_STATES.ALPHA_LOWER; } },
          { label: '123', action: () => { currentState = KEYBOARD_STATES.NUMERIC; } },
          { label: 'space', action: () => { handleKeyPress('space'); } },
          { label: 'return', action: () => { handleKeyPress('return'); } },
          { label: 'backspace', action: () => { handleKeyPress('backspace'); } }
        ];
        
        controls.forEach(ctrl => {
          const ctrlBtn = document.createElement("button");
          ctrlBtn.className = "key";
          
          if (ctrl.label === 'backspace') {
            ctrlBtn.classList.add("backspace-key");
            ctrlBtn.innerHTML = `<svg class="key-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 4H8L1 12l7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="18" y1="9" x2="12" y2="15" stroke-linecap="round"/>
              <line x1="12" y1="9" x2="18" y2="15" stroke-linecap="round"/>
            </svg>`;
          } else if (ctrl.label === 'space') {
            ctrlBtn.classList.add("space-key");
            ctrlBtn.textContent = "space";
          } else if (ctrl.label === 'return') {
            ctrlBtn.classList.add("return-key");
            ctrlBtn.textContent = "return";
          } else {
            ctrlBtn.classList.add("toggle-sym-key");
            ctrlBtn.textContent = ctrl.label.toUpperCase();
          }
          
          ctrlBtn.addEventListener("click", (e) => {
            e.preventDefault();
            
            if (keyboardContainerId === 'playKeyboardKeys') {
              if (vibrateToggle && vibrateToggle.checked && navigator.vibrate) {
                navigator.vibrate(12);
              }
            }
            
            playKeyClickSound();
            ctrl.action();
            renderKeyboard();
          });
          bottomRow.appendChild(ctrlBtn);
        });
        
        keyboardContainer.appendChild(bottomRow);
        return;
      } else {
        keyboardContainer.classList.remove("emoji-keyboard-active");
      }

      let rows = [];
      if (currentState === KEYBOARD_STATES.ALPHA_LOWER || currentState === KEYBOARD_STATES.ALPHA_UPPER) {
        rows = layouts.alpha;
      } else if (currentState === KEYBOARD_STATES.NUMERIC) {
        rows = layouts.numeric;
      }

      rows.forEach((row, rowIndex) => {
        const rowEl = document.createElement("div");
        rowEl.className = "kb-row";
        if (rowIndex === 1) {
          rowEl.classList.add("pad-x-mid");
        }

        row.forEach(key => {
          const btn = document.createElement("button");
          btn.className = "key";
          
          // Identify key labels and actions
          if (key === 'shift') {
            btn.classList.add("shift-key");
            btn.innerHTML = `<svg class="key-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 19V5M12 5l-7 7M12 5l7 7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;
            if (currentState === KEYBOARD_STATES.ALPHA_UPPER) {
              btn.style.backgroundColor = "#ffffff";
              btn.style.color = "#000000";
            }
          } else if (key === 'backspace') {
            btn.classList.add("backspace-key");
            btn.innerHTML = `<svg class="key-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 4H8L1 12l7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="18" y1="9" x2="12" y2="15" stroke-linecap="round"/>
              <line x1="12" y1="9" x2="18" y2="15" stroke-linecap="round"/>
            </svg>`;
          } else if (key === 'space') {
            btn.classList.add("space-key");
            btn.textContent = "space";
          } else if (key === 'return') {
            btn.classList.add("return-key");
            btn.textContent = "return";
          } else if (key === '123' || key === '#+=') {
            btn.classList.add("toggle-sym-key");
            btn.textContent = "123";
          } else if (key === 'abc') {
            btn.classList.add("toggle-sym-key");
            btn.textContent = "ABC";
          } else if (key === 'emoji') {
            btn.classList.add("emoji-switch-key");
            btn.textContent = "😀";
          } else {
            // Normal key
            if (currentState === KEYBOARD_STATES.ALPHA_UPPER) {
              btn.textContent = key.toUpperCase();
            } else {
              btn.textContent = key;
            }
          }

          // Key press interaction
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            
            // Check vibration toggle for physical vibration (Playground sandbox only)
            if (keyboardContainerId === 'playKeyboardKeys') {
              if (vibrateToggle && vibrateToggle.checked && navigator.vibrate) {
                navigator.vibrate(12);
              }
            }
            
            playKeyClickSound();
            handleKeyPress(key);
          });

          rowEl.appendChild(btn);
        });

        keyboardContainer.appendChild(rowEl);
      });
    }

    function handleKeyPress(key) {
      // If typing speed test is active and this is the playground keyboard
      if (keyboardContainerId === 'playKeyboardKeys' && typingTestActive) {
        if (['shift', '123', '#+=', 'abc', 'emoji', 'return'].includes(key)) {
          // Allow keyboard layout transitions normally
          runLayoutTransitions(key);
          return;
        }
        
        // Handle actual character keys in typing test
        let expectedChar = typingTestTarget.charAt(typingTestIndex);
        let pressedChar = key;
        if (key === 'space') pressedChar = ' ';
        
        // Match expected capitalization if shift was active
        if (currentState === KEYBOARD_STATES.ALPHA_UPPER && key !== 'backspace') {
          pressedChar = key.toUpperCase();
        }
        
        if (pressedChar === expectedChar) {
          typingTestIndex++;
          inputArea.textContent += pressedChar;
          
          // Reset shift if layout was uppercase
          if (currentState === KEYBOARD_STATES.ALPHA_UPPER) {
            currentState = KEYBOARD_STATES.ALPHA_LOWER;
            renderKeyboard();
          }
          
          updatePlaceholder();
          
          // Complete test if target reached
          if (typingTestIndex === typingTestTarget.length) {
            completeTypingTest(inputArea, chatMessages);
          } else {
            updateTypingTestUI();
          }
        } else {
          // Typos count as errors
          typingTestErrors++;
          updateTypingTestUI();
          
          // Visual shake feedback on the typing card target
          const targetEl = document.getElementById("typingTestTarget");
          if (targetEl) {
            targetEl.style.borderColor = "#ff3b30";
            setTimeout(() => { targetEl.style.borderColor = "var(--primary)"; }, 150);
          }
        }
        return;
      }
      
      // Default typing logic
      runLayoutTransitions(key);
    }

    function runLayoutTransitions(key) {
      if (key === 'shift') {
        if (currentState === KEYBOARD_STATES.ALPHA_LOWER) {
          currentState = KEYBOARD_STATES.ALPHA_UPPER;
        } else {
          currentState = KEYBOARD_STATES.ALPHA_LOWER;
        }
        renderKeyboard();
      } else if (key === 'backspace') {
        const text = inputArea.textContent;
        // Delete last character, checking for multi-byte emojis
        if (text.length > 0) {
          const charArray = Array.from(text);
          charArray.pop();
          inputArea.textContent = charArray.join("");
        }
        updatePlaceholder();
      } else if (key === 'space') {
        inputArea.textContent += " ";
        updatePlaceholder();
      } else if (key === 'return') {
        sendMessage();
      } else if (key === '123' || key === '#+=') {
        currentState = KEYBOARD_STATES.NUMERIC;
        renderKeyboard();
      } else if (key === 'abc') {
        currentState = KEYBOARD_STATES.ALPHA_LOWER;
        renderKeyboard();
      } else if (key === 'emoji') {
        currentState = KEYBOARD_STATES.EMOJI;
        renderKeyboard();
      } else {
        // Character key
        let textToAdd = key;
        if (currentState === KEYBOARD_STATES.ALPHA_UPPER) {
          textToAdd = key.toUpperCase();
        }
        inputArea.textContent += textToAdd;
        
        // Auto lowercase after typing one character in uppercase
        if (currentState === KEYBOARD_STATES.ALPHA_UPPER) {
          currentState = KEYBOARD_STATES.ALPHA_LOWER;
          renderKeyboard();
        }
        updatePlaceholder();
      }
    }

    function updatePlaceholder() {
      if (inputArea.textContent.length > 0) {
        placeholder.style.display = "none";
      } else {
        placeholder.style.display = "block";
      }
    }

    function sendMessage() {
      const text = inputArea.textContent.trim();
      if (!text) return;

      // Render sent message
      const timeStr = getFormattedTime();
      const msgEl = document.createElement("div");
      msgEl.className = "msg msg-sent";
      msgEl.innerHTML = `
        <div class="msg-content">${escapeHTML(text)}</div>
        <span class="msg-time">${timeStr}</span>
      `;
      chatMessages.appendChild(msgEl);
      
      // Clear input
      inputArea.textContent = "";
      updatePlaceholder();

      // Scroll chat to bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;

      // Simulated auto-reply
      triggerAutoReply(chatMessages);
    }

    // Bind direct click to send button as well
    if (sendBtn) {
      sendBtn.addEventListener("click", (e) => {
        e.preventDefault();
        sendMessage();
      });
    }

    // Initialize layout
    renderKeyboard();
  }

  // --- Auto-Reply Messages System ---
  const BOT_REPLIES = [
    "Wow, this typing experience is so fluid! 😍 Layout matches perfectly.",
    "Are those emojis renders native to iOS? They look incredibly clean! 🔥",
    "I'm downloading the APK file right now. Can't wait to set this up! 🚀",
    "Privacy protection makes it an instant win. 🔒 Perfect replacement keyboard.",
    "Standard theme renders perfectly. Try switching keyboard layouts in the sandbox! 🎨",
  ];
  let replyIndex = 0;

  function triggerAutoReply(chatMessagesEl) {
    setTimeout(() => {
      const timeStr = getFormattedTime();
      const replyText = BOT_REPLIES[replyIndex];
      replyIndex = (replyIndex + 1) % BOT_REPLIES.length;

      const msgEl = document.createElement("div");
      msgEl.className = "msg msg-received";
      msgEl.innerHTML = `
        <div class="msg-content">${replyText}</div>
        <span class="msg-time">${timeStr}</span>
      `;
      chatMessagesEl.appendChild(msgEl);
      chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    }, 1500);
  }

  // Helper: Get formatted HH:MM
  function getFormattedTime() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutes}`;
  }

  // Helper: Escape strings for safety
  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }


  // --- Mobile Hamburger Menu ---
  const mobileToggle = document.querySelector(".mobile-toggle");
  const navMenu = document.querySelector(".nav-menu");

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener("click", () => {
      mobileToggle.classList.toggle("active");
      navMenu.classList.toggle("active");
    });

    // Close menu when clicking nav link
    document.querySelectorAll(".nav-link").forEach(link => {
      link.addEventListener("click", () => {
        mobileToggle.classList.remove("active");
        navMenu.classList.remove("active");
      });
    });
  }


  // --- Control Panel Customizations ---
  const themeBtns = document.querySelectorAll(".theme-btn");
  const playgroundPhone = document.querySelector(".playground-phone");

  themeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      // Toggle active states
      themeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      // Apply corresponding class to phone
      const selectedTheme = btn.getAttribute("data-theme");
      
      // Remove previous layout classes
      playgroundPhone.classList.remove("theme-light", "theme-dark", "theme-navy", "theme-sunset");
      
      if (selectedTheme !== 'light') {
        playgroundPhone.classList.add(`theme-${selectedTheme}`);
      }
    });
  });

  // Toggle custom keyboard fonts
  const emojiResolutionSelect = document.getElementById("emojiResolution");
  const playgroundKeyboard = document.getElementById("playKeyboard");
  
  if (emojiResolutionSelect && playgroundKeyboard) {
    emojiResolutionSelect.addEventListener("change", () => {
      if (emojiResolutionSelect.value === 'system-native') {
        playgroundKeyboard.style.fontFamily = 'inherit';
      } else {
        playgroundKeyboard.style.fontFamily = '-apple-system, BlinkMacSystemFont, "SF Pro Text", Helvetica, sans-serif';
      }
    });
  }


  // --- FAQ Accordions ---
  const faqTriggers = document.querySelectorAll(".faq-trigger");

  faqTriggers.forEach(trigger => {
    trigger.addEventListener("click", () => {
      const isExpanded = trigger.getAttribute("aria-expanded") === "true";
      const content = trigger.nextElementSibling;

      // Close other accordions
      faqTriggers.forEach(otherTrigger => {
        if (otherTrigger !== trigger) {
          otherTrigger.setAttribute("aria-expanded", "false");
          otherTrigger.nextElementSibling.style.maxHeight = null;
        }
      });

      if (isExpanded) {
        trigger.setAttribute("aria-expanded", "false");
        content.style.maxHeight = null;
      } else {
        trigger.setAttribute("aria-expanded", "true");
        content.style.maxHeight = content.scrollHeight + "px";
      }
    });
  });


  // --- Simulated APK Download Action & Actual Download Trigger ---
  function showToast(title, message) {
    let toast = document.getElementById("downloadToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "downloadToast";
      toast.className = "toast-notification";
      toast.innerHTML = `
        <div class="toast-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div class="toast-content">
          <span class="toast-title" id="toastTitle"></span>
          <span class="toast-message" id="toastMessage"></span>
        </div>
      `;
      document.body.appendChild(toast);
    }
    
    toast.querySelector("#toastTitle").textContent = title;
    toast.querySelector("#toastMessage").textContent = message;
    
    // Trigger reflow
    toast.offsetHeight;
    
    toast.classList.add("active");
    
    setTimeout(() => {
      toast.classList.remove("active");
    }, 4500);
  }

  const mainDownloadBtn = document.getElementById("mainDownloadBtn");
  const downloadProgressContainer = document.getElementById("downloadProgressContainer");
  const downloadProgressBar = document.getElementById("downloadProgressBar");
  const downloadProgressLabel = document.getElementById("downloadProgressLabel");
  let isDownloading = false;

  if (mainDownloadBtn && downloadProgressContainer && downloadProgressBar) {
    mainDownloadBtn.addEventListener("click", (e) => {
      // Prevent duplicate triggers if already downloading
      if (isDownloading) {
        e.preventDefault();
        return;
      }
      isDownloading = true;

      // Allow browser's native download action to run directly from user gesture (no e.preventDefault())
      
      // Update visual styles immediately
      mainDownloadBtn.style.opacity = "0.7";
      downloadProgressContainer.style.display = "block";

      // Defer pointer-events: none to a new execution cycle so the browser's 
      // default click download gesture is successfully registered first.
      setTimeout(() => {
        if (mainDownloadBtn) {
          mainDownloadBtn.style.pointerEvents = "none";
        }
      }, 0);

      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 15) + 5;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          downloadProgressBar.style.width = "100%";
          downloadProgressLabel.textContent = "Download Complete! Preparing file...";
          downloadProgressLabel.style.color = "#34c759";
          
          setTimeout(() => {
            // Restore button
            isDownloading = false;
            if (mainDownloadBtn) {
              mainDownloadBtn.style.pointerEvents = "auto";
              mainDownloadBtn.style.opacity = "1";
            }
            if (downloadProgressContainer) downloadProgressContainer.style.display = "none";
            if (downloadProgressBar) downloadProgressBar.style.width = "0%";
            if (downloadProgressLabel) {
              downloadProgressLabel.textContent = "Downloading: 0%";
              downloadProgressLabel.style.color = "#34c759";
            }
            
            // Show custom toast notification instead of browser alert
            showToast(
              "Download Started! 🚀",
              "Check your browser downloads. Follow the FAQ steps below to install."
            );
            
            // Smoothly scroll down to the FAQ section
            const faqSection = document.getElementById("faq");
            if (faqSection) {
              faqSection.scrollIntoView({ behavior: "smooth" });
            }
          }, 1200);
        } else {
          downloadProgressBar.style.width = `${progress}%`;
          downloadProgressLabel.textContent = `Downloading: ${progress}%`;
        }
      }, 200);
    });
  }


  // --- Modals (Privacy / Terms Content) ---
  const legalModal = document.getElementById("legalModal");
  const modalCloseBtn = document.getElementById("modalCloseBtn");
  const modalBodyText = document.getElementById("modalBodyText");
  const legalPrivacyLink = document.getElementById("legalPrivacyLink");
  const legalTermsLink = document.getElementById("legalTermsLink");

  const PRIVACY_CONTENT = `
    <h2>Privacy Policy</h2>
    <p>Last updated: July 18, 2026</p>
    <p>We respect your privacy. This policy outlines how <strong>iEmoji Keyboard</strong> handles details relative to installations and use.</p>
    
    <h3>1. Information Collection</h3>
    <p>iEmoji Keyboard runs entirely local. All key log logs, typing suggestions, emojis typed, and text logs remain safely compiled inside your local sandboxed app data. <strong>We do not run servers or connect to remote storage endpoints to track your key input.</strong></p>
    
    <h3>2. Permissions</h3>
    <p>Our app requires only local IME (Input Method Editor) activations. We DO NOT request internet permissions, camera controls, contacts list, or GPS geolocation permissions.</p>
    
    <h3>3. Security Audits</h3>
    <p>Our build code is fully open-source and regularly scanned by Google Play Protect, ensuring zero malware, tracking modules, or Trojan frameworks are packaged inside the APK file.</p>
  `;

  const TERMS_CONTENT = `
    <h2>Terms of Service</h2>
    <p>Last updated: July 18, 2026</p>
    <p>Please read these Terms carefully before using the iEmoji Keyboard utility software.</p>
    
    <h3>1. License & Usage</h3>
    <p>iEmoji Keyboard is provided free of charge for personal and non-commercial utility usage. You may redistribute the secure APK without making direct modifications to the packages.</p>
    
    <h3>2. Disclaimers</h3>
    <p>This software is provided "as is" without warranty of any kind. Under no circumstances will our developer team be liable for system conflicts or font rendering anomalies on custom OEM distributions.</p>
    
    <h3>3. Intellectual Property</h3>
    <p>iEmoji Keyboard is an independent utility. Apple, iPhone, and iOS are trademarks of Apple Inc., registered in the U.S. and other countries. The project forms no claims of endorsement, licensing, or official affiliation with Apple Inc.</p>
  `;

  function openModal(htmlContent) {
    if (!legalModal || !modalBodyText) return;
    modalBodyText.innerHTML = htmlContent;
    legalModal.classList.add("active");
    document.body.style.overflow = "hidden"; // Disable background scrolling
  }

  function closeModal() {
    if (!legalModal) return;
    legalModal.classList.remove("active");
    document.body.style.overflow = "auto";
  }

  if (legalPrivacyLink) {
    legalPrivacyLink.addEventListener("click", (e) => {
      e.preventDefault();
      openModal(PRIVACY_CONTENT);
    });
  }

  if (legalTermsLink) {
    legalTermsLink.addEventListener("click", (e) => {
      e.preventDefault();
      openModal(TERMS_CONTENT);
    });
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", closeModal);
  }

  if (legalModal) {
    legalModal.querySelector(".modal-overlay").addEventListener("click", closeModal);
  }

  // Handle escape key to close modal
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
    }
  });


  // --- Site-wide Dark Mode Toggle ---
  const siteThemeToggle = document.getElementById("siteThemeToggle");
  if (siteThemeToggle) {
    // Check saved theme
    if (localStorage.getItem("siteTheme") === "dark") {
      document.body.classList.add("dark-theme");
      siteThemeToggle.textContent = "☀️";
    }
    
    siteThemeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-theme");
      const isDark = document.body.classList.contains("dark-theme");
      siteThemeToggle.textContent = isDark ? "☀️" : "🌙";
      localStorage.setItem("siteTheme", isDark ? "dark" : "light");
    });
  }

  // --- Keyboard Background Image Uploader ---
  const bgUploadInput = document.getElementById("bgUploadInput");
  const bgUploadTrigger = document.getElementById("bgUploadTrigger");
  const bgResetBtn = document.getElementById("bgResetBtn");
  const playKeyboard = document.getElementById("playKeyboard");
  
  if (bgUploadTrigger && bgUploadInput && playKeyboard && bgResetBtn) {
    bgUploadTrigger.addEventListener("click", (e) => {
      e.preventDefault();
      bgUploadInput.click();
    });
    
    bgUploadInput.addEventListener("change", () => {
      const file = bgUploadInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          playKeyboard.style.backgroundImage = `url('${e.target.result}')`;
          playKeyboard.classList.add("has-bg");
          bgResetBtn.style.display = "block";
        };
        reader.readAsDataURL(file);
      }
    });
    
    bgResetBtn.addEventListener("click", (e) => {
      e.preventDefault();
      playKeyboard.style.backgroundImage = "none";
      playKeyboard.classList.remove("has-bg");
      bgResetBtn.style.display = "none";
      bgUploadInput.value = "";
    });
  }

  // --- Typing Test Initialization and Helpers ---
  const startTypingTestBtn = document.getElementById("startTypingTestBtn");
  const playChatMessages = document.getElementById("playChatMessages");
  const playInputText = document.getElementById("playInputText");
  const playInputPlaceholder = document.getElementById("playInputPlaceholder");

  if (startTypingTestBtn && playChatMessages && playInputText) {
    startTypingTestBtn.addEventListener("click", (e) => {
      e.preventDefault();
      
      // Clear sandbox input
      playInputText.textContent = "";
      if (playInputPlaceholder) playInputPlaceholder.style.display = "block";
      
      // Stop old test if active
      clearInterval(timerInterval);
      
      // Initialize stats
      typingTestActive = true;
      typingTestIndex = 0;
      typingTestErrors = 0;
      typingTestStartTime = Date.now();
      
      // Remove old cards
      const oldCard = document.getElementById("typingTestCard");
      if (oldCard) oldCard.remove();
      
      // Render test card
      const testCard = document.createElement("div");
      testCard.className = "typing-test-card";
      testCard.id = "typingTestCard";
      testCard.innerHTML = `
        <div class="typing-test-target" id="typingTestTarget"></div>
        <div class="typing-test-progress" id="typingTestProgress">Type the exact text above using the keyboard keys. Switch to symbol panel (123) and emoji panel (😀) as needed.</div>
        <div class="typing-test-stats">
          <span>Accuracy: <span class="stat-value" id="typingTestAcc">100%</span></span>
          <span>Time: <span class="stat-value" id="typingTestTime">0.0s</span></span>
          <span>WPM: <span class="stat-value" id="typingTestWpm">0</span></span>
        </div>
      `;
      playChatMessages.appendChild(testCard);
      playChatMessages.scrollTop = playChatMessages.scrollHeight;
      
      updateTypingTestUI();
      
      // Count up timer
      timerInterval = setInterval(() => {
        if (typingTestActive) {
          const elapsed = (Date.now() - typingTestStartTime) / 1000;
          const timeEl = document.getElementById("typingTestTime");
          if (timeEl) timeEl.textContent = `${elapsed.toFixed(1)}s`;
          
          const min = elapsed / 60;
          const wpm = min > 0 ? Math.round((typingTestIndex / 5) / min) : 0;
          const wpmEl = document.getElementById("typingTestWpm");
          if (wpmEl) wpmEl.textContent = wpm;
        } else {
          clearInterval(timerInterval);
        }
      }, 100);
      
      // Smooth scroll the device into view
      document.getElementById("demo").scrollIntoView({ behavior: "smooth" });
    });
  }

  function updateTypingTestUI() {
    const targetEl = document.getElementById("typingTestTarget");
    const accEl = document.getElementById("typingTestAcc");
    
    if (!targetEl) return;
    
    const correctPart = typingTestTarget.slice(0, typingTestIndex);
    const activeChar = typingTestTarget.charAt(typingTestIndex);
    const remainingPart = typingTestTarget.slice(typingTestIndex + 1);
    
    targetEl.innerHTML = `
      <span class="typing-test-highlight">${escapeHTML(correctPart)}</span>
      <span style="text-decoration: underline; font-weight: bold; border-bottom: 2.5px solid var(--primary);">${escapeHTML(activeChar || "")}</span>
      <span>${escapeHTML(remainingPart)}</span>
    `;
    
    const totalInput = typingTestIndex + typingTestErrors;
    const accuracy = totalInput > 0 ? ((typingTestIndex / totalInput) * 100) : 100;
    if (accEl) accEl.textContent = `${Math.round(accuracy)}%`;
  }

  function completeTypingTest(inputArea, chatMessages) {
    typingTestActive = false;
    clearInterval(timerInterval);
    
    const elapsed = (Date.now() - typingTestStartTime) / 1000;
    const totalInput = typingTestIndex + typingTestErrors;
    const accuracy = totalInput > 0 ? ((typingTestIndex / totalInput) * 100) : 100;
    const min = elapsed / 60;
    const wpm = min > 0 ? Math.round((typingTestIndex / 5) / min) : 0;
    
    // Clear sandbox inputs
    inputArea.textContent = "";
    
    // Add success chat message from sent user
    const timeStr = getFormattedTime();
    const userMsg = document.createElement("div");
    userMsg.className = "msg msg-sent";
    userMsg.innerHTML = `
      <div class="msg-content">Speed test complete! ⚡ I typed ${wpm} WPM with ${Math.round(accuracy)}% accuracy!</div>
      <span class="msg-time">${timeStr}</span>
    `;
    chatMessages.appendChild(userMsg);
    
    // Remove the typing test widget
    const card = document.getElementById("typingTestCard");
    if (card) card.remove();
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Bot reply congratulating the user
    setTimeout(() => {
      const botMsg = document.createElement("div");
      botMsg.className = "msg msg-received";
      botMsg.innerHTML = `
        <div class="msg-content">Incredible typing speed! 🏆 ${wpm} WPM is lightning fast! Get the full keyboard APK below to type this fast everywhere!</div>
        <span class="msg-time">${getFormattedTime()}</span>
      `;
      chatMessages.appendChild(botMsg);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1200);
  }

});
