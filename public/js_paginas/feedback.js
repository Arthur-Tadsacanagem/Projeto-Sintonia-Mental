const toggleTemaBtn = document.getElementById("toggle-tema");
        
        // --- FUNÇÕES DE ACESSIBILIDADE ---
        toggleTemaBtn.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");
            // Salvando o estado
            localStorage.setItem("modoEscuro", document.body.classList.contains("dark-mode"));
        });

        // Controle de tamanho de fonte
        let fontSize = 16; 
        const aumentarFonteBtn = document.getElementById("aumentar-fonte");
        const diminuirFonteBtn = document.getElementById("diminuir-fonte");

        function ajustarFonte(tamanho) {
            document.querySelectorAll('body, h1, h2, p, label, select, textarea, button, .feedback-card, .acessibilidade button').forEach(el => {
                el.style.fontSize = `${tamanho}px`;
            });
        }

        aumentarFonteBtn.addEventListener("click", () => {
            if (fontSize < 24) { 
                fontSize += 2;
                ajustarFonte(fontSize);
            }
        });

        diminuirFonteBtn.addEventListener("click", () => {
            if (fontSize > 10) { 
                fontSize -= 2;
                ajustarFonte(fontSize);
            }
        });
        
        // Carregar Modo Escuro ao Iniciar
        document.addEventListener('DOMContentLoaded', () => {
            if (localStorage.getItem("modoEscuro") === "true") {
                document.body.classList.add("dark-mode");
            }
        });
        
        // --- FUNÇÕES DE LÓGICA (CARREGAR FEEDBACKS E ENVIO) ---

        async function loadAllFeedbacks() {
            try {
                const response = await fetch('/todos-feedbacks');
                const feedbacks = await response.json();

                const container = document.getElementById('all-feedbacks');
                container.innerHTML = '';

                if (feedbacks.length === 0) {
                    container.innerHTML = '<p>Nenhum feedback registrado ainda.</p>';
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
                    '<p>Erro ao carregar feedbacks. Por favor, tente novamente.</p>';
            }
        }

        document.addEventListener('DOMContentLoaded', async () => {
            await loadAllFeedbacks();

            const authResponse = await fetch('/verificar-sessao-paciente');
            const authResult = await authResponse.json();

            if (authResult.autenticado) {
                document.getElementById('feedback-form-container').classList.remove('hidden');

                // Carregar atendimentos
                const atendimentoSelect = document.getElementById('atendimentoSelect');
                const atendimentosResponse = await fetch('/meus-atendimentos-json');
                const atendimentosResult = await atendimentosResponse.json();

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