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

    // Validação do formulário
    document.querySelector('form').addEventListener('submit', function (event) {
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
      const generalError = document.getElementById('generalError');

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

      if (hasError) {
        event.preventDefault();
      }
    });

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

    // VALIDAÇÃO EM TEMPO REAL DA SENHA
    const senhaInput = document.getElementById('Senha');
    const checkLength = document.getElementById('checkLength');
    const checkSpecial = document.getElementById('checkSpecial');
    const checkUppercase = document.getElementById('checkUppercase');
    const checkNumber = document.getElementById('checkNumber');

    senhaInput.addEventListener('input', function() {
      const senha = senhaInput.value;
      
      // Verificar comprimento
      if (senha.length >= 8) {
        checkLength.querySelector('.checklist-icon').classList.remove('incomplete');
        checkLength.querySelector('.checklist-icon').classList.add('complete');
        checkLength.querySelector('.checklist-icon').textContent = '✓';
      } else {
        checkLength.querySelector('.checklist-icon').classList.remove('complete');
        checkLength.querySelector('.checklist-icon').classList.add('incomplete');
        checkLength.querySelector('.checklist-icon').textContent = '✗';
      }
      
      // Verificar caractere especial
      if (/[!@#$%^&*(),.?":{}|<>]/.test(senha)) {
        checkSpecial.querySelector('.checklist-icon').classList.remove('incomplete');
        checkSpecial.querySelector('.checklist-icon').classList.add('complete');
        checkSpecial.querySelector('.checklist-icon').textContent = '✓';
      } else {
        checkSpecial.querySelector('.checklist-icon').classList.remove('complete');
        checkSpecial.querySelector('.checklist-icon').classList.add('incomplete');
        checkSpecial.querySelector('.checklist-icon').textContent = '✗';
      }
      
      // Verificar letra maiúscula
      if (/[A-Z]/.test(senha)) {
        checkUppercase.querySelector('.checklist-icon').classList.remove('incomplete');
        checkUppercase.querySelector('.checklist-icon').classList.add('complete');
        checkUppercase.querySelector('.checklist-icon').textContent = '✓';
      } else {
        checkUppercase.querySelector('.checklist-icon').classList.remove('complete');
        checkUppercase.querySelector('.checklist-icon').classList.add('incomplete');
        checkUppercase.querySelector('.checklist-icon').textContent = '✗';
      }
      
      // Verificar número
      if (/[0-9]/.test(senha)) {
        checkNumber.querySelector('.checklist-icon').classList.remove('incomplete');
        checkNumber.querySelector('.checklist-icon').classList.add('complete');
        checkNumber.querySelector('.checklist-icon').textContent = '✓';
      } else {
        checkNumber.querySelector('.checklist-icon').classList.remove('complete');
        checkNumber.querySelector('.checklist-icon').classList.add('incomplete');
        checkNumber.querySelector('.checklist-icon').textContent = '✗';
      }
    });