// ===================================
// I. ACESSIBILIDADE: TEMA ESCURO
// ===================================

// Alternância de modo escuro
const toggleTemaBtn = document.getElementById("toggle-tema");
toggleTemaBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
});

// ===================================
// II. ACESSIBILIDADE: CONTROLE DE FONTE
// ===================================

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


// ===================================
// III. MÁSCARA E VALIDAÇÃO DE CPF
// ===================================

/**
 * Função de Validação de CPF.
 * (Mantenha esta função fora do escopo do listener para que a máscara a encontre)
 * @param {string} cpf - O CPF a ser validado (pode conter pontuação).
 * @returns {boolean} True se o CPF for válido.
 */
function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length != 11 || /^(\d)\1+$/.test(cpf)) return false;

    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto == 10 || resto == 11) resto = 0;
    if (resto != parseInt(cpf.substring(9, 10))) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto == 10 || resto == 11) resto = 0;
    if (resto != parseInt(cpf.substring(10, 11))) return false;

    return true;
}

// Máscara de CPF: 000.000.000-00
const cpfInput = document.getElementById('CPF');
cpfInput.addEventListener('input', () => {
    let cpf = cpfInput.value.replace(/\D/g, '');
    if (cpf.length > 11) cpf = cpf.slice(0, 11);
    cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
    cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
    cpf = cpf.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    cpfInput.value = cpf;
});


// ==========================================================
// IV. VALIDAÇÃO E SUBMISSÃO DO FORMULÁRIO (COM RECAPTCHA)
// (Função convertida para async para usar fetch)
// ==========================================================
document.querySelector('form').addEventListener('submit', async function (event) {
    event.preventDefault(); // Previne o envio padrão do formulário

    const nome = document.getElementById('Nome');
    const cpf = document.getElementById('CPF');
    const email = document.getElementById('Email');
    const senha = document.getElementById('Senha');
    const confirmarSenha = document.getElementById('ConfirmarSenha');

    const nomeError = document.getElementById('nomeError');
    const cpfError = document.getElementById('cpfError');
    const emailError = document.getElementById('emailError');
    const senhaError = document.getElementById('senhaError');
    const confirmarSenhaError = document.getElementById('confirmarSenhaError');
    const generalError = document.getElementById('generalError'); // Para erros gerais/CAPTCHA

    // Limpeza de erros
    nomeError.innerText = '';
    cpfError.innerText = '';
    emailError.innerText = '';
    senhaError.innerText = '';
    confirmarSenhaError.innerText = '';
    generalError.innerText = '';

    nome.classList.remove('error');
    cpf.classList.remove('error');
    email.classList.remove('error');
    senha.classList.remove('error');
    confirmarSenha.classList.remove('error');

    let hasError = false;

    // ********* VALIDAÇÕES DE FRONT-END *********
    const nomeValor = nome.value.trim();
    if (nomeValor === '') {
        nomeError.innerText = 'O campo nome é obrigatório.';
        nome.classList.add('error');
        hasError = true;
    } else if (nomeValor.split(' ').length < 2) {
        nomeError.innerText = 'Digite pelo menos nome e sobrenome.';
        nome.classList.add('error');
        hasError = true;
    }

    if (!validarCPF(cpf.value)) {
        cpfError.innerText = 'CPF inválido.';
        cpf.classList.add('error');
        hasError = true;
    }

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(email.value)) {
        emailError.innerText = 'Por favor, insira um e-mail válido.';
        email.classList.add('error');
        hasError = true;
    }

    const regexCaractereEspecial = /[!@#$%^&*(),.?":{}|<>]/;
    const regexMaiuscula = /[A-Z]/;
    const regexNumero = /[0-9]/;

    if (senha.value !== confirmarSenha.value) {
        confirmarSenhaError.innerText = 'As senhas não coincidem.';
        confirmarSenha.classList.add('error');
        hasError = true;
    } else if (senha.value.length < 8 ||
        !regexCaractereEspecial.test(senha.value) ||
        !regexMaiuscula.test(senha.value) ||
        !regexNumero.test(senha.value)) {
        senhaError.innerText = 'A senha deve ter no mínimo 8 caracteres, 1 caractere especial, 1 maiúscula e 1 número.';
        senha.classList.add('error');
        hasError = true;
    }
    // ********* FIM DAS VALIDAÇÕES DE FRONT-END *********

    if (hasError) {
        // Se houver erro de validação de campo, interrompe o processo.
        return;
    }
    
    // =================================================
    // VALIDAÇÃO E EXTRAÇÃO DO RECAPTCHA
    // =================================================
    // O reCAPTCHA injeta o token no formulário com o nome 'g-recaptcha-response'.
    const recaptchaToken = document.querySelector('[name="g-recaptcha-response"]') ? 
                           document.querySelector('[name="g-recaptcha-response"]').value : null;

    if (!recaptchaToken) {
        generalError.textContent = 'Por favor, complete a verificação "Não sou um robô" (reCAPTCHA).';
        if (typeof grecaptcha !== 'undefined') {
            grecaptcha.reset(); 
        }
        return; // BLOQUEIA O ENVIO SE O CAPTCHA NÃO FOI RESOLVIDO
    }
    // =================================================

    // Preparação dos dados para envio (formato JSON que o Node.js espera)
    const formData = {
        nome: nomeValor,
        cpf: cpf.value.replace(/\D/g, ''),
        login: email.value.trim(),
        senha: senha.value,
        confirmarSenha: confirmarSenha.value,
        recaptcha: recaptchaToken // 👈 OBRIGATÓRIO PARA O BACKEND
    };

    try {
        // Envia para a rota de cadastro de Psicólogo
        const response = await fetch('/cadastrar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw result;
        }
        
        // Sucesso no Cadastro
        alert('Cadastro de Psicólogo realizado com sucesso! Redirecionando...'); 
        window.location.href = result.redirect || '/login.html';


    } catch (error) {
        console.error('Erro na requisição ou resposta:', error);
        
        // TRATAMENTO DE ERROS DO BACKEND
        if (error.error === 'cpf-exists') {
            cpfError.textContent = error.message;
            cpf.classList.add('error');
        } else if (error.error === 'email-exists') {
            emailError.textContent = error.message;
            email.classList.add('error');
        } else if (error.error === 'captcha-failed' || error.error === 'missing-captcha') {
            // TRATAMENTO DO ERRO DO CAPTCHA VINDO DO BACKEND
            generalError.textContent = 'Falha na verificação de segurança (reCAPTCHA). Por favor, tente novamente.';
            if (typeof grecaptcha !== 'undefined') {
                grecaptcha.reset(); 
            }
        } else {
            generalError.textContent = error.message || 'Erro ao cadastrar. Por favor, tente novamente.';
        }
    }
});


