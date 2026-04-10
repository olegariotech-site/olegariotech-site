        // Ativação por qualquer movimento ou toque (cobertura total)
        ['touchstart', 'touchmove', 'mousedown', 'keydown', 'wheel', 'mousewheel', 'DOMMouseScroll'].forEach(event => {
          window.addEventListener(event, () => {
            if (!hasInteracted) initAudio();
          }, { once: true, passive: true });
        });

        // CONTROLE DO BOTÃO MUTE
        const muteBtn = document.getElementById('muteBtn');
        if (muteBtn) {
          muteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita disparar outros eventos
            audio.muted = !audio.muted;
            muteBtn.classList.toggle('muted', audio.muted);
          });
        }

        // Tenta autoplay silencioso (vai falhar em alguns mobile, aí espera interação)
        audio.play().then(() => {
          isPlaying = true;
          hasInteracted = true;
        }).catch(() => {
          // Autoplay bloqueado, espera interação
          audio.pause();
        });

        // Inicia loop de suavização
        updateTargetVolume(); // Calcula inicial
        smoothVolume();

      })();

    })();
  </script>
</body>
</html>
