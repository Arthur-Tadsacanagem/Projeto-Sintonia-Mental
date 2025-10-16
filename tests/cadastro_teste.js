const { Builder, By, until } = require('selenium-webdriver');
require('chromedriver'); 

// **************************** CONFIGURAÇÃO DA URL ****************************
// O projeto deve estar rodando em http://localhost:3000/ antes de executar este script.
const URL_PAGINA_CADASTRO = 'http://localhost:3000/cadastro.html'; 
// *****************************************************************************

// Configurações baseadas no seu HTML:
const ID_CAMPO_SENHA = 'Senha'; 
const ID_CAMPO_CONFIRMACAO = 'ConfirmarSenha';
const ID_BOTAO_SUBMIT = 'submitButton';

// *** AJUSTE NECESSÁRIO ***: Altere 'complete' se seu JS usa outra classe (ex: 'valid').
const CLASSE_VALIDA_CHECKLIST = 'complete'; 

// IDs dos itens do Checklist
const CHECKLIST_IDS = {
    length: 'checkLength',
    special: 'checkSpecial',
    uppercase: 'checkUppercase',
    number: 'checkNumber'
};

// --- FUNÇÃO PRINCIPAL DE TESTE ---
async function testCadastroPsicologo() {
    let driver = await new Builder().forBrowser('chrome').build();
    let sucesso = true;

    try {
        console.log("Iniciando teste de formulário de cadastro de Psicólogo (Servidor Local)...");
        
        // 1. Navegar e Esperar o Carregamento
        await driver.get(URL_PAGINA_CADASTRO);
        console.log(`Página carregada: ${URL_PAGINA_CADASTRO}`);
        
        // ** ESPERA EXPLÍCITA E ROBUSTA **
        await driver.sleep(2000); // Pausa inicial para o JS da página começar a rodar

        console.log("Aguardando o campo de senha ('Senha') carregar...");
        const passwordField = await driver.wait(
            // Tenta localizar o input com ID='Senha' usando XPath
            until.elementLocated(By.xpath(`//input[@id='${ID_CAMPO_SENHA}']`)), 
            15000 // Aumenta o timeout para 15 segundos
        );
        
        console.log("Campo de senha encontrado.");
        
        // 2. PREENCHIMENTO BÁSICO
        await driver.findElement(By.id('Nome')).sendKeys('Teste Selenium');
        await driver.findElement(By.id('CPF')).sendKeys('12345678900');
        await driver.findElement(By.id('Email')).sendKeys('teste@selenium.com');

        // 3. DIGITAR SENHA E VERIFICAR CHECKLIST
        const senhaForte = 'Sintonia@2025';
        await passwordField.sendKeys(senhaForte);
        console.log(`Senha digitada: "${senhaForte}"`);
        
        await driver.sleep(1000); // Espera para o JavaScript processar a validação

        // 4. VERIFICAÇÃO DO CHECKLIST VISUAL (Maiúscula)
        const uppercaseCheckElement = await driver.findElement(By.id(CHECKLIST_IDS.uppercase));
        const classesElemento = await uppercaseCheckElement.getAttribute('class');

        console.log(`\nVerificando Checklist (${CHECKLIST_IDS.uppercase}): ${classesElemento}`);

        if (classesElemento.includes(CLASSE_VALIDA_CHECKLIST)) {
            console.log("✅ CHECKLIST (Maiúscula): PASSOU! O requisito foi marcado como válido.");
        } else {
            console.error(`❌ CHECKLIST (Maiúscula): FALHOU! A classe '${CLASSE_VALIDA_CHECKLIST}' não foi encontrada. (Seu JS precisa adicionar a classe de validação)`);
            sucesso = false;
        }
        
        // 5. CONFIRMAR SENHA E SUBMETER
        await driver.findElement(By.id(ID_CAMPO_CONFIRMACAO)).sendKeys(senhaForte);
        console.log("Confirmação de senha preenchida.");

        await driver.findElement(By.id(ID_BOTAO_SUBMIT)).click();
        console.log("Botão 'Cadastrar' clicado.");
        
        // Aqui você pode adicionar lógica para verificar a URL de destino
        // await driver.wait(until.urlContains('/sucesso'), 5000); 

    } catch (error) {
        console.error("\n🛑 Ocorreu um erro catastrófico no Selenium:", error.message);
        sucesso = false;
    } finally {
        await driver.sleep(3000); 
        
        if (sucesso) {
            console.log("\n*** TESTE CONCLUÍDO COM SUCESSO. ***");
        } else {
            console.log("\n*** TESTE CONCLUÍDO COM FALHA. ***");
        }
        
        await driver.quit(); 
    }
}

testCadastroPsicologo();