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

let fontSize = 16;
const aumentarFonteBtn = document.getElementById("aumentar-fonte");
const diminuirFonteBtn = document.getElementById("diminuir-fonte");
const root = document.documentElement;

/**
 * Função unificada para ajustar o tamanho da fonte (usando 'rem' ou '%').
 * A lógica original que manipulava 'style.fontSize' foi substituída pela manipulação de '%' no elemento raiz (root),
 * usando a lógica mais recente encontrada no final do seu código.
 */

// Lógica de aumento de fonte baseada em % no root (mais robusta para acessibilidade)
let fonteAtual = 100; // Porcentagem inicial

document.getElementById("aumentar-fonte").onclick = () => {
    if (fonteAtual < 150) {
        fonteAtual += 10;
        root.style.fontSize = fonteAtual + "%";
    }
};

document.getElementById("diminuir-fonte").onclick = () => {
    if (fonteAtual > 80) {
        fonteAtual -= 10;
        root.style.fontSize = fonteAtual + "%";
    }
};


// ===================================
// III. MÁSCARAS E VALIDAÇÃO DE CPF
// ===================================

// Máscara de Telefone: (DD) XXXXX-XXXX ou (DD) XXXX-XXXX
const telefoneInput = document.getElementById('Telefone');
telefoneInput.addEventListener('input', () => {
    let telefone = telefoneInput.value.replace(/\D/g, '');
    if (telefone.length > 11) telefone = telefone.slice(0, 11);

    if (telefone.length > 2) {
        telefone = telefone.replace(/^(\d{2})/, '($1) ');
    }
    if (telefone.length > 10) {
        telefone = telefone.replace(/(\d{5})(\d)/, '$1-$2');
    } else if (telefone.length > 6) {
        telefone = telefone.replace(/(\d{4})(\d)/, '$1-$2');
    }

    telefoneInput.value = telefone;
});

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

/**
 * Função de Validação de CPF.
 * @param {string} cpf - O CPF a ser validado (pode conter pontuação).
 * @returns {boolean} True se o CPF for válido.
 */
function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf == '') return false;
    if (cpf.length != 11 ||
        cpf == "00000000000" ||
        cpf == "11111111111" ||
        cpf == "22222222222" ||
        cpf == "33333333333" ||
        cpf == "44444444444" ||
        cpf == "55555555555" ||
        cpf == "66666666666" ||
        cpf == "77777777777" ||
        cpf == "88888888888" ||
        cpf == "99999999999")
        return false;
    let add = 0;
    for (let i = 0; i < 9; i++)
        add += parseInt(cpf.charAt(i)) * (10 - i);
    let rev = 11 - (add % 11);
    if (rev == 10 || rev == 11)
        rev = 0;
    if (rev != parseInt(cpf.charAt(9)))
        return false;
    add = 0;
    for (let i = 0; i < 10; i++)
        add += parseInt(cpf.charAt(i)) * (11 - i);
    rev = 11 - (add % 11);
    if (rev == 10 || rev == 11)
        rev = 0;
    if (rev != parseInt(cpf.charAt(10)))
        return false;
    return true;
}

// ==========================================================
// IV. VALIDAÇÃO E SUBMISSÃO DO FORMULÁRIO (COM RECAPTCHA)
// ==========================================================

