// Captura as estrelas e adiciona interatividade de seleção
const stars = document.querySelectorAll('.star');
let rating = 0;

stars.forEach((star, index) => {
    star.addEventListener('click', () => {
        rating = index + 1;
        updateStarRating();
    });
});

function updateStarRating() {
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('selected');
        } else {
            star.classList.remove('selected');
        }
    });
}

// Função para exibir feedbacks registrados
function displayFeedback(name, date, feedback, rating) {
    const feedbackContainer = document.getElementById('feedbackContainer');
    const feedbackItem = document.createElement('div');
    feedbackItem.classList.add('feedback-item');
    feedbackItem.innerHTML = `
        <strong>Psicólogo:</strong> ${name}<br>
        <strong>Data:</strong> ${date}<br>
        <strong>Comentário:</strong> ${feedback}<br>
        <strong>Avaliação:</strong> ${'★'.repeat(rating)}
    `;
    feedbackContainer.appendChild(feedbackItem);
}

// Envia o formulário e exibe uma mensagem de confirmação
const feedbackForm = document.getElementById('feedbackForm');

feedbackForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('psychologistName').value;
    const date = document.getElementById('consultDate').value;
    const feedback = document.getElementById('feedbackText').value;

    displayFeedback(name, date, feedback, rating);
    alert(`Feedback enviado!`);
    feedbackForm.reset();
    rating = 0;
    updateStarRating();
});

// Função para alternar o modo escuro
const toggleTemaBtn = document.getElementById('toggle-tema');
toggleTemaBtn.addEventListener('click', () => {
    document.body.classList.toggle('modo-escuro');
});

// Funções para aumentar e diminuir o tamanho da fonte
let fontSize = 16;
const aumentarFonteBtn = document.getElementById('aumentar-fonte');
const diminuirFonteBtn = document.getElementById('diminuir-fonte');

function ajustarFonte(tamanho) {
    document.querySelectorAll('body, input, button, h2, label, p, a, textarea, .feedback-item').forEach(el => {
        el.style.fontSize = `${tamanho}px`;
    });
}

aumentarFonteBtn.addEventListener('click', () => {
    if (fontSize < 24) { // Limite máximo sugerido
        fontSize += 2;
        ajustarFonte(fontSize);
    }
});

diminuirFonteBtn.addEventListener('click', () => {
    if (fontSize > 12) { // Limite mínimo sugerido
        fontSize -= 2;
        ajustarFonte(fontSize);
    }
});
