// index.js

require('dotenv').config({ path: './captcha.env' });

const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const axios = require('axios'); // 👈 NOVO: Importa axios para requisições HTTP

const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);

const app = express();
const port = 3000;
const path = require('path');
const multer = require('multer');

// ---------------------------------------------------------------------
// CONSTANTES DO RECAPTCHA
// Pegas do arquivo captcha.env
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
// ---------------------------------------------------------------------

const upload = multer({
  dest: 'public/uploads/',
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;

    if ((ext === '.jpg' || ext === '.jpeg') && mime === 'image/jpeg') {
      cb(null, true);
    } else {
      cb(new Error('Somente arquivos JPG são permitidos!'));
    }
  }
});


// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Configuração do EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configuração do pool do PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '13022023',
  port: 5432,
});

// Configuração da sessão - 20 minutos de expiração
app.use(session({
  store: new PgSession({
    pool: pool,
    tableName: 'user_sessions',
    pruneSessionInterval: 60
  }),
  secret: 'umaChaveMuitoSecreta123',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1 * 60 * 1000,   // 1 minuto
    sameSite: 'lax'
  }
}));

// Função para criar tabelas
async function criarTabelas() {
  try {
    // Tabelas existentes para psicólogos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        cpf VARCHAR(14) UNIQUE NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS credenciais (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        login TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS perfil_psicologos (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER UNIQUE NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        foto TEXT,
        crp TEXT,
        descricao TEXT,
        especialidade TEXT,
        abordagem TEXT,
        modalidade TEXT,
        celular TEXT
      )
    `);

    // Tabelas para pacientes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pacientes (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        cpf VARCHAR(14) UNIQUE NOT NULL,
        data_nascimento DATE,
        genero VARCHAR(20),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS credenciais_pacientes (
        id SERIAL PRIMARY KEY,
        paciente_id INTEGER NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
        login TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS perfil_pacientes (
        id SERIAL PRIMARY KEY,
        paciente_id INTEGER UNIQUE NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
        foto TEXT,
        telefone TEXT,
        endereco TEXT,
        cidade TEXT,
        estado TEXT,
        cep TEXT,
        historico_medico TEXT
      )
    `);

    // Tabela para relacionamento entre psicólogos e pacientes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS psicologo_paciente (
        id SERIAL PRIMARY KEY,
        psicologo_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        paciente_id INTEGER NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
        data_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(psicologo_id, paciente_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS feedbacks (
        id SERIAL PRIMARY KEY,
        paciente_id INTEGER NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
        psicologo_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        atendimento_id INTEGER REFERENCES psicologo_paciente(id) ON DELETE SET NULL,
        nota INTEGER NOT NULL CHECK (nota BETWEEN 1 AND 5),
        comentario TEXT,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(paciente_id, psicologo_id, atendimento_id)
      )
    `);

    console.log('✅ Todas as tabelas foram verificadas/criadas com sucesso');
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    throw error;
  }
}

// Função para validar CPF
function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  let digitoVerificador1 = resto > 9 ? 0 : resto;

  if (parseInt(cpf.charAt(9)) !== digitoVerificador1) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  let digitoVerificador2 = resto > 9 ? 0 : resto;

  return parseInt(cpf.charAt(10)) === digitoVerificador2;
}

// Rotas públicas
app.get('/', (req, res) => {
  res.redirect('/home');
});

app.get('/home', async (req, res) => {
  try {
    const perfis = await pool.query(`
      SELECT p.*, u.nome 
      FROM perfil_psicologos p
      JOIN usuarios u ON p.usuario_id = u.id
    `);

    res.render('home', { perfis: perfis.rows });
  } catch (error) {
    console.error('Erro ao carregar perfis:', error);
    res.status(500).send('Erro ao carregar perfis');
  }
});

app.get('/login-paciente', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login-paciente.html'));
});

// Rotas de autenticação
// ---------------------------------------------------------------------
// ROTA DE CADASTRO DE PSICÓLOGO COM VERIFICAÇÃO RECAPTCHA
// ---------------------------------------------------------------------
app.post('/cadastrar', async (req, res) => {
  // Adicionado 'recaptcha' para extrair o token
  const { nome, cpf, login, confirmarLogin, senha, confirmarSenha, recaptcha } = req.body; 

  if (!recaptcha) {
    return res.status(400).json({ 
        error: 'missing-captcha', 
        message: 'Por favor, complete o reCAPTCHA.' 
    });
  }
    
  if (senha !== confirmarSenha) {
    return res.status(400).json({ error: 'As senhas não coincidem' });
  }

  // 1. VALIDAÇÃO RECAPTCHA
  try {
      const verificationResponse = await axios.post(RECAPTCHA_VERIFY_URL, null, {
          params: {
              secret: RECAPTCHA_SECRET_KEY,
              response: recaptcha,
          }
      });

      const { success } = verificationResponse.data;

      if (!success) {
          console.warn('Falha na verificação reCAPTCHA (Psicólogo):', verificationResponse.data['error-codes']);
          return res.status(401).json({ 
              error: 'captcha-failed',
              message: 'Falha na verificação de segurança. Tente o reCAPTCHA novamente.' 
          });
      }
  } catch (error) {
      console.error('Erro ao comunicar com a API do Google (Psicólogo):', error.message);
      return res.status(500).json({ 
          error: 'server-captcha-error',
          message: 'Erro interno do servidor durante a verificação de segurança.' 
      });
  }
  // FIM DA VALIDAÇÃO RECAPTCHA

  try {
    const senhaCriptografada = await bcrypt.hash(senha, 10);
    const usuario = await pool.query(
      'INSERT INTO usuarios (nome, cpf) VALUES ($1, $2) RETURNING id',
      [nome, cpf]
    );

    const usuarioId = usuario.rows[0].id;
    await pool.query(
      'INSERT INTO credenciais (usuario_id, login, senha) VALUES ($1, $2, $3)',
      [usuarioId, login, senhaCriptografada]
    );

    res.redirect('/login.html');
  } catch (error) {
    console.error('Erro ao cadastrar:', error);
    res.status(500).json({ error: 'Erro ao cadastrar. Talvez o CPF ou login já exista.' });
  }
});

app.post('/login', async (req, res) => {
  const { login, senha } = req.body;

  try {
    const resultado = await pool.query(
      `SELECT u.id, u.nome, c.senha 
       FROM credenciais c
       JOIN usuarios u ON u.id = c.usuario_id
       WHERE c.login = $1`,
      [login]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'user-not-found',
        message: 'Usuário não encontrado'
      });
    }

    const { id, nome, senha: senhaHash } = resultado.rows[0];
    const senhaValida = await bcrypt.compare(senha, senhaHash);

    if (!senhaValida) {
      return res.status(401).json({
        success: false,
        error: 'invalid-pass',
        message: 'Senha incorreta'
      });
    }

    req.session.regenerate((err) => {
      if (err) {
        console.error('Erro ao regenerar sessão:', err);
        return res.status(500).json({
          success: false,
          error: 'server-error',
          message: 'Erro no servidor'
        });
      }

      req.session.usuarioId = id;
      req.session.nomeUsuario = nome;
      req.session.tipoUsuario = 'psicologo';

      req.session.save((err) => {
        if (err) {
          console.error('Erro ao salvar sessão:', err);
          return res.status(500).json({
            success: false,
            error: 'server-error',
            message: 'Erro no servidor'
          });
        }

        res.json({
          success: true,
          userType: 'psicologo',  // Adiciona o tipo de usuário na resposta
          redirect: '/perfilpsicologo'
        });
      });
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      error: 'server-error',
      message: 'Erro no servidor'
    });
  }
});

// ---------------------------------------------------------------------
// ROTA DE CADASTRO DE PACIENTE COM VERIFICAÇÃO RECAPTCHA
// ---------------------------------------------------------------------
app.post('/cadastrar-paciente', async (req, res) => {
  // Adicionado 'recaptcha' para extrair o token
  const { nome, cpf, data_nascimento, genero, login, telefone, senha, confirmarSenha, recaptcha } = req.body; 

  // 1. Validação de Campos e CAPTCHA
  if (!nome || !cpf || !data_nascimento || !genero || !login || !telefone || !senha || !recaptcha) {
    return res.status(400).json({
      success: false,
      error: 'missing-fields',
      message: 'Todos os campos, incluindo o reCAPTCHA, são obrigatórios'
    });
  }

  if (senha !== confirmarSenha) {
    return res.status(400).json({
      success: false,
      error: 'password-mismatch',
      message: 'As senhas não coincidem'
    });
  }

  if (!validarCPF(cpf.replace(/\D/g, ''))) {
    return res.status(400).json({
      success: false,
      error: 'invalid-cpf',
      message: 'CPF inválido'
    });
  }

  // 2. VALIDAÇÃO RECAPTCHA
  try {
      const verificationResponse = await axios.post(RECAPTCHA_VERIFY_URL, null, {
          params: {
              secret: RECAPTCHA_SECRET_KEY,
              response: recaptcha, // O token enviado pelo formulário
          }
      });

      const { success } = verificationResponse.data;

      if (!success) {
          console.warn('Falha na verificação reCAPTCHA (Paciente):', verificationResponse.data['error-codes']);
          return res.status(401).json({ 
              success: false, 
              error: 'captcha-failed',
              message: 'Falha na verificação de segurança. Tente o reCAPTCHA novamente.' 
          });
      }
  } catch (error) {
      console.error('Erro ao comunicar com a API do Google (Paciente):', error.message);
      return res.status(500).json({ 
          success: false, 
          error: 'server-captcha-error',
          message: 'Erro interno do servidor durante a verificação de segurança.' 
      });
  }
  // FIM DA VALIDAÇÃO RECAPTCHA

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // O restante da lógica de inserção no banco de dados
    const cpfResult = await client.query(
      'SELECT id FROM pacientes WHERE cpf = $1',
      [cpf.replace(/\D/g, '')]
    );

    if (cpfResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'cpf-exists',
        message: 'CPF já cadastrado'
      });
    }

    const emailResult = await client.query(
      'SELECT id FROM credenciais_pacientes WHERE login = $1',
      [login]
    );

    if (emailResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'email-exists',
        message: 'E-mail já cadastrado'
      });
    }

    const pacienteInsert = await client.query(
      `INSERT INTO pacientes (nome, cpf, data_nascimento, genero) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [nome, cpf.replace(/\D/g, ''), data_nascimento, genero]
    );

    const pacienteId = pacienteInsert.rows[0].id;
    const senhaHash = await bcrypt.hash(senha, 10);

    await client.query(
      `INSERT INTO credenciais_pacientes (paciente_id, login, senha)
       VALUES ($1, $2, $3)`,
      [pacienteId, login, senhaHash]
    );

    await client.query(
      `INSERT INTO perfil_pacientes (paciente_id, telefone)
       VALUES ($1, $2)`,
      [pacienteId, telefone.replace(/\D/g, '')]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      redirect: '/login-paciente'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro na transação:', error);
    res.status(500).json({
      success: false,
      error: 'server-error',
      message: error.message
    });
  } finally {
    client.release();
  }
});

