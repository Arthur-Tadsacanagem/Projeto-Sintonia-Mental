// Alternância de modo escuro
        const toggleTemaBtn = document.getElementById("toggle-tema");
        toggleTemaBtn.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");
        });

        // Controle de tamanho de fonte
        let fontSize = 16;
        const aumentarFonteBtn = document.getElementById("aumentar-fonte");
        const diminuirFonteBtn = document.getElementById("diminuir-fonte");

        function ajustarFonte(tamanho) {
            document.querySelectorAll('body, input, button, h1').forEach(el => {
                el.style.fontSize = `${tamanho}px`;
            });
        }

        aumentarFonteBtn.addEventListener("click", () => {
            fontSize += 2;
            ajustarFonte(fontSize);
        });

        diminuirFonteBtn.addEventListener("click", () => {
            if (fontSize > 12) {
                fontSize -= 2;
                ajustarFonte(fontSize);
            }
        });

        // Mostrar/ocultar senha
        const togglePassword = document.getElementById('togglePassword');
        const senhaInput = document.getElementById('senha');

        togglePassword.addEventListener('click', function () {
            // Alterna entre type password e text
            const type = senhaInput.getAttribute('type') === 'password' ? 'text' : 'password';
            senhaInput.setAttribute('type', type);

            // Alterna o ícone do olho
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });

        // Sistema de bloqueio após tentativas
        const MAX_ATTEMPTS = 3;
        const BLOCK_TIME = 60; // 60 segundos (1 minuto)

        // Inicializar tentativas no localStorage se não existir
        if (!localStorage.getItem('loginPacienteAttempts')) {
            localStorage.setItem('loginPacienteAttempts', '0');
        }

        // Verificar se está bloqueado
        const blockUntil = localStorage.getItem('loginPacienteBlockUntil');
        const loginAttempts = parseInt(localStorage.getItem('loginPacienteAttempts'));
        const submitButton = document.getElementById('submitButton');
        const blockedOverlay = document.getElementById('blockedOverlay');
        const countdownElement = document.getElementById('countdown');
        const attemptsWarning = document.getElementById('attemptsWarning');

        // Mostrar aviso de tentativas restantes
        if (loginAttempts > 0) {
            const remainingAttempts = MAX_ATTEMPTS - loginAttempts;
            attemptsWarning.textContent = `Atenção: ${remainingAttempts} tentativa(s) restante(s) antes do bloqueio.`;
            attemptsWarning.style.display = 'block';
        }

        // Verificar se está bloqueado
        if (blockUntil && Date.now() < parseInt(blockUntil)) {
            // Calcular tempo restante
            const remainingTime = Math.ceil((parseInt(blockUntil) - Date.now()) / 1000);
            startCountdown(remainingTime);
        } else if (blockUntil && Date.now() >= parseInt(blockUntil)) {
            // Remover bloqueio se o tempo expirou
            localStorage.removeItem('loginPacienteBlockUntil');
            localStorage.setItem('loginPacienteAttempts', '0');
        }

        // Função para iniciar contagem regressiva
        function startCountdown(seconds) {
            // Bloquear formulário
            submitButton.disabled = true;
            blockedOverlay.style.display = 'flex';

            let remaining = seconds;
            updateCountdownDisplay(remaining);

            const countdownInterval = setInterval(() => {
                remaining--;
                updateCountdownDisplay(remaining);

                if (remaining <= 0) {
                    clearInterval(countdownInterval);
                    // Liberar formulário
                    submitButton.disabled = false;
                    blockedOverlay.style.display = 'none';
                    localStorage.removeItem('loginPacienteBlockUntil');
                    localStorage.setItem('loginPacienteAttempts', '0');
                    attemptsWarning.style.display = 'none';
                }
            }, 1000);
        }

        // Atualizar display do contador
        function updateCountdownDisplay(seconds) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            countdownElement.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }

        // Envio do formulário
        document.getElementById('loginPacienteForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const login = document.getElementById('login').value;
            const senha = document.getElementById('senha').value;

            const params = new URLSearchParams();
            params.append('login', login);
            params.append('senha', senha);

            try {
                const response = await fetch('/login-paciente', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: params,
                    credentials: 'include'
                });

                const result = await response.json();

                if (result.success && result.redirect) {
                    // Login bem-sucedido - resetar contador de tentativas
                    localStorage.setItem('loginPacienteAttempts', '0');
                    window.location.href = result.redirect;
                } else if (result.error) {
                    // Login falhou - incrementar tentativas
                    let currentAttempts = parseInt(localStorage.getItem('loginPacienteAttempts')) || 0;
                    currentAttempts++;
                    localStorage.setItem('loginPacienteAttempts', currentAttempts.toString());

                    // Atualizar aviso de tentativas
                    const remainingAttempts = MAX_ATTEMPTS - currentAttempts;
                    if (remainingAttempts > 0) {
                        attemptsWarning.textContent = `Atenção: ${remainingAttempts} tentativa(s) restante(s) antes do bloqueio.`;
                        attemptsWarning.style.display = 'block';
                    }

                    // Se atingiu o máximo de tentativas, bloquear
                    if (currentAttempts >= MAX_ATTEMPTS) {
                        const blockUntilTime = Date.now() + (BLOCK_TIME * 1000);
                        localStorage.setItem('loginPacienteBlockUntil', blockUntilTime.toString());
                        startCountdown(BLOCK_TIME);
                    }

                    alert(result.message || 'Erro no login');
                }
            } catch (error) {
                console.error('Erro ao conectar com o servidor:', error);
                alert('Erro ao conectar com o servidor');
            }
        });