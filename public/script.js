document.addEventListener("DOMContentLoaded", () => {
  function setupFormHandler(formId, nameId, flagId, challengeId, resultId) {
    const form = document.getElementById(formId);
    
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        
        // Show loading state
        submitButton.textContent = "Validating...";
        submitButton.disabled = true;

        const name = document.getElementById(nameId).value;
        const flag = document.getElementById(flagId).value;
        const challenge = parseInt(document.getElementById(challengeId).value);

        try {
          const res = await fetch("/flags", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, submittedFlag: flag, challenge })
          });

          const data = await res.json();
          const result = document.getElementById(resultId);

          // Clear previous classes
          result.className = '';

          if (data.success) {
            result.textContent = "✅ Correct! You earned this flag!";
            result.className = 'success';
            
            // Add celebration effect
            celebrateSuccess(submitButton);
          } else {
            const errorMessages = [
              "❌ Wrong flag. Try harder!",
              "❌ Not quite right. Keep investigating!",
              "❌ Close, but not correct. Think differently!",
              "❌ Incorrect. The flag is still hidden..."
            ];
            result.textContent = errorMessages[Math.floor(Math.random() * errorMessages.length)];
            result.className = 'error';
          }
        } catch (error) {
          const result = document.getElementById(resultId);
          result.textContent = "⚠️ Network error. Please try again.";
          result.className = 'error';
        } finally {
          // Restore button state
          setTimeout(() => {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
          }, 1000);
        }
      });
    }
  }

  // Setup all form handlers
  setupFormHandler("flagForm", "name", "flagInput", "challengeNum", "result");
  setupFormHandler("flagForm2", "name2", "flagInput2", "challengeNum2", "result2");
  setupFormHandler("flagForm3", "name3", "flagInput3", "challengeNum3", "result3");

  // Success celebration effect
  function celebrateSuccess(button) {
    button.style.background = 'linear-gradient(135deg, #00ff88, #00cc6a)';
    button.style.transform = 'scale(1.05)';
    
    setTimeout(() => {
      button.style.background = '';
      button.style.transform = '';
    }, 2000);
  }

  // Enhanced input validation and hints
  const flagInputs = document.querySelectorAll('input[id^="flagInput"]');
  flagInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      const value = e.target.value;
      
      // Basic flag format validation
      if (value && !value.startsWith('flag{')) {
        input.style.borderColor = '#ffd93d';
      } else if (value.startsWith('flag{') && value.endsWith('}')) {
        input.style.borderColor = '#00ff88';
      } else {
        input.style.borderColor = '';
      }
    });
  });

  // Add typing effect for challenge descriptions (optional enhancement)
  function typeWriter(element, text, speed = 50) {
    let i = 0;
    element.textContent = '';
    
    function type() {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed);
      }
    }
    
    type();
  }

  // Add subtle animations on scroll
  if ('IntersectionObserver' in window) {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    // Observe challenge cards
    document.querySelectorAll('.challenge-card').forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(card);
    });
  }

  // Console warning for Challenge 3 hint
  console.log('%c🔒 Developer Tools Detected!', 'color: #00ffcc; font-size: 16px; font-weight: bold;');
  console.log('%cLooks like you\'re investigating... Good! For Challenge 3, try calling a certain function 😉', 'color: #cccccc; font-size: 14px;');
});

// Add some Easter eggs for advanced users
window.addEventListener('keydown', (e) => {
  // Konami code easter egg
  const konamiCode = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA'
  ];
  
  if (!window.konamiSequence) window.konamiSequence = [];
  
  window.konamiSequence.push(e.code);
  window.konamiSequence = window.konamiSequence.slice(-10);
  
  if (window.konamiSequence.join(',') === konamiCode.join(',')) {
    console.log('%c🎉 KONAMI CODE ACTIVATED! 🎉', 'color: #00ffcc; font-size: 20px; font-weight: bold;');
    console.log('%cEaster egg found! You\'re a true hacker!', 'color: #00ff88; font-size: 16px;');
    
    // Add visual effect
    document.body.style.animation = 'pulse 0.5s ease-in-out 3';
  }
});