app.post('/login-paciente', async (req, res) => {
  const { login, senha } = req.body;

  try {
    const resultado = await pool.query(
      `SELECT p.id, p.nome, cp.senha 
       FROM credenciais_pacientes cp
       JOIN pacientes p ON p.id = cp.paciente_id
       WHERE cp.login = $1`,
      [login]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'user-not-found',
        message: 'Paciente não encontrado'
      });
    }

    const { id, nome, senha: senhaHash } = resultado.rows[0];
    const senhaValida = await bcrypt.compare(senha, senhaHash);

    if (!senhaValida) {
      return res.status(401).json({
        success: false,
        error: 'invalid-pass',
        message: 'Senha incorreta'
      });
    }

    req.session.regenerate((err) => {
      if (err) {
        console.error('Erro ao regenerar sessão:', err);
        return res.status(500).json({
          success: false,
          error: 'server-error',
          message: 'Erro no servidor'
        });
      }

      req.session.pacienteId = id;
      req.session.nomePaciente = nome;
      req.session.tipoUsuario = 'paciente';

      req.session.save((err) => {
        if (err) {
          console.error('Erro ao salvar sessão:', err);
          return res.status(500).json({
            success: false,
            error: 'server-error',
            message: 'Erro no servidor'
          });
        }

        res.json({
          success: true,
          redirect: '/perfilpaciente'
        });
      });
    });
  } catch (error) {
    console.error('Erro no login do paciente:', error);
    res.status(500).json({
      success: false,
      error: 'server-error',
      message: 'Erro no servidor'
    });
  }
});