// ===================================
// V. VISUALIZAÇÃO DE SENHA (TOGGLE)
// ===================================

// CORREÇÃO PARA MOSTRAR/OCULTAR SENHAS
document.addEventListener('click', function (event) {
    if (event.target.classList.contains('toggle-password') ||
        event.target.parentElement.classList.contains('toggle-password')) {

        // Encontra o ícone mais próximo
        const icon = event.target.closest('.toggle-password');
        const targetId = icon.getAttribute('data-target');
        const input = document.getElementById(targetId);

        if (input) {
            // Alterna entre password/text
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);

            // Alterna o ícone
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        }
    }
});

// ===================================
// VI. VALIDAÇÃO EM TEMPO REAL DA SENHA
// ===================================

const senhaInput = document.getElementById('Senha');
// Certifique-se de que estes IDs existam no seu HTML
const checkLength = document.getElementById('checkLength');
const checkSpecial = document.getElementById('checkSpecial');
const checkUppercase = document.getElementById('checkUppercase');
const checkNumber = document.getElementById('checkNumber');

senhaInput.addEventListener('input', function() {
    const senha = senhaInput.value;
    
    // Verifica se os elementos da lista de validação existem antes de manipular
    if (!checkLength || !checkSpecial || !checkUppercase || !checkNumber) return;

    // Função auxiliar para atualizar o status do checklist
    const updateCheck = (element, condition) => {
        const icon = element.querySelector('.checklist-icon');
        if (condition) {
            icon.classList.remove('incomplete');
            icon.classList.add('complete');
            icon.textContent = '✓';
        } else {
            icon.classList.remove('complete');
            icon.classList.add('incomplete');
            icon.textContent = '✗';
        }
    };
    
    // Verificar comprimento
    updateCheck(checkLength, senha.length >= 8);
    
    // Verificar caractere especial
    updateCheck(checkSpecial, /[!@#$%^&*(),.?":{}|<>]/.test(senha));
    
    // Verificar letra maiúscula
    updateCheck(checkUppercase, /[A-Z]/.test(senha));
    
    // Verificar número
    updateCheck(checkNumber, /[0-9]/.test(senha));
});