document.querySelector('form').addEventListener('submit', async function (event) {
    event.preventDefault(); // Previne o envio padrão do formulário

    // Limpa mensagens de erro e classes 'error' anteriores
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    document.querySelectorAll('input, select').forEach(el => el.classList.remove('error'));

    // Captura dos elementos do formulário e de erro
    const nomeInput = document.getElementById('Nome');
    const cpfInput = document.getElementById('CPF');
    const dataNascimentoInput = document.getElementById('DataNascimento');
    const generoInput = document.getElementById('Genero');
    const emailInput = document.getElementById('Email');
    const telefoneInput = document.getElementById('Telefone');
    const senhaInput = document.getElementById('Senha');
    const confirmarSenhaInput = document.getElementById('ConfirmarSenha');

    const nomeError = document.getElementById('nomeError');
    const cpfError = document.getElementById('cpfError');
    const dataNascimentoError = document.getElementById('dataNascimentoError');
    const generoError = document.getElementById('generoError');
    const emailError = document.getElementById('emailError');
    const telefoneError = document.getElementById('telefoneError');
    const senhaError = document.getElementById('senhaError');
    const confirmarSenhaError = document.getElementById('confirmarSenhaError');
    const generalError = document.getElementById('generalError');

    let hasError = false;

    // ... (MANTÉM AS VALIDAÇÕES EXISTENTES DE FRONT-END) ...

    // Validação de Nome Completo
    const nomeCompleto = nomeInput.value.trim();
    const nomePartes = nomeCompleto.split(' ').filter(part => part !== '');
    if (nomePartes.length < 2) {
        nomeError.textContent = 'Por favor, insira seu nome completo (nome e sobrenome).';
        nomeInput.classList.add('error');
        hasError = true;
    } else if (nomeCompleto.length < 3) {
        nomeError.textContent = 'Nome completo muito curto.';
        nomeInput.classList.add('error');
        hasError = true;
    }

    // Validação de CPF
    if (!validarCPF(cpfInput.value)) {
        cpfError.textContent = 'CPF inválido.';
        cpfInput.classList.add('error');
        hasError = true;
    }

    // Validação de Data de Nascimento
    if (dataNascimentoInput.value === '') {
        dataNascimentoError.textContent = 'Por favor, insira sua data de nascimento.';
        dataNascimentoInput.classList.add('error');
        hasError = true;
    } else {
        const dataNasc = new Date(dataNascimentoInput.value);
        const hoje = new Date();
        if (dataNasc > hoje) {
            dataNascimentoError.textContent = 'Data de nascimento não pode ser futura.';
            dataNascimentoInput.classList.add('error');
            hasError = true;
        }
    }

    // Validação de Gênero
    if (generoInput.value === '') {
        generoError.textContent = 'Por favor, selecione seu gênero.';
        generoInput.classList.add('error');
        hasError = true;
    }

    // Validação de Email
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(emailInput.value)) {
        emailError.textContent = 'Por favor, insira um e-mail válido.';
        emailInput.classList.add('error');
        hasError = true;
    }

    // Validação de Telefone
    const telefoneNumeros = telefoneInput.value.replace(/\D/g, '');
    if (telefoneNumeros.length < 10 || telefoneNumeros.length > 11) {
        telefoneError.textContent = 'Telefone inválido. Ex: (DD) 9XXXX-XXXX ou (DD) XXXX-XXXX.';
        telefoneInput.classList.add('error');
        hasError = true;
    }


    // Validação de Senha (Critérios de segurança)
    const regexCaractereEspecial = /[!@#$%^&*(),.?":{}|<>]/;
    const regexMaiuscula = /[A-Z]/;
    const regexNumero = /[0-9]/;

    if (senhaInput.value.length < 8 ||
        !regexCaractereEspecial.test(senhaInput.value) ||
        !regexMaiuscula.test(senhaInput.value) ||
        !regexNumero.test(senhaInput.value)) {
        senhaError.textContent = 'A senha deve ter no mínimo 8 caracteres e conter pelo menos 1 caractere especial, 1 letra maiúscula e 1 número.';
        senhaInput.classList.add('error');
        hasError = true;
    } else if (senhaInput.value !== confirmarSenhaInput.value) {
        confirmarSenhaError.textContent = 'As senhas não coincidem.';
        confirmarSenhaInput.classList.add('error');
        hasError = true;
    }

    // Se houver qualquer erro de validação front-end, impede o envio do formulário
    if (hasError) {
        return;
    }
    
    // =================================================
    // VALIDAÇÃO E EXTRAÇÃO DO RECAPTCHA
    // =================================================
    const recaptchaToken = document.querySelector('[name="g-recaptcha-response"]') ? 
                           document.querySelector('[name="g-recaptcha-response"]').value : null;

    if (!recaptchaToken) {
        generalError.textContent = 'Por favor, complete a verificação "Não sou um robô" (reCAPTCHA).';
        // Tenta resetar o CAPTCHA se o widget estiver presente, caso o usuário tenha esquecido
        if (typeof grecaptcha !== 'undefined') {
            grecaptcha.reset(); 
        }
        return; // BLOQUEIA O ENVIO SE O CAPTCHA NÃO FOI RESOLVIDO
    }
    // =================================================

    // Preparação dos dados para envio
    const formData = {
        nome: nomeCompleto,
        cpf: cpfInput.value.replace(/\D/g, ''),
        data_nascimento: dataNascimentoInput.value,
        genero: generoInput.value,
        login: emailInput.value.trim(),
        telefone: telefoneNumeros,
        senha: senhaInput.value,
        confirmarSenha: confirmarSenhaInput.value,
        recaptcha: recaptchaToken // 👈 CHAVE DO CAPTCHA ADICIONADA AQUI
    };

    try {
        const response = await fetch('/cadastrar-paciente', {
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

        if (result.success) {
            // Se o servidor retornar sucesso, redireciona.
            console.log('Cadastro realizado com sucesso! Dados enviados:', formData); 
            alert('Cadastro realizado com sucesso! Redirecionando para o login...'); // Alerta visual para o usuário
            window.location.href = result.redirect || '/login-paciente.html';
        }
    } catch (error) {
        console.error('Erro na requisição ou resposta:', error);

        // Tratamento de erros que viriam do Backend (Adicionado tratamento de CAPTCHA)
        if (error.error === 'cpf-exists') {
            cpfError.textContent = error.message;
            cpfInput.classList.add('error');
        } else if (error.error === 'email-exists') {
            emailError.textContent = error.message;
            emailInput.classList.add('error');
        } else if (error.error === 'captcha-failed' || error.error === 'missing-captcha') {
            // TRATAMENTO DO ERRO DO CAPTCHA VINDO DO BACKEND
            generalError.textContent = 'Falha na verificação de segurança (reCAPTCHA). Por favor, tente novamente.';
            // Reseta o widget para que o usuário possa tentar novamente
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

/**
 * Listener global para alternar a visibilidade das senhas (o "olhinho").
 * Usa a classe 'toggle-password' e o atributo 'data-target' para identificar o campo.
 */
document.addEventListener('click', function (event) {
    // Procura o elemento 'toggle-password' que foi clicado
    const icon = event.target.closest('.toggle-password');

    if (icon) {
        const targetId = icon.getAttribute('data-target');
        const input = document.getElementById(targetId);

        if (input) {
            // Alterna o tipo do input (password <-> text)
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);

            // Alterna o ícone (fa-eye <-> fa-eye-slash) - Requer Font Awesome no HTML
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        }
    }
});