// Rota de logout
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Erro ao destruir sessão:', err);
      return res.status(500).send('Erro ao sair');
    }
    res.clearCookie('connect.sid');
    res.redirect('/login.html');
  });
});

// Rotas protegidas - Psicólogo
app.get('/perfilpsicologo', async (req, res) => {
  if (!req.session.usuarioId || req.session.tipoUsuario !== 'psicologo') {
    return res.redirect('/login.html?error=no-session');
  }

  try {
    const usuario = await pool.query(
      'SELECT id, nome FROM usuarios WHERE id = $1',
      [req.session.usuarioId]
    );

    const perfil = await pool.query(
      'SELECT * FROM perfil_psicologos WHERE usuario_id = $1',
      [req.session.usuarioId]
    );

    res.render('perfilpsicologo', {
      usuario: usuario.rows[0],
      perfil: perfil.rows[0] || null
    });
  } catch (error) {
    console.error('Erro ao carregar perfil:', error);
    res.status(500).send('Erro ao carregar perfil');
  }
});

app.post('/salvar-perfil', (req, res) => {
  upload.single('foto')(req, res, async (err) => {
    if (err) {
      console.error('Erro de upload:', err.message);
      return res.status(400).send(`<h2 style="color:red; text-align:center;">${err.message}</h2>
                                   <p style="text-align:center;"><a href="/perfilpsicologo">Voltar</a></p>`);
    }

    if (!req.session.usuarioId || req.session.tipoUsuario !== 'psicologo') {
      return res.status(401).send('Não autorizado');
    }

    const { crp, descricao, especialidade, abordagem, modalidade, celular } = req.body;
    const fotoPath = req.file ? '/uploads/' + req.file.filename : null;

    try {
      const perfilExistente = await pool.query(
        'SELECT id FROM perfil_psicologos WHERE usuario_id = $1',
        [req.session.usuarioId]
      );

      if (perfilExistente.rows.length > 0) {
        await pool.query(
          `UPDATE perfil_psicologos SET 
           foto = COALESCE($1, foto),
           crp = $2,
           descricao = $3,
           especialidade = $4,
           abordagem = $5,
           modalidade = $6,
           celular = $7
           WHERE usuario_id = $8`,
          [fotoPath, crp, descricao, especialidade, abordagem, modalidade, celular, req.session.usuarioId]
        );
      } else {
        await pool.query(
          `INSERT INTO perfil_psicologos 
           (usuario_id, foto, crp, descricao, especialidade, abordagem, modalidade, celular)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [req.session.usuarioId, fotoPath, crp, descricao, especialidade, abordagem, modalidade, celular]
        );
      }

      res.redirect('/perfilpsicologo');
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      res.status(500).send('Erro ao salvar perfil');
    }
  });
});

// Rotas protegidas - Paciente
app.get('/perfilpaciente', async (req, res) => {
  if (!req.session.pacienteId || req.session.tipoUsuario !== 'paciente') {
    return res.redirect('/login-paciente?error=no-session');
  }

  try {
    // Obter dados básicos do paciente
    const pacienteResult = await pool.query(
      'SELECT id, nome FROM pacientes WHERE id = $1',
      [req.session.pacienteId]
    );

    if (pacienteResult.rows.length === 0) {
      return res.status(404).send('Paciente não encontrado');
    }

    const paciente = pacienteResult.rows[0];

    // Obter perfil do paciente
    const perfilResult = await pool.query(
      'SELECT * FROM perfil_pacientes WHERE paciente_id = $1',
      [req.session.pacienteId]
    );

    // Obter atendimentos do paciente
    const atendimentosResult = await pool.query(`
      SELECT pp.id, u.nome as psicologo_nome, pp.data_inicio 
      FROM psicologo_paciente pp
      JOIN usuarios u ON u.id = pp.psicologo_id
      WHERE pp.paciente_id = $1
      ORDER BY pp.data_inicio DESC
    `, [req.session.pacienteId]);

    res.render('perfilpaciente', {
      paciente: paciente,
      perfil: perfilResult.rows[0] || null,
      atendimentos: atendimentosResult.rows || [] // Garante que sempre tenha um array
    });
  } catch (error) {
    console.error('Erro ao carregar perfil do paciente:', error);
    res.status(500).send('Erro ao carregar perfil');
  }
});
app.get('/feedback', (req, res) => {
  if (!req.session.pacienteId || req.session.tipoUsuario !== 'paciente') {
    return res.redirect('/login-paciente?redirect=/feedback');
  }
  res.sendFile(path.join(__dirname, 'public', 'feedback.html'));
});

app.post('/salvar-feedback', async (req, res) => {
  if (!req.session.pacienteId || req.session.tipoUsuario !== 'paciente') {
    return res.status(401).json({ success: false, error: 'Não autorizado' });
  }

  const { psicologo_id, atendimento_id, nota, comentario } = req.body;

  try {
    // Verifica se o paciente teve atendimento com este psicólogo
    const atendimentoValido = await pool.query(
      `SELECT 1 FROM psicologo_paciente 
       WHERE id = $1 AND paciente_id = $2 AND psicologo_id = $3`,
      [atendimento_id, req.session.pacienteId, psicologo_id]
    );

    if (atendimentoValido.rowCount === 0) {
      return res.status(400).json({
        success: false,
        error: 'Você não teve atendimento com este psicólogo'
      });
    }

    await pool.query(
      `INSERT INTO feedbacks 
       (paciente_id, psicologo_id, atendimento_id, nota, comentario)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.session.pacienteId, psicologo_id, atendimento_id, nota, comentario]
    );

    res.json({ success: true, message: 'Feedback enviado com sucesso!' });

  } catch (error) {
    console.error('Erro ao salvar feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao enviar feedback'
    });
  }
});
app.get('/meus-feedbacks', async (req, res) => {
  if (!req.session.usuarioId || req.session.tipoUsuario !== 'psicologo') {
    return res.redirect('/login');
  }

  try {
    const feedbacks = await pool.query(
      `SELECT f.nota, f.comentario, f.criado_em, p.nome as paciente_nome
       FROM feedbacks f
       JOIN pacientes p ON p.id = f.paciente_id
       WHERE f.psicologo_id = $1
       ORDER BY f.criado_em DESC`,
      [req.session.usuarioId]
    );

    res.render('feedbacks-psicologo', { feedbacks: feedbacks.rows });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).send('Erro ao carregar feedbacks');
  }
});

