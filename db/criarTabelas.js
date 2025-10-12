const { Pool } = require('pg');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

// Configuração do pool de conexão
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'admin',
  port: 5432,
});

// Função para criar tabelas
async function criarTabelas() {
  try {
    // Criação da tabela de usuários
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        cpf VARCHAR(14) UNIQUE NOT NULL,
        email TEXT UNIQUE,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Criação da tabela de credenciais
    await pool.query(`
      CREATE TABLE IF NOT EXISTS credenciais (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        login TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Criação da tabela de perfis
    await pool.query(`
      CREATE TABLE IF NOT EXISTS perfil_psicologos (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER UNIQUE NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        foto TEXT,
        crp TEXT UNIQUE,
        descricao TEXT,
        especialidade TEXT,
        abordagem TEXT,
        modalidade TEXT,
        celular TEXT,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Criação da tabela de sessões (para connect-pg-simple)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP NOT NULL
      )
    `);

    // Cria índice para a tabela de sessões
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_session_expire ON session (expire)
    `);

    console.log('✅ Tabelas verificadas/criadas com sucesso');
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    throw error;
  } finally {
    // Não encerre o pool aqui se for usar em outras partes da aplicação
    // await pool.end();
  }
}

// Exporte a função para poder chamá-la de outros arquivos
module.exports = {
  criarTabelas,
  pool // Exporte o pool se for necessário em outros módulos
};

// Para executar imediatamente quando o arquivo é chamado:
criarTabelas().catch(console.error);