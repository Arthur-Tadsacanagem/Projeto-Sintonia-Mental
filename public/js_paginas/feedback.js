// Função global para mostrar/esconder o painel de acessibilidade (Disparada pelo botão mestre)
function toggleAcessibilidadePanel() {
    const panel = document.getElementById('acessibilidadePanel');
    panel.classList.toggle('show');
}

document.addEventListener('DOMContentLoaded', async () => {
    // --- ELEMENTOS DE ACESSIBILIDADE ---
    const toggleTemaBtn = document.getElementById("toggle-tema");
    const aumentarFonteBtn = document.getElementById("aumentar-fonte");
    const diminuirFonteBtn = document.getElementById("diminuir-fonte");
    
    // --- VARIÁVEL DE ESTADO DE FONTE ---
    let fontSize = 16; 

    // --- FUNÇÕES DE ACESSIBILIDADE ---

    function ajustarFonte(tamanho) {
        // Seletores amplos para garantir que todo o texto seja ajustado
        document.querySelectorAll('body, h1, h2, p, label, select, textarea, button, .feedback-card, .acessibilidade-btn').forEach(el => {
            el.style.fontSize = `${tamanho}px`;
        });
    }

    // Ação A+
    aumentarFonteBtn.addEventListener("click", () => {
        if (fontSize < 24) { 
            fontSize += 2;
            ajustarFonte(fontSize);
        }
    });

    // Ação A-
    diminuirFonteBtn.addEventListener("click", () => {
        if (fontSize > 10) { 
            fontSize -= 2;
            ajustarFonte(fontSize);
        }
    });
    
    // Lógica de Dark Mode
    toggleTemaBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        const isDark = document.body.classList.contains("dark-mode");
        localStorage.setItem("modoEscuro", isDark);
        toggleTemaBtn.textContent = isDark ? "☀️" : "🌙";
    });
    
    // --- FUNÇÕES DE LÓGICA (CARREGAR FEEDBACKS) ---
    
    async function loadAllFeedbacks() {
        try {
            const response = await fetch('/todos-feedbacks');
            const feedbacks = await response.json();

            const container = document.getElementById('all-feedbacks');
            container.innerHTML = '';
            
            if (feedbacks.length === 0) {
                container.innerHTML = '<p class="no-data">Nenhum feedback registrado ainda.</p>';
                return;
            }

            const feedbackList = document.createElement('div');
            feedbackList.className = 'feedback-list';

            feedbacks.forEach(feedback => {
                const card = document.createElement('div');
                card.className = 'feedback-card';

                // Criar estrelas de avaliação
                const stars = '★'.repeat(feedback.nota) + '☆'.repeat(5 - feedback.nota);
                const pacienteInfoText = feedback.paciente_nome ? `Paciente: ${feedback.paciente_nome}` : 'Paciente: Anônimo';

                card.innerHTML = `
                <div class="rating">${stars}</div>
                ${feedback.comentario ? `<p>"${feedback.comentario}"</p>` : '<p>(Sem comentário)</p>'}
                <div class="paciente-info">${pacienteInfoText}</div>
                <div class="date">${new Date(feedback.criado_em).toLocaleDateString()}</div>
            `;

                feedbackList.appendChild(card);
            });

            container.appendChild(feedbackList);
        } catch (error) {
            console.error('Erro ao carregar feedbacks:', error);
            document.getElementById('all-feedbacks').innerHTML =
                '<p class="no-data">Erro ao carregar feedbacks. Por favor, tente novamente.</p>';
        }
    }
    
    // --- INICIALIZAÇÃO GERAL ---
    
    // 1. Carregar Modo Escuro ao Iniciar
    if (localStorage.getItem("modoEscuro") === "true") {
        document.body.classList.add("dark-mode");
        toggleTemaBtn.textContent = "☀️";
    }

    // 2. Carregar Feedbacks
    await loadAllFeedbacks();
    
    // 3. Lógica de Autenticação e Formulário
    const authResponse = await fetch('/verificar-sessao-paciente');
    const authResult = await authResponse.json();

    if (authResult.autenticado) {
        document.getElementById('feedback-form-container').classList.remove('hidden');

        // Carregar atendimentos
        const atendimentoSelect = document.getElementById('atendimentoSelect');
        const atendimentosResponse = await fetch('/meus-atendimentos-json');
        const atendimentosResult = await atendimentosResponse.json();
        
        // Renderizar opções de atendimento
        if (atendimentosResult.atendimentos.length === 0) {
            const opt = document.createElement('option');
            opt.textContent = 'Nenhum atendimento encontrado';
            opt.disabled = true;
            atendimentoSelect.appendChild(opt);
        } else {
            atendimentosResult.atendimentos.forEach(att => {
                const opt = document.createElement('option');
                opt.value = `${att.atendimento_id}|${att.psicologo_id}`;
                opt.textContent = `${att.psicologo_nome} (ID ${att.atendimento_id})`;
                atendimentoSelect.appendChild(opt);
            });
        }
        
        // Lógica de Envio de Feedback
        document.getElementById('enviar-feedback').addEventListener('click', async () => {
            const nota = document.getElementById('rating').value;
            const comentario = document.getElementById('comentario').value;
            const selected = atendimentoSelect.value;

            if (!selected) {
                alert("Selecione um atendimento.");
                return;
            }

            const [atendimento_id, psicologo_id] = selected.split('|');

            try {
                const response = await fetch('/salvar-feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nota,
                        comentario,
                        atendimento_id,
                        psicologo_id
                    })
                });

                const result = await response.json();

                if (result.success) {
                    alert('Obrigado pelo seu feedback!');
                    window.location.reload();
                } else {
                    alert(result.error || 'Erro ao enviar feedback');
                }
            } catch (error) {
                console.error('Erro:', error);
                alert('Erro ao conectar com o servidor');
            }
        });

    } else {
        document.getElementById('auth-alert').classList.remove('hidden');
    }
});