// Verificar sessão do paciente
app.get('/verificar-sessao-paciente', (req, res) => {
  res.json({
    autenticado: req.session.pacienteId && req.session.tipoUsuario === 'paciente',
    pacienteId: req.session.pacienteId
  });
});

// Obter dados do atendimento
app.get('/dados-atendimento', async (req, res) => {
  if (!req.query.id || !req.query.paciente_id) {
    return res.status(400).json({ error: 'Parâmetros inválidos' });
  }

  try {
    const result = await pool.query(`
      SELECT pp.id, u.id as psicologo_id, u.nome as psicologo_nome, pp.data_inicio 
      FROM psicologo_paciente pp
      JOIN usuarios u ON u.id = pp.psicologo_id
      WHERE pp.id = $1 AND pp.paciente_id = $2
    `, [req.query.id, req.query.paciente_id]);

    res.json(result.rows[0] || null);
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});// Rota para listar pacientes (para o psicólogo selecionar quem ele atendeu)
app.get('/pacientes-disponiveis', async (req, res) => {
  if (!req.session.usuarioId || req.session.tipoUsuario !== 'psicologo') {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  try {
    // Lista pacientes que ainda não estão vinculados a este psicólogo
    const pacientes = await pool.query(`
      SELECT p.id, p.nome, p.cpf 
      FROM pacientes p
      WHERE p.id NOT IN (
        SELECT paciente_id 
        FROM psicologo_paciente 
        WHERE psicologo_id = $1
      )
    `, [req.session.usuarioId]);

    res.json({ success: true, pacientes: pacientes.rows });
  } catch (error) {
    console.error('Erro ao buscar pacientes:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});
// Rota para registrar que o psicólogo atendeu um paciente
// Rota para registrar que o psicólogo atendeu um paciente
app.post('/registrar-atendimento', async (req, res) => {
  if (!req.session.usuarioId || req.session.tipoUsuario !== 'psicologo') {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  const { pacienteId } = req.body;

  if (!pacienteId) {
    return res.status(400).json({ error: 'ID do paciente é obrigatório' });
  }

  try {
    // Verifica se o paciente existe
    const pacienteExiste = await pool.query(
      'SELECT id FROM pacientes WHERE id = $1',
      [pacienteId]
    );

    if (pacienteExiste.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    // Verifica se já existe um vínculo
    const vinculoExistente = await pool.query(
      'SELECT id FROM psicologo_paciente WHERE psicologo_id = $1 AND paciente_id = $2',
      [req.session.usuarioId, pacienteId]
    );

    if (vinculoExistente.rows.length > 0) {
      return res.status(400).json({ error: 'Você já atende este paciente' });
    }

    // Cria o vínculo e retorna o ID
    const novoVinculo = await pool.query(
      'INSERT INTO psicologo_paciente (psicologo_id, paciente_id) VALUES ($1, $2) RETURNING id',
      [req.session.usuarioId, pacienteId]
    );

    res.json({
      success: true,
      message: 'Atendimento registrado com sucesso!',
      atendimentoId: novoVinculo.rows[0].id
    });

  } catch (error) {
    console.error('Erro ao registrar atendimento:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});
// Rota para listar pacientes atendidos pelo psicólogo
app.get('/meus-pacientes-data', async (req, res) => {
  if (!req.session.usuarioId || req.session.tipoUsuario !== 'psicologo') {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  try {
    const pacientes = await pool.query(`
      SELECT p.id, p.nome, p.cpf, pp.data_inicio
      FROM psicologo_paciente pp
      JOIN pacientes p ON p.id = pp.paciente_id
      WHERE pp.psicologo_id = $1
      ORDER BY pp.data_inicio DESC
    `, [req.session.usuarioId]);

    res.json({ pacientes: pacientes.rows });
  } catch (error) {
    console.error('Erro ao carregar pacientes:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});
// Rota pública para dados do atendimento
app.get('/dados-atendimento-publico', async (req, res) => {
  if (!req.query.id) {
    return res.status(400).json({ error: 'ID do atendimento é obrigatório' });
  }

  try {
    const result = await pool.query(`
      SELECT pp.id, u.id as psicologo_id, u.nome as psicologo_nome, pp.data_inicio 
      FROM psicologo_paciente pp
      JOIN usuarios u ON u.id = pp.psicologo_id
      WHERE pp.id = $1
    `, [req.query.id]);

    res.json(result.rows[0] || null);
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Rota pública para listar feedbacks de um atendimento
app.get('/feedbacks-atendimento', async (req, res) => {
  if (!req.query.atendimento_id) {
    return res.status(400).json({ error: 'ID do atendimento é obrigatório' });
  }

  try {
    const result = await pool.query(`
      SELECT nota, comentario, criado_em
      FROM feedbacks
      WHERE atendimento_id = $1
      ORDER BY criado_em DESC
    `, [req.query.atendimento_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});
// Rota para obter todos os feedbacks
app.get('/todos-feedbacks', async (req, res) => {
  try {
    const result = await pool.query(`
            SELECT f.nota, f.comentario, f.criado_em, p.nome as paciente_nome
            FROM feedbacks f
            LEFT JOIN pacientes p ON p.id = f.paciente_id
            ORDER BY f.criado_em DESC
        `);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar feedbacks:', error);
    res.status(500).json({ error: 'Erro ao carregar feedbacks' });
  }
});
// Rota para obter os atendimentos do paciente autenticado (JSON)
app.get('/meus-atendimentos-json', async (req, res) => {
  if (!req.session.pacienteId || req.session.tipoUsuario !== 'paciente') {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  try {
    const atendimentos = await pool.query(`
      SELECT pp.id AS atendimento_id, u.id AS psicologo_id, u.nome AS psicologo_nome
      FROM psicologo_paciente pp
      JOIN usuarios u ON u.id = pp.psicologo_id
      WHERE pp.paciente_id = $1
      ORDER BY pp.data_inicio DESC
    `, [req.session.pacienteId]);

    res.json({ atendimentos: atendimentos.rows });
  } catch (error) {
    console.error('Erro ao buscar atendimentos:', error);
    res.status(500).json({ error: 'Erro ao buscar atendimentos' });
  }
});

// Iniciar servidor
criarTabelas().then(() => {
  app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
  });
}).catch(err => {
  console.error('Falha ao iniciar servidor:', err);
});