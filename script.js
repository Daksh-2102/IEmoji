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
        if (window.AndroidKeyboard && window.AndroidKeyboard.deleteChar) {
          window.AndroidKeyboard.deleteChar();
        }
      } else if (key === 'space') {
        inputArea.textContent += " ";
        updatePlaceholder();
        if (window.AndroidKeyboard && window.AndroidKeyboard.typeText) {
          window.AndroidKeyboard.typeText(" ");
        }
      } else if (key === 'return') {
        sendMessage();
        if (window.AndroidKeyboard && window.AndroidKeyboard.sendEnter) {
          window.AndroidKeyboard.sendEnter();
        }
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
        
        if (window.AndroidKeyboard && window.AndroidKeyboard.typeText) {
          window.AndroidKeyboard.typeText(textToAdd);
        }
        
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

  // --- Copy SHA-256 Checksum ---
  const copyHashBtn = document.getElementById("copyHashBtn");
  const apkHashEl = document.getElementById("apkHash");
  if (copyHashBtn && apkHashEl) {
    copyHashBtn.addEventListener("click", () => {
      const hashText = apkHashEl.textContent.trim();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(hashText);
      } else {
        const ta = document.createElement("textarea");
        ta.value = hashText;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      showToast("Checksum Copied! 📋", "SHA-256 hash copied to clipboard.");
    });
  }

  // --- Universal Download Buttons & Visual Progress Feedback ---
  const downloadTriggers = document.querySelectorAll(".btn-download-trigger");
  const progressContainer = document.getElementById("downloadProgressContainer");
  const progressBar = document.getElementById("downloadProgressBar");
  const progressLabel = document.getElementById("downloadProgressLabel");

  downloadTriggers.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      // Scroll smoothly to download section
      const downloadSec = document.getElementById("download");
      if (downloadSec && btn.id !== "mainDownloadBtn") {
        downloadSec.scrollIntoView({ behavior: "smooth" });
      }

      // Show progress bar
      if (progressContainer && progressBar && progressLabel) {
        progressContainer.style.display = "block";
        let progress = 0;
        progressBar.style.width = "0%";
        progressLabel.textContent = "Initiating APK Download: 0%";
        progressLabel.style.color = "var(--primary)";

        const interval = setInterval(() => {
          progress += Math.floor(Math.random() * 18) + 14;
          if (progress >= 100) {
            progress = 100;
            progressBar.style.width = "100%";
            progressLabel.textContent = "✓ APK Download Started! Check your downloads manager.";
            progressLabel.style.color = "#34c759";
            clearInterval(interval);
          } else {
            progressBar.style.width = progress + "%";
            progressLabel.textContent = `Downloading iEmoji APK: ${progress}%`;
          }
        }, 100);
      }

      // Programmatic direct download trigger for mobile browsers
      try {
        const link = document.createElement("a");
        link.href = "./iemoji-keyboard.apk";
        link.download = "iemoji-keyboard.apk";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.log("Direct link click initiated", err);
      }
    });
  });


  // --- Site-wide Dark Mode Toggle ---
  const siteThemeToggle = document.getElementById("siteThemeToggle");
  if (siteThemeToggle) {
    const savedTheme = localStorage.getItem("siteTheme");
    
    if (savedTheme === "dark") {
      document.body.classList.add("dark-theme");
      siteThemeToggle.textContent = "☀️";
    } else if (savedTheme === "light") {
      document.body.classList.remove("dark-theme");
      siteThemeToggle.textContent = "🌙";
    } else {
      // No saved preference — auto-detect from OS
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add("dark-theme");
        siteThemeToggle.textContent = "☀️";
      }
    }
    
    // Live listener: follow OS changes unless user has manually set a preference
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem("siteTheme")) {
          if (e.matches) {
            document.body.classList.add("dark-theme");
            siteThemeToggle.textContent = "☀️";
          } else {
            document.body.classList.remove("dark-theme");
            siteThemeToggle.textContent = "🌙";
          }
        }
      });
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


  // ==========================================================================
  // Emoji Copy-Paste Picker — Full Feature Module
  // ==========================================================================

  const EP_EMOJI_DATA = [
    // --- Smileys & People ---
    { e: '😀', name: 'grinning face', shortcode: ':grinning:', cat: 'smileys', skin: false },
    { e: '😃', name: 'grinning face with big eyes', shortcode: ':smiley:', cat: 'smileys', skin: false },
    { e: '😄', name: 'grinning face with smiling eyes', shortcode: ':smile:', cat: 'smileys', skin: false },
    { e: '😁', name: 'beaming face with smiling eyes', shortcode: ':grin:', cat: 'smileys', skin: false },
    { e: '😂', name: 'face with tears of joy', shortcode: ':joy:', cat: 'smileys', skin: false },
    { e: '🤣', name: 'rolling on the floor laughing', shortcode: ':rofl:', cat: 'smileys', skin: false },
    { e: '😊', name: 'smiling face with smiling eyes', shortcode: ':blush:', cat: 'smileys', skin: false },
    { e: '😇', name: 'smiling face with halo', shortcode: ':innocent:', cat: 'smileys', skin: false },
    { e: '🙂', name: 'slightly smiling face', shortcode: ':slight_smile:', cat: 'smileys', skin: false },
    { e: '🙃', name: 'upside down face', shortcode: ':upside_down:', cat: 'smileys', skin: false },
    { e: '😉', name: 'winking face', shortcode: ':wink:', cat: 'smileys', skin: false },
    { e: '😌', name: 'relieved face', shortcode: ':relieved:', cat: 'smileys', skin: false },
    { e: '😍', name: 'smiling face with heart eyes', shortcode: ':heart_eyes:', cat: 'smileys', skin: false },
    { e: '🥰', name: 'smiling face with hearts', shortcode: ':smiling_face_with_hearts:', cat: 'smileys', skin: false },
    { e: '😘', name: 'face blowing a kiss', shortcode: ':kissing_heart:', cat: 'smileys', skin: false },
    { e: '😗', name: 'kissing face', shortcode: ':kissing:', cat: 'smileys', skin: false },
    { e: '😙', name: 'kissing face with smiling eyes', shortcode: ':kissing_smiling_eyes:', cat: 'smileys', skin: false },
    { e: '😚', name: 'kissing face with closed eyes', shortcode: ':kissing_closed_eyes:', cat: 'smileys', skin: false },
    { e: '😋', name: 'face savoring food', shortcode: ':yum:', cat: 'smileys', skin: false },
    { e: '😛', name: 'face with tongue', shortcode: ':stuck_out_tongue:', cat: 'smileys', skin: false },
    { e: '😜', name: 'winking face with tongue', shortcode: ':stuck_out_tongue_winking_eye:', cat: 'smileys', skin: false },
    { e: '🤪', name: 'zany face', shortcode: ':zany_face:', cat: 'smileys', skin: false },
    { e: '😝', name: 'squinting face with tongue', shortcode: ':stuck_out_tongue_closed_eyes:', cat: 'smileys', skin: false },
    { e: '🤑', name: 'money mouth face', shortcode: ':money_mouth:', cat: 'smileys', skin: false },
    { e: '🤗', name: 'hugging face', shortcode: ':hugs:', cat: 'smileys', skin: false },
    { e: '🤔', name: 'thinking face', shortcode: ':thinking:', cat: 'smileys', skin: false },
    { e: '🤐', name: 'zipper mouth face', shortcode: ':zipper_mouth:', cat: 'smileys', skin: false },
    { e: '🤨', name: 'face with raised eyebrow', shortcode: ':raised_eyebrow:', cat: 'smileys', skin: false },
    { e: '😐', name: 'neutral face', shortcode: ':neutral_face:', cat: 'smileys', skin: false },
    { e: '😑', name: 'expressionless face', shortcode: ':expressionless:', cat: 'smileys', skin: false },
    { e: '😶', name: 'face without mouth', shortcode: ':no_mouth:', cat: 'smileys', skin: false },
    { e: '😏', name: 'smirking face', shortcode: ':smirk:', cat: 'smileys', skin: false },
    { e: '😒', name: 'unamused face', shortcode: ':unamused:', cat: 'smileys', skin: false },
    { e: '🙄', name: 'face with rolling eyes', shortcode: ':roll_eyes:', cat: 'smileys', skin: false },
    { e: '😬', name: 'grimacing face', shortcode: ':grimacing:', cat: 'smileys', skin: false },
    { e: '🤥', name: 'lying face', shortcode: ':lying_face:', cat: 'smileys', skin: false },
    { e: '😌', name: 'relieved face', shortcode: ':relieved:', cat: 'smileys', skin: false },
    { e: '😔', name: 'pensive face', shortcode: ':pensive:', cat: 'smileys', skin: false },
    { e: '😪', name: 'sleepy face', shortcode: ':sleepy:', cat: 'smileys', skin: false },
    { e: '🤤', name: 'drooling face', shortcode: ':drooling_face:', cat: 'smileys', skin: false },
    { e: '😴', name: 'sleeping face', shortcode: ':sleeping:', cat: 'smileys', skin: false },
    { e: '😷', name: 'face with medical mask', shortcode: ':mask:', cat: 'smileys', skin: false },
    { e: '🤒', name: 'face with thermometer', shortcode: ':thermometer_face:', cat: 'smileys', skin: false },
    { e: '🤕', name: 'face with head bandage', shortcode: ':head_bandage:', cat: 'smileys', skin: false },
    { e: '🤢', name: 'nauseated face', shortcode: ':nauseated:', cat: 'smileys', skin: false },
    { e: '🤮', name: 'face vomiting', shortcode: ':vomiting:', cat: 'smileys', skin: false },
    { e: '🥵', name: 'hot face', shortcode: ':hot_face:', cat: 'smileys', skin: false },
    { e: '🥶', name: 'cold face', shortcode: ':cold_face:', cat: 'smileys', skin: false },
    { e: '🥴', name: 'woozy face', shortcode: ':woozy_face:', cat: 'smileys', skin: false },
    { e: '😵', name: 'face with crossed-out eyes', shortcode: ':dizzy_face:', cat: 'smileys', skin: false },
    { e: '🤯', name: 'exploding head', shortcode: ':exploding_head:', cat: 'smileys', skin: false },
    { e: '😎', name: 'smiling face with sunglasses', shortcode: ':sunglasses:', cat: 'smileys', skin: false },
    { e: '🥳', name: 'partying face', shortcode: ':partying:', cat: 'smileys', skin: false },
    { e: '🤩', name: 'star struck', shortcode: ':star_struck:', cat: 'smileys', skin: false },
    { e: '😕', name: 'confused face', shortcode: ':confused:', cat: 'smileys', skin: false },
    { e: '😟', name: 'worried face', shortcode: ':worried:', cat: 'smileys', skin: false },
    { e: '🙁', name: 'slightly frowning face', shortcode: ':slight_frown:', cat: 'smileys', skin: false },
    { e: '😮', name: 'face with open mouth', shortcode: ':open_mouth:', cat: 'smileys', skin: false },
    { e: '😯', name: 'hushed face', shortcode: ':hushed:', cat: 'smileys', skin: false },
    { e: '😲', name: 'astonished face', shortcode: ':astonished:', cat: 'smileys', skin: false },
    { e: '😳', name: 'flushed face', shortcode: ':flushed:', cat: 'smileys', skin: false },
    { e: '🥺', name: 'pleading face', shortcode: ':pleading:', cat: 'smileys', skin: false },
    { e: '😦', name: 'frowning face with open mouth', shortcode: ':frowning:', cat: 'smileys', skin: false },
    { e: '😧', name: 'anguished face', shortcode: ':anguished:', cat: 'smileys', skin: false },
    { e: '😨', name: 'fearful face', shortcode: ':fearful:', cat: 'smileys', skin: false },
    { e: '😰', name: 'anxious face with sweat', shortcode: ':cold_sweat:', cat: 'smileys', skin: false },
    { e: '😥', name: 'sad but relieved face', shortcode: ':disappointed_relieved:', cat: 'smileys', skin: false },
    { e: '😢', name: 'crying face', shortcode: ':cry:', cat: 'smileys', skin: false },
    { e: '😭', name: 'loudly crying face', shortcode: ':sob:', cat: 'smileys', skin: false },
    { e: '😱', name: 'face screaming in fear', shortcode: ':scream:', cat: 'smileys', skin: false },
    { e: '😖', name: 'confounded face', shortcode: ':confounded:', cat: 'smileys', skin: false },
    { e: '😣', name: 'persevering face', shortcode: ':persevere:', cat: 'smileys', skin: false },
    { e: '😞', name: 'disappointed face', shortcode: ':disappointed:', cat: 'smileys', skin: false },
    { e: '😓', name: 'downcast face with sweat', shortcode: ':sweat:', cat: 'smileys', skin: false },
    { e: '😩', name: 'weary face', shortcode: ':weary:', cat: 'smileys', skin: false },
    { e: '😫', name: 'tired face', shortcode: ':tired_face:', cat: 'smileys', skin: false },
    { e: '🥱', name: 'yawning face', shortcode: ':yawning:', cat: 'smileys', skin: false },
    { e: '😤', name: 'face with steam from nose', shortcode: ':triumph:', cat: 'smileys', skin: false },
    { e: '😡', name: 'pouting face', shortcode: ':rage:', cat: 'smileys', skin: false },
    { e: '😠', name: 'angry face', shortcode: ':angry:', cat: 'smileys', skin: false },
    { e: '🤬', name: 'face with symbols on mouth', shortcode: ':cursing:', cat: 'smileys', skin: false },
    { e: '💀', name: 'skull', shortcode: ':skull:', cat: 'smileys', skin: false },
    { e: '☠️', name: 'skull and crossbones', shortcode: ':skull_crossbones:', cat: 'smileys', skin: false },
    { e: '💩', name: 'pile of poo', shortcode: ':poop:', cat: 'smileys', skin: false },
    { e: '🤡', name: 'clown face', shortcode: ':clown:', cat: 'smileys', skin: false },
    { e: '👻', name: 'ghost', shortcode: ':ghost:', cat: 'smileys', skin: false },
    { e: '👽', name: 'alien', shortcode: ':alien:', cat: 'smileys', skin: false },
    { e: '🤖', name: 'robot', shortcode: ':robot:', cat: 'smileys', skin: false },
    { e: '😺', name: 'grinning cat', shortcode: ':smiley_cat:', cat: 'smileys', skin: false },
    { e: '😸', name: 'grinning cat with smiling eyes', shortcode: ':smile_cat:', cat: 'smileys', skin: false },
    { e: '😹', name: 'cat with tears of joy', shortcode: ':joy_cat:', cat: 'smileys', skin: false },
    { e: '😻', name: 'smiling cat with heart eyes', shortcode: ':heart_eyes_cat:', cat: 'smileys', skin: false },
    { e: '🙈', name: 'see no evil monkey', shortcode: ':see_no_evil:', cat: 'smileys', skin: false },
    { e: '🙉', name: 'hear no evil monkey', shortcode: ':hear_no_evil:', cat: 'smileys', skin: false },
    { e: '🙊', name: 'speak no evil monkey', shortcode: ':speak_no_evil:', cat: 'smileys', skin: false },
    // Hands & Gestures (with skin tones)
    { e: '👍', name: 'thumbs up', shortcode: ':thumbsup:', cat: 'smileys', skin: true },
    { e: '👎', name: 'thumbs down', shortcode: ':thumbsdown:', cat: 'smileys', skin: true },
    { e: '👏', name: 'clapping hands', shortcode: ':clap:', cat: 'smileys', skin: true },
    { e: '🙌', name: 'raising hands', shortcode: ':raised_hands:', cat: 'smileys', skin: true },
    { e: '🤝', name: 'handshake', shortcode: ':handshake:', cat: 'smileys', skin: false },
    { e: '🙏', name: 'folded hands', shortcode: ':pray:', cat: 'smileys', skin: true },
    { e: '✌️', name: 'victory hand', shortcode: ':v:', cat: 'smileys', skin: true },
    { e: '🤞', name: 'crossed fingers', shortcode: ':crossed_fingers:', cat: 'smileys', skin: true },
    { e: '🤟', name: 'love you gesture', shortcode: ':love_you_gesture:', cat: 'smileys', skin: true },
    { e: '🤘', name: 'sign of the horns', shortcode: ':metal:', cat: 'smileys', skin: true },
    { e: '👌', name: 'ok hand', shortcode: ':ok_hand:', cat: 'smileys', skin: true },
    { e: '🤏', name: 'pinching hand', shortcode: ':pinching_hand:', cat: 'smileys', skin: true },
    { e: '👋', name: 'waving hand', shortcode: ':wave:', cat: 'smileys', skin: true },
    { e: '🤚', name: 'raised back of hand', shortcode: ':raised_back_of_hand:', cat: 'smileys', skin: true },
    { e: '✋', name: 'raised hand', shortcode: ':raised_hand:', cat: 'smileys', skin: true },
    { e: '🖐️', name: 'hand with fingers splayed', shortcode: ':hand_splayed:', cat: 'smileys', skin: true },
    { e: '🖖', name: 'vulcan salute', shortcode: ':vulcan:', cat: 'smileys', skin: true },
    { e: '👈', name: 'backhand index pointing left', shortcode: ':point_left:', cat: 'smileys', skin: true },
    { e: '👉', name: 'backhand index pointing right', shortcode: ':point_right:', cat: 'smileys', skin: true },
    { e: '👆', name: 'backhand index pointing up', shortcode: ':point_up_2:', cat: 'smileys', skin: true },
    { e: '👇', name: 'backhand index pointing down', shortcode: ':point_down:', cat: 'smileys', skin: true },
    { e: '☝️', name: 'index pointing up', shortcode: ':point_up:', cat: 'smileys', skin: true },
    { e: '✊', name: 'raised fist', shortcode: ':fist:', cat: 'smileys', skin: true },
    { e: '👊', name: 'oncoming fist', shortcode: ':punch:', cat: 'smileys', skin: true },
    { e: '🤛', name: 'left facing fist', shortcode: ':left_fist:', cat: 'smileys', skin: true },
    { e: '🤜', name: 'right facing fist', shortcode: ':right_fist:', cat: 'smileys', skin: true },
    { e: '💪', name: 'flexed biceps', shortcode: ':muscle:', cat: 'smileys', skin: true },
    // Hearts & Symbols in Smileys
    { e: '❤️', name: 'red heart', shortcode: ':heart:', cat: 'smileys', skin: false },
    { e: '🧡', name: 'orange heart', shortcode: ':orange_heart:', cat: 'smileys', skin: false },
    { e: '💛', name: 'yellow heart', shortcode: ':yellow_heart:', cat: 'smileys', skin: false },
    { e: '💚', name: 'green heart', shortcode: ':green_heart:', cat: 'smileys', skin: false },
    { e: '💙', name: 'blue heart', shortcode: ':blue_heart:', cat: 'smileys', skin: false },
    { e: '💜', name: 'purple heart', shortcode: ':purple_heart:', cat: 'smileys', skin: false },
    { e: '🖤', name: 'black heart', shortcode: ':black_heart:', cat: 'smileys', skin: false },
    { e: '🤍', name: 'white heart', shortcode: ':white_heart:', cat: 'smileys', skin: false },
    { e: '🤎', name: 'brown heart', shortcode: ':brown_heart:', cat: 'smileys', skin: false },
    { e: '💔', name: 'broken heart', shortcode: ':broken_heart:', cat: 'smileys', skin: false },
    { e: '❣️', name: 'heart exclamation', shortcode: ':heart_exclamation:', cat: 'smileys', skin: false },
    { e: '💕', name: 'two hearts', shortcode: ':two_hearts:', cat: 'smileys', skin: false },
    { e: '💞', name: 'revolving hearts', shortcode: ':revolving_hearts:', cat: 'smileys', skin: false },
    { e: '💓', name: 'beating heart', shortcode: ':heartbeat:', cat: 'smileys', skin: false },
    { e: '💗', name: 'growing heart', shortcode: ':heartpulse:', cat: 'smileys', skin: false },
    { e: '💖', name: 'sparkling heart', shortcode: ':sparkling_heart:', cat: 'smileys', skin: false },
    { e: '💘', name: 'heart with arrow', shortcode: ':cupid:', cat: 'smileys', skin: false },
    { e: '💝', name: 'heart with ribbon', shortcode: ':gift_heart:', cat: 'smileys', skin: false },
    { e: '🔥', name: 'fire', shortcode: ':fire:', cat: 'smileys', skin: false },
    { e: '✨', name: 'sparkles', shortcode: ':sparkles:', cat: 'smileys', skin: false },
    { e: '🌟', name: 'glowing star', shortcode: ':star2:', cat: 'smileys', skin: false },
    { e: '💯', name: 'hundred points', shortcode: ':100:', cat: 'smileys', skin: false },
    { e: '💥', name: 'collision', shortcode: ':boom:', cat: 'smileys', skin: false },
    { e: '👀', name: 'eyes', shortcode: ':eyes:', cat: 'smileys', skin: false },
    { e: '👑', name: 'crown', shortcode: ':crown:', cat: 'smileys', skin: false },
    { e: '🎉', name: 'party popper', shortcode: ':tada:', cat: 'smileys', skin: false },
    { e: '🎈', name: 'balloon', shortcode: ':balloon:', cat: 'smileys', skin: false },
    { e: '🎁', name: 'wrapped gift', shortcode: ':gift:', cat: 'smileys', skin: false },
    { e: '🎂', name: 'birthday cake', shortcode: ':birthday:', cat: 'smileys', skin: false },
    // --- Animals & Nature ---
    { e: '🐶', name: 'dog face', shortcode: ':dog:', cat: 'animals', skin: false },
    { e: '🐱', name: 'cat face', shortcode: ':cat:', cat: 'animals', skin: false },
    { e: '🐭', name: 'mouse face', shortcode: ':mouse:', cat: 'animals', skin: false },
    { e: '🐹', name: 'hamster', shortcode: ':hamster:', cat: 'animals', skin: false },
    { e: '🐰', name: 'rabbit face', shortcode: ':rabbit:', cat: 'animals', skin: false },
    { e: '🦊', name: 'fox', shortcode: ':fox:', cat: 'animals', skin: false },
    { e: '🐻', name: 'bear', shortcode: ':bear:', cat: 'animals', skin: false },
    { e: '🐼', name: 'panda', shortcode: ':panda:', cat: 'animals', skin: false },
    { e: '🐨', name: 'koala', shortcode: ':koala:', cat: 'animals', skin: false },
    { e: '🐯', name: 'tiger face', shortcode: ':tiger:', cat: 'animals', skin: false },
    { e: '🦁', name: 'lion', shortcode: ':lion:', cat: 'animals', skin: false },
    { e: '🐮', name: 'cow face', shortcode: ':cow:', cat: 'animals', skin: false },
    { e: '🐷', name: 'pig face', shortcode: ':pig:', cat: 'animals', skin: false },
    { e: '🐸', name: 'frog', shortcode: ':frog:', cat: 'animals', skin: false },
    { e: '🐵', name: 'monkey face', shortcode: ':monkey_face:', cat: 'animals', skin: false },
    { e: '🐝', name: 'honeybee', shortcode: ':bee:', cat: 'animals', skin: false },
    { e: '🐛', name: 'bug', shortcode: ':bug:', cat: 'animals', skin: false },
    { e: '🦋', name: 'butterfly', shortcode: ':butterfly:', cat: 'animals', skin: false },
    { e: '🐞', name: 'lady beetle', shortcode: ':ladybug:', cat: 'animals', skin: false },
    { e: '🐜', name: 'ant', shortcode: ':ant:', cat: 'animals', skin: false },
    { e: '🐢', name: 'turtle', shortcode: ':turtle:', cat: 'animals', skin: false },
    { e: '🐍', name: 'snake', shortcode: ':snake:', cat: 'animals', skin: false },
    { e: '🐙', name: 'octopus', shortcode: ':octopus:', cat: 'animals', skin: false },
    { e: '🦑', name: 'squid', shortcode: ':squid:', cat: 'animals', skin: false },
    { e: '🦞', name: 'lobster', shortcode: ':lobster:', cat: 'animals', skin: false },
    { e: '🦀', name: 'crab', shortcode: ':crab:', cat: 'animals', skin: false },
    { e: '🐡', name: 'blowfish', shortcode: ':blowfish:', cat: 'animals', skin: false },
    { e: '🐠', name: 'tropical fish', shortcode: ':tropical_fish:', cat: 'animals', skin: false },
    { e: '🐟', name: 'fish', shortcode: ':fish:', cat: 'animals', skin: false },
    { e: '🐬', name: 'dolphin', shortcode: ':dolphin:', cat: 'animals', skin: false },
    { e: '🐳', name: 'spouting whale', shortcode: ':whale:', cat: 'animals', skin: false },
    { e: '🐋', name: 'whale', shortcode: ':whale2:', cat: 'animals', skin: false },
    { e: '🦈', name: 'shark', shortcode: ':shark:', cat: 'animals', skin: false },
    { e: '🐊', name: 'crocodile', shortcode: ':crocodile:', cat: 'animals', skin: false },
    { e: '🐅', name: 'tiger', shortcode: ':tiger2:', cat: 'animals', skin: false },
    { e: '🐆', name: 'leopard', shortcode: ':leopard:', cat: 'animals', skin: false },
    { e: '🦓', name: 'zebra', shortcode: ':zebra:', cat: 'animals', skin: false },
    { e: '🦍', name: 'gorilla', shortcode: ':gorilla:', cat: 'animals', skin: false },
    { e: '🐘', name: 'elephant', shortcode: ':elephant:', cat: 'animals', skin: false },
    { e: '🦏', name: 'rhinoceros', shortcode: ':rhino:', cat: 'animals', skin: false },
    { e: '🐪', name: 'camel', shortcode: ':camel:', cat: 'animals', skin: false },
    { e: '🦒', name: 'giraffe', shortcode: ':giraffe:', cat: 'animals', skin: false },
    { e: '🐄', name: 'cow', shortcode: ':cow2:', cat: 'animals', skin: false },
    { e: '🐎', name: 'horse', shortcode: ':horse:', cat: 'animals', skin: false },
    { e: '🦌', name: 'deer', shortcode: ':deer:', cat: 'animals', skin: false },
    { e: '🐕', name: 'dog', shortcode: ':dog2:', cat: 'animals', skin: false },
    { e: '🐈', name: 'cat', shortcode: ':cat2:', cat: 'animals', skin: false },
    { e: '🐇', name: 'rabbit', shortcode: ':rabbit2:', cat: 'animals', skin: false },
    { e: '🐾', name: 'paw prints', shortcode: ':paw_prints:', cat: 'animals', skin: false },
    { e: '🐉', name: 'dragon', shortcode: ':dragon:', cat: 'animals', skin: false },
    { e: '🌵', name: 'cactus', shortcode: ':cactus:', cat: 'animals', skin: false },
    { e: '🎄', name: 'christmas tree', shortcode: ':christmas_tree:', cat: 'animals', skin: false },
    { e: '🌲', name: 'evergreen tree', shortcode: ':evergreen_tree:', cat: 'animals', skin: false },
    { e: '🌳', name: 'deciduous tree', shortcode: ':deciduous_tree:', cat: 'animals', skin: false },
    { e: '🌴', name: 'palm tree', shortcode: ':palm_tree:', cat: 'animals', skin: false },
    { e: '🌱', name: 'seedling', shortcode: ':seedling:', cat: 'animals', skin: false },
    { e: '🌿', name: 'herb', shortcode: ':herb:', cat: 'animals', skin: false },
    { e: '🍀', name: 'four leaf clover', shortcode: ':four_leaf_clover:', cat: 'animals', skin: false },
    { e: '🌹', name: 'rose', shortcode: ':rose:', cat: 'animals', skin: false },
    { e: '🌸', name: 'cherry blossom', shortcode: ':cherry_blossom:', cat: 'animals', skin: false },
    { e: '🌻', name: 'sunflower', shortcode: ':sunflower:', cat: 'animals', skin: false },
    { e: '🌈', name: 'rainbow', shortcode: ':rainbow:', cat: 'animals', skin: false },
    { e: '☀️', name: 'sun', shortcode: ':sunny:', cat: 'animals', skin: false },
    { e: '🌙', name: 'crescent moon', shortcode: ':crescent_moon:', cat: 'animals', skin: false },
    { e: '⭐', name: 'star', shortcode: ':star:', cat: 'animals', skin: false },
    { e: '⚡', name: 'high voltage', shortcode: ':zap:', cat: 'animals', skin: false },
    { e: '🌊', name: 'water wave', shortcode: ':ocean:', cat: 'animals', skin: false },
    // --- Food & Drink ---
    { e: '🍏', name: 'green apple', shortcode: ':green_apple:', cat: 'food', skin: false },
    { e: '🍎', name: 'red apple', shortcode: ':apple:', cat: 'food', skin: false },
    { e: '🍌', name: 'banana', shortcode: ':banana:', cat: 'food', skin: false },
    { e: '🍉', name: 'watermelon', shortcode: ':watermelon:', cat: 'food', skin: false },
    { e: '🍇', name: 'grapes', shortcode: ':grapes:', cat: 'food', skin: false },
    { e: '🍓', name: 'strawberry', shortcode: ':strawberry:', cat: 'food', skin: false },
    { e: '🍒', name: 'cherries', shortcode: ':cherries:', cat: 'food', skin: false },
    { e: '🍍', name: 'pineapple', shortcode: ':pineapple:', cat: 'food', skin: false },
    { e: '🥥', name: 'coconut', shortcode: ':coconut:', cat: 'food', skin: false },
    { e: '🥝', name: 'kiwi fruit', shortcode: ':kiwi:', cat: 'food', skin: false },
    { e: '🍅', name: 'tomato', shortcode: ':tomato:', cat: 'food', skin: false },
    { e: '🍆', name: 'eggplant', shortcode: ':eggplant:', cat: 'food', skin: false },
    { e: '🥑', name: 'avocado', shortcode: ':avocado:', cat: 'food', skin: false },
    { e: '🥦', name: 'broccoli', shortcode: ':broccoli:', cat: 'food', skin: false },
    { e: '🌶️', name: 'hot pepper', shortcode: ':hot_pepper:', cat: 'food', skin: false },
    { e: '🌽', name: 'ear of corn', shortcode: ':corn:', cat: 'food', skin: false },
    { e: '🥕', name: 'carrot', shortcode: ':carrot:', cat: 'food', skin: false },
    { e: '🥐', name: 'croissant', shortcode: ':croissant:', cat: 'food', skin: false },
    { e: '🍞', name: 'bread', shortcode: ':bread:', cat: 'food', skin: false },
    { e: '🧀', name: 'cheese wedge', shortcode: ':cheese:', cat: 'food', skin: false },
    { e: '🍳', name: 'cooking', shortcode: ':cooking:', cat: 'food', skin: false },
    { e: '🥩', name: 'cut of meat', shortcode: ':cut_of_meat:', cat: 'food', skin: false },
    { e: '🍗', name: 'poultry leg', shortcode: ':poultry_leg:', cat: 'food', skin: false },
    { e: '🍖', name: 'meat on bone', shortcode: ':meat_on_bone:', cat: 'food', skin: false },
    { e: '🌭', name: 'hot dog', shortcode: ':hotdog:', cat: 'food', skin: false },
    { e: '🍔', name: 'hamburger', shortcode: ':hamburger:', cat: 'food', skin: false },
    { e: '🍟', name: 'french fries', shortcode: ':fries:', cat: 'food', skin: false },
    { e: '🍕', name: 'pizza', shortcode: ':pizza:', cat: 'food', skin: false },
    { e: '🥪', name: 'sandwich', shortcode: ':sandwich:', cat: 'food', skin: false },
    { e: '🌮', name: 'taco', shortcode: ':taco:', cat: 'food', skin: false },
    { e: '🌯', name: 'burrito', shortcode: ':burrito:', cat: 'food', skin: false },
    { e: '🥗', name: 'green salad', shortcode: ':salad:', cat: 'food', skin: false },
    { e: '🍲', name: 'pot of food', shortcode: ':stew:', cat: 'food', skin: false },
    { e: '🍦', name: 'soft ice cream', shortcode: ':icecream:', cat: 'food', skin: false },
    { e: '🍩', name: 'doughnut', shortcode: ':doughnut:', cat: 'food', skin: false },
    { e: '🍪', name: 'cookie', shortcode: ':cookie:', cat: 'food', skin: false },
    { e: '🎂', name: 'birthday cake', shortcode: ':birthday:', cat: 'food', skin: false },
    { e: '🍰', name: 'shortcake', shortcode: ':cake:', cat: 'food', skin: false },
    { e: '🧁', name: 'cupcake', shortcode: ':cupcake:', cat: 'food', skin: false },
    { e: '🍫', name: 'chocolate bar', shortcode: ':chocolate_bar:', cat: 'food', skin: false },
    { e: '🍬', name: 'candy', shortcode: ':candy:', cat: 'food', skin: false },
    { e: '🍭', name: 'lollipop', shortcode: ':lollipop:', cat: 'food', skin: false },
    { e: '🍯', name: 'honey pot', shortcode: ':honey_pot:', cat: 'food', skin: false },
    { e: '☕', name: 'hot beverage', shortcode: ':coffee:', cat: 'food', skin: false },
    { e: '🍵', name: 'teacup', shortcode: ':tea:', cat: 'food', skin: false },
    { e: '🍾', name: 'bottle with popping cork', shortcode: ':champagne:', cat: 'food', skin: false },
    { e: '🍷', name: 'wine glass', shortcode: ':wine_glass:', cat: 'food', skin: false },
    { e: '🍸', name: 'cocktail glass', shortcode: ':cocktail:', cat: 'food', skin: false },
    { e: '🍹', name: 'tropical drink', shortcode: ':tropical_drink:', cat: 'food', skin: false },
    { e: '🍺', name: 'beer mug', shortcode: ':beer:', cat: 'food', skin: false },
    { e: '🍻', name: 'clinking beer mugs', shortcode: ':beers:', cat: 'food', skin: false },
    { e: '🥤', name: 'cup with straw', shortcode: ':cup_with_straw:', cat: 'food', skin: false },
    // --- Activities & Travel ---
    { e: '⚽', name: 'soccer ball', shortcode: ':soccer:', cat: 'activities', skin: false },
    { e: '🏀', name: 'basketball', shortcode: ':basketball:', cat: 'activities', skin: false },
    { e: '🏈', name: 'american football', shortcode: ':football:', cat: 'activities', skin: false },
    { e: '⚾', name: 'baseball', shortcode: ':baseball:', cat: 'activities', skin: false },
    { e: '🎾', name: 'tennis', shortcode: ':tennis:', cat: 'activities', skin: false },
    { e: '🏐', name: 'volleyball', shortcode: ':volleyball:', cat: 'activities', skin: false },
    { e: '🎱', name: 'pool 8 ball', shortcode: ':8ball:', cat: 'activities', skin: false },
    { e: '🏓', name: 'ping pong', shortcode: ':ping_pong:', cat: 'activities', skin: false },
    { e: '🏸', name: 'badminton', shortcode: ':badminton:', cat: 'activities', skin: false },
    { e: '🥊', name: 'boxing glove', shortcode: ':boxing_glove:', cat: 'activities', skin: false },
    { e: '🥋', name: 'martial arts uniform', shortcode: ':martial_arts_uniform:', cat: 'activities', skin: false },
    { e: '🎿', name: 'skis', shortcode: ':ski:', cat: 'activities', skin: false },
    { e: '🎭', name: 'performing arts', shortcode: ':performing_arts:', cat: 'activities', skin: false },
    { e: '🎨', name: 'artist palette', shortcode: ':art:', cat: 'activities', skin: false },
    { e: '🎬', name: 'clapper board', shortcode: ':clapper:', cat: 'activities', skin: false },
    { e: '🎤', name: 'microphone', shortcode: ':microphone:', cat: 'activities', skin: false },
    { e: '🎧', name: 'headphone', shortcode: ':headphones:', cat: 'activities', skin: false },
    { e: '🎮', name: 'video game', shortcode: ':video_game:', cat: 'activities', skin: false },
    { e: '🕹️', name: 'joystick', shortcode: ':joystick:', cat: 'activities', skin: false },
    { e: '🏆', name: 'trophy', shortcode: ':trophy:', cat: 'activities', skin: false },
    { e: '🥇', name: 'gold medal', shortcode: ':first_place:', cat: 'activities', skin: false },
    { e: '🥈', name: 'silver medal', shortcode: ':second_place:', cat: 'activities', skin: false },
    { e: '🥉', name: 'bronze medal', shortcode: ':third_place:', cat: 'activities', skin: false },
    { e: '🚗', name: 'automobile', shortcode: ':car:', cat: 'activities', skin: false },
    { e: '🚕', name: 'taxi', shortcode: ':taxi:', cat: 'activities', skin: false },
    { e: '🚙', name: 'sport utility vehicle', shortcode: ':blue_car:', cat: 'activities', skin: false },
    { e: '🚌', name: 'bus', shortcode: ':bus:', cat: 'activities', skin: false },
    { e: '🏎️', name: 'racing car', shortcode: ':racing_car:', cat: 'activities', skin: false },
    { e: '🚓', name: 'police car', shortcode: ':police_car:', cat: 'activities', skin: false },
    { e: '🚑', name: 'ambulance', shortcode: ':ambulance:', cat: 'activities', skin: false },
    { e: '🚒', name: 'fire engine', shortcode: ':fire_engine:', cat: 'activities', skin: false },
    { e: '🚲', name: 'bicycle', shortcode: ':bike:', cat: 'activities', skin: false },
    { e: '🏍️', name: 'motorcycle', shortcode: ':motorcycle:', cat: 'activities', skin: false },
    { e: '🚄', name: 'high speed train', shortcode: ':bullettrain_side:', cat: 'activities', skin: false },
    { e: '✈️', name: 'airplane', shortcode: ':airplane:', cat: 'activities', skin: false },
    { e: '🚀', name: 'rocket', shortcode: ':rocket:', cat: 'activities', skin: false },
    { e: '🚁', name: 'helicopter', shortcode: ':helicopter:', cat: 'activities', skin: false },
    { e: '⛵', name: 'sailboat', shortcode: ':sailboat:', cat: 'activities', skin: false },
    { e: '🚢', name: 'ship', shortcode: ':ship:', cat: 'activities', skin: false },
    { e: '🌋', name: 'volcano', shortcode: ':volcano:', cat: 'activities', skin: false },
    { e: '🏖️', name: 'beach with umbrella', shortcode: ':beach:', cat: 'activities', skin: false },
    { e: '🏝️', name: 'desert island', shortcode: ':island:', cat: 'activities', skin: false },
    { e: '🗽', name: 'statue of liberty', shortcode: ':statue_of_liberty:', cat: 'activities', skin: false },
    { e: '🗼', name: 'tokyo tower', shortcode: ':tokyo_tower:', cat: 'activities', skin: false },
    // --- Objects & Symbols ---
    { e: '💡', name: 'light bulb', shortcode: ':bulb:', cat: 'symbols', skin: false },
    { e: '⌚', name: 'watch', shortcode: ':watch:', cat: 'symbols', skin: false },
    { e: '📱', name: 'mobile phone', shortcode: ':iphone:', cat: 'symbols', skin: false },
    { e: '💻', name: 'laptop', shortcode: ':computer:', cat: 'symbols', skin: false },
    { e: '⌨️', name: 'keyboard', shortcode: ':keyboard:', cat: 'symbols', skin: false },
    { e: '🖥️', name: 'desktop computer', shortcode: ':desktop:', cat: 'symbols', skin: false },
    { e: '📷', name: 'camera', shortcode: ':camera:', cat: 'symbols', skin: false },
    { e: '📹', name: 'video camera', shortcode: ':video_camera:', cat: 'symbols', skin: false },
    { e: '🎥', name: 'movie camera', shortcode: ':movie_camera:', cat: 'symbols', skin: false },
    { e: '📞', name: 'telephone receiver', shortcode: ':telephone_receiver:', cat: 'symbols', skin: false },
    { e: '📺', name: 'television', shortcode: ':tv:', cat: 'symbols', skin: false },
    { e: '📻', name: 'radio', shortcode: ':radio:', cat: 'symbols', skin: false },
    { e: '⏰', name: 'alarm clock', shortcode: ':alarm_clock:', cat: 'symbols', skin: false },
    { e: '🔑', name: 'key', shortcode: ':key:', cat: 'symbols', skin: false },
    { e: '🔨', name: 'hammer', shortcode: ':hammer:', cat: 'symbols', skin: false },
    { e: '🛠️', name: 'hammer and wrench', shortcode: ':tools:', cat: 'symbols', skin: false },
    { e: '🔧', name: 'wrench', shortcode: ':wrench:', cat: 'symbols', skin: false },
    { e: '🔩', name: 'nut and bolt', shortcode: ':nut_and_bolt:', cat: 'symbols', skin: false },
    { e: '⚙️', name: 'gear', shortcode: ':gear:', cat: 'symbols', skin: false },
    { e: '🔗', name: 'link', shortcode: ':link:', cat: 'symbols', skin: false },
    { e: '💉', name: 'syringe', shortcode: ':syringe:', cat: 'symbols', skin: false },
    { e: '💊', name: 'pill', shortcode: ':pill:', cat: 'symbols', skin: false },
    { e: '🔮', name: 'crystal ball', shortcode: ':crystal_ball:', cat: 'symbols', skin: false },
    { e: '✉️', name: 'envelope', shortcode: ':envelope:', cat: 'symbols', skin: false },
    { e: '📦', name: 'package', shortcode: ':package:', cat: 'symbols', skin: false },
    { e: '📜', name: 'scroll', shortcode: ':scroll:', cat: 'symbols', skin: false },
    { e: '📄', name: 'page facing up', shortcode: ':page_facing_up:', cat: 'symbols', skin: false },
    { e: '📚', name: 'books', shortcode: ':books:', cat: 'symbols', skin: false },
    { e: '📓', name: 'notebook', shortcode: ':notebook:', cat: 'symbols', skin: false },
    { e: '✏️', name: 'pencil', shortcode: ':pencil2:', cat: 'symbols', skin: false },
    { e: '✅', name: 'check mark button', shortcode: ':white_check_mark:', cat: 'symbols', skin: false },
    { e: '❌', name: 'cross mark', shortcode: ':x:', cat: 'symbols', skin: false },
    { e: '⚠️', name: 'warning', shortcode: ':warning:', cat: 'symbols', skin: false },
    { e: '🔔', name: 'bell', shortcode: ':bell:', cat: 'symbols', skin: false },
    { e: '🔇', name: 'muted speaker', shortcode: ':mute:', cat: 'symbols', skin: false },
    { e: '🔒', name: 'locked', shortcode: ':lock:', cat: 'symbols', skin: false },
    { e: '🔓', name: 'unlocked', shortcode: ':unlock:', cat: 'symbols', skin: false },
    { e: '🏳️', name: 'white flag', shortcode: ':white_flag:', cat: 'symbols', skin: false },
    { e: '🏴', name: 'black flag', shortcode: ':black_flag:', cat: 'symbols', skin: false },
    { e: '♻️', name: 'recycling symbol', shortcode: ':recycle:', cat: 'symbols', skin: false },
    { e: '💬', name: 'speech balloon', shortcode: ':speech_balloon:', cat: 'symbols', skin: false },
    { e: '💭', name: 'thought balloon', shortcode: ':thought_balloon:', cat: 'symbols', skin: false },
    { e: '🔴', name: 'red circle', shortcode: ':red_circle:', cat: 'symbols', skin: false },
    { e: '🟠', name: 'orange circle', shortcode: ':orange_circle:', cat: 'symbols', skin: false },
    { e: '🟡', name: 'yellow circle', shortcode: ':yellow_circle:', cat: 'symbols', skin: false },
    { e: '🟢', name: 'green circle', shortcode: ':green_circle:', cat: 'symbols', skin: false },
    { e: '🔵', name: 'blue circle', shortcode: ':blue_circle:', cat: 'symbols', skin: false },
    { e: '🟣', name: 'purple circle', shortcode: ':purple_circle:', cat: 'symbols', skin: false },
    { e: '⬛', name: 'black large square', shortcode: ':black_large_square:', cat: 'symbols', skin: false },
    { e: '⬜', name: 'white large square', shortcode: ':white_large_square:', cat: 'symbols', skin: false },
  ];

  // Skin tone Fitzpatrick modifiers
  const SKIN_TONES = [
    { mod: '', label: 'Default' },
    { mod: '\u{1F3FB}', label: 'Light' },
    { mod: '\u{1F3FC}', label: 'Medium-Light' },
    { mod: '\u{1F3FD}', label: 'Medium' },
    { mod: '\u{1F3FE}', label: 'Medium-Dark' },
    { mod: '\u{1F3FF}', label: 'Dark' },
  ];

  // --- Helper: Get Unicode string for an emoji ---
  function getEmojiUnicode(emoji) {
    const codePoints = Array.from(emoji)
      .map(cp => 'U+' + cp.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'))
      .filter(cp => cp !== 'U+FE0F'); // filter variation selectors for cleanliness
    return codePoints.join(' ');
  }

  // --- Helper: Get HTML entity for an emoji ---
  function getEmojiHtmlEntity(emoji) {
    return Array.from(emoji)
      .map(cp => '&#' + cp.codePointAt(0) + ';')
      .join('');
  }

  // --- Helper: Apply skin tone to an emoji ---
  function applySkintone(baseEmoji, toneMod) {
    if (!toneMod) return baseEmoji;
    // Remove any existing skin tone modifier, then add new one
    const cleaned = baseEmoji.replace(/[\u{1F3FB}-\u{1F3FF}]/gu, '');
    // Insert modifier after the first code point
    const chars = Array.from(cleaned);
    if (chars.length === 0) return baseEmoji;
    return chars[0] + toneMod + chars.slice(1).join('');
  }

  // --- DOM References ---
  const epGrid = document.getElementById('epGrid');
  const epEmptyState = document.getElementById('epEmptyState');
  const epSearchInput = document.getElementById('epSearchInput');
  const epSearchClear = document.getElementById('epSearchClear');
  const epCategoryBar = document.getElementById('epCategoryBar');
  const epDetailPanel = document.getElementById('epDetailPanel');
  const epDetailClose = document.getElementById('epDetailClose');
  const epDetailEmoji = document.getElementById('epDetailEmoji');
  const epDetailName = document.getElementById('epDetailName');
  const epDetailUnicode = document.getElementById('epDetailUnicode');
  const epDetailHtml = document.getElementById('epDetailHtml');
  const epDetailShortcode = document.getElementById('epDetailShortcode');
  const epSkinToneBar = document.getElementById('epSkinToneBar');
  const epSkinToneOptions = document.getElementById('epSkinToneOptions');
  const epSkinPopover = document.getElementById('epSkinPopover');
  const epCopiedToast = document.getElementById('epCopiedToast');

  if (!epGrid || !epSearchInput || !epCategoryBar) return; // Guard

  let epActiveCategory = 'smileys';
  let epSearchQuery = '';
  let epToastTimer = null;
  let epCurrentDetailEmoji = null; // Track currently shown detail emoji data
  let epLongPressTimer = null;

  // --- localStorage helpers ---
  function epGetRecent() {
    try { return JSON.parse(localStorage.getItem('ep_recent') || '[]'); } catch { return []; }
  }
  function epSetRecent(arr) {
    localStorage.setItem('ep_recent', JSON.stringify(arr.slice(0, 20)));
  }
  function epAddRecent(emoji) {
    let recent = epGetRecent().filter(e => e !== emoji);
    recent.unshift(emoji);
    epSetRecent(recent);
  }
  function epGetFavorites() {
    try { return JSON.parse(localStorage.getItem('ep_favorites') || '[]'); } catch { return []; }
  }
  function epSetFavorites(arr) {
    localStorage.setItem('ep_favorites', JSON.stringify(arr));
  }
  function epToggleFavorite(emoji) {
    let favs = epGetFavorites();
    if (favs.includes(emoji)) {
      favs = favs.filter(e => e !== emoji);
    } else {
      favs.push(emoji);
    }
    epSetFavorites(favs);
    return favs.includes(emoji);
  }

  // --- Copy to clipboard ---
  function epCopyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {
        epFallbackCopy(text);
      });
    } else {
      epFallbackCopy(text);
    }
  }

  function epFallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(ta);
  }

  // --- Show toast ---
  function epShowToast(msg) {
    if (!epCopiedToast) return;
    clearTimeout(epToastTimer);
    epCopiedToast.textContent = msg || '✅ Copied!';
    epCopiedToast.classList.add('show');
    epToastTimer = setTimeout(() => {
      epCopiedToast.classList.remove('show');
    }, 1800);
  }

  // --- Render emoji grid ---
  function epRenderGrid() {
    epGrid.innerHTML = '';
    epEmptyState.style.display = 'none';
    epSkinPopover.style.display = 'none';

    let emojis = [];
    const favorites = epGetFavorites();

    if (epSearchQuery) {
      // Search across all categories
      const q = epSearchQuery.toLowerCase();
      emojis = EP_EMOJI_DATA.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.shortcode.toLowerCase().includes(q) ||
        d.e === q
      );
    } else if (epActiveCategory === 'recent') {
      const recent = epGetRecent();
      emojis = recent.map(e => EP_EMOJI_DATA.find(d => d.e === e)).filter(Boolean);
    } else if (epActiveCategory === 'favorites') {
      emojis = favorites.map(e => EP_EMOJI_DATA.find(d => d.e === e)).filter(Boolean);
    } else {
      emojis = EP_EMOJI_DATA.filter(d => d.cat === epActiveCategory);
    }

    if (emojis.length === 0) {
      epEmptyState.style.display = 'block';
      if (epActiveCategory === 'recent') {
        epEmptyState.querySelector('.ep-empty-emoji').textContent = '🕐';
        epEmptyState.querySelector('p').textContent = 'No recently copied emojis yet. Click any emoji to copy it!';
      } else if (epActiveCategory === 'favorites') {
        epEmptyState.querySelector('.ep-empty-emoji').textContent = '⭐';
        epEmptyState.querySelector('p').textContent = 'No favorites yet. Right-click or long-press any emoji to favorite it!';
      } else {
        epEmptyState.querySelector('.ep-empty-emoji').textContent = '🔍';
        epEmptyState.querySelector('p').textContent = 'No emojis found. Try a different search term.';
      }
      return;
    }

    emojis.forEach(data => {
      const btn = document.createElement('button');
      btn.className = 'ep-grid-btn';
      btn.textContent = data.e;
      btn.title = data.name;

      // Show fav indicator
      if (favorites.includes(data.e)) {
        const star = document.createElement('span');
        star.className = 'ep-fav-indicator';
        star.textContent = '⭐';
        btn.appendChild(star);
      }

      // Click = copy emoji
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        epCopyToClipboard(data.e);
        epAddRecent(data.e);
        epShowToast(`✅ ${data.e} Copied!`);
        epShowDetail(data);
      });

      // Right-click = toggle favorite
      btn.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const isFav = epToggleFavorite(data.e);
        epShowToast(isFav ? `⭐ Added to favorites` : `Removed from favorites`);
        epRenderGrid();
      });

      // Long-press for skin tones (mobile) or skin tone popover
      if (data.skin) {
        let pressTimer = null;
        btn.addEventListener('pointerdown', (e) => {
          pressTimer = setTimeout(() => {
            e.preventDefault();
            epShowSkinPopover(data, btn);
          }, 500);
        });
        btn.addEventListener('pointerup', () => clearTimeout(pressTimer));
        btn.addEventListener('pointerleave', () => clearTimeout(pressTimer));
      }

      epGrid.appendChild(btn);
    });
  }

  // --- Show detail panel ---
  function epShowDetail(data) {
    epCurrentDetailEmoji = data;
    epDetailPanel.style.display = 'block';
    epDetailEmoji.textContent = data.e;
    epDetailName.textContent = data.name;
    epDetailUnicode.textContent = getEmojiUnicode(data.e);
    epDetailHtml.textContent = getEmojiHtmlEntity(data.e);
    epDetailShortcode.textContent = data.shortcode;

    // Skin tones
    if (data.skin) {
      epSkinToneBar.style.display = 'block';
      epSkinToneOptions.innerHTML = '';
      SKIN_TONES.forEach(tone => {
        const skinBtn = document.createElement('button');
        skinBtn.className = 'ep-skin-tone-btn';
        const toned = applySkintone(data.e, tone.mod);
        skinBtn.textContent = toned;
        skinBtn.title = tone.label;
        skinBtn.addEventListener('click', () => {
          epCopyToClipboard(toned);
          epAddRecent(data.e);
          epShowToast(`✅ ${toned} Copied!`);
          // Update detail display
          epDetailEmoji.textContent = toned;
          epDetailUnicode.textContent = getEmojiUnicode(toned);
          epDetailHtml.textContent = getEmojiHtmlEntity(toned);
          // Highlight active
          epSkinToneOptions.querySelectorAll('.ep-skin-tone-btn').forEach(b => b.classList.remove('active'));
          skinBtn.classList.add('active');
        });
        epSkinToneOptions.appendChild(skinBtn);
      });
    } else {
      epSkinToneBar.style.display = 'none';
    }

    // Smooth scroll to detail
    epDetailPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // --- Close detail panel ---
  if (epDetailClose) {
    epDetailClose.addEventListener('click', () => {
      epDetailPanel.style.display = 'none';
      epCurrentDetailEmoji = null;
    });
  }

  // --- Detail panel copy buttons ---
  document.querySelectorAll('.ep-detail-copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-copy-target');
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        epCopyToClipboard(targetEl.textContent);
        epShowToast('✅ Copied!');
      }
    });
  });

  // --- Skin tone popover in grid ---
  function epShowSkinPopover(data, anchorBtn) {
    epSkinPopover.innerHTML = '';
    epSkinPopover.style.display = 'flex';

    SKIN_TONES.forEach(tone => {
      const btn = document.createElement('button');
      btn.className = 'ep-skin-pop-btn';
      const toned = applySkintone(data.e, tone.mod);
      btn.textContent = toned;
      btn.title = tone.label;
      btn.addEventListener('click', () => {
        epCopyToClipboard(toned);
        epAddRecent(data.e);
        epShowToast(`✅ ${toned} Copied!`);
        epSkinPopover.style.display = 'none';
      });
      epSkinPopover.appendChild(btn);
    });

    // Position popover above the anchor button
    const rect = anchorBtn.getBoundingClientRect();
    const popW = 6 * 44 + 5 * 4 + 16; // approx width
    let left = rect.left + rect.width / 2 - popW / 2;
    if (left < 8) left = 8;
    if (left + popW > window.innerWidth - 8) left = window.innerWidth - popW - 8;
    epSkinPopover.style.left = left + 'px';
    epSkinPopover.style.top = (rect.top - 56) + 'px';
  }

  // Close popover on outside click
  document.addEventListener('click', (e) => {
    if (epSkinPopover.style.display !== 'none' && !epSkinPopover.contains(e.target)) {
      epSkinPopover.style.display = 'none';
    }
  });

  // --- Category tab switching ---
  epCategoryBar.addEventListener('click', (e) => {
    const tab = e.target.closest('.ep-cat-tab');
    if (!tab) return;
    epCategoryBar.querySelectorAll('.ep-cat-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    epActiveCategory = tab.getAttribute('data-category');
    epSearchQuery = '';
    epSearchInput.value = '';
    epSearchClear.style.display = 'none';
    epDetailPanel.style.display = 'none';
    epRenderGrid();
  });

  // --- Search input ---
  epSearchInput.addEventListener('input', () => {
    epSearchQuery = epSearchInput.value.trim();
    epSearchClear.style.display = epSearchQuery ? 'flex' : 'none';
    if (epSearchQuery) {
      // Deselect category tabs during search
      epCategoryBar.querySelectorAll('.ep-cat-tab').forEach(t => t.classList.remove('active'));
    }
    epRenderGrid();
  });

  epSearchClear.addEventListener('click', () => {
    epSearchInput.value = '';
    epSearchQuery = '';
    epSearchClear.style.display = 'none';
    // Re-activate the smileys tab
    epCategoryBar.querySelectorAll('.ep-cat-tab').forEach(t => t.classList.remove('active'));
    epCategoryBar.querySelector('[data-category="smileys"]').classList.add('active');
    epActiveCategory = 'smileys';
    epRenderGrid();
    epSearchInput.focus();
  });

  // --- Initial render ---
  epRenderGrid();

});
