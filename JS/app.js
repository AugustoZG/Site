// Importações
const express = require('express');
const { engine } = require('express-handlebars');
const fileUpload = require('express-fileupload');
const session = require('express-session');
const mysql = require('mysql2');
const path = require('path');
const { log } = require('console');

const app = express();

// Configurações básicas
const PORT = 8080;
const SESSION_SECRET = 'admin';

// Middleware
app.use(fileUpload());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({ secret: SESSION_SECRET, resave: false, saveUninitialized: true }));

// Configuração do Handlebars
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', '../views');

// Arquivos estáticos
const staticFolders = {
    '/bootstrap': '../node_modules/bootstrap/dist',
    '/css': '../CSS',
    '/Imagens': '../Imagens',
    '/Imagens/Enviadas': '../Imagens/Enviadas',
    '/Imagens/Notes': '../Imagens/Notes'
};
Object.entries(staticFolders).forEach(([route, folder]) => app.use(route, express.static(folder)));

// Conexão com o banco de dados
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'G@T0PR3T0o',
    database: 'projeto_site'
});
// Conectar ao banco de dados caso de erro
connection.connect((erro) => {
    if (erro) {
        console.error('Erro ao conectar ao banco de dados:', erro);
        process.exit(1);
    }
    console.log('Conectado ao banco de dados');
});

// Função utilitária para verificar autenticação
const requireAuth = (req, res, next) => {
    if (!req.session.user) return res.redirect('/logar');
    next();
};

// Rotas
app.get('/logar', (req, res) => {
    res.render('cadastros/logar', { style: 'padrao.css', title: 'Login' });
});

app.get('/cadastrar', (req, res) => {
    res.render('cadastros/cadastrar', { style: 'padrao.css', title: 'Cadastrar' });
});

app.get('/helloscreen', requireAuth, (req, res) => {
    res.render('telas/helloscreen', {
        style: 'padrao.css',
        title: 'Home',
        nome: req.session.user.nome,
        imagem: req.session.user.imagem,
        isAdmin: req.session.user.nome === 'admin'
    });
});

app.get('/adminlist', requireAuth, (req, res) => {
    const sql = "SELECT * FROM users WHERE name != 'admin'";

    connection.query(sql, (error, users) => {
        if (error) return res.status(500).send('Erro ao buscar usuários.');

        res.render('telas/adminlist', {
            style: 'admin.css',
            title: 'Admin',
            users,
            nome: req.session.user.nome,
            imagem: req.session.user.imagem,
            isAdmin: req.session.user.nome === 'admin'
        });
    });
});

app.get('/notes', requireAuth, (req, res) => {

    let sqlS;
    if (req.session.user.nome == 'admin'){
        sqlS = 'select * from notes ORDER BY id';  
    }else{
        sqlS = 'SELECT * FROM notes where (idUser = ' + req.session.user.idUser + ') or (idUser is null) ORDER BY id';
    }

    const sql = sqlS; 
    connection.query(sql, (error, notes) => {
        if (error) return res.status(500).send('Erro ao buscar notas.');

        res.render('cadastros/notes', {
            style: 'padrao.css',
            title: 'Notes',
            notes,
            nome: req.session.user.nome,
            imagem: req.session.user.imagem,
            isAdmin: req.session.user.nome === 'admin'
        });
    });
});

app.post('/notes', requireAuth, (req, res) => {
    const { title, description, colorFont, colorbackground} = req.body;
    const imagem = req.files?.imagem;
    const isPublic = req.body.ckPublic === 'true';
    const userId = isPublic ? null : req.session.user.idUser;
    if (!title || !description || !imagem) {
        return res.render('cadastros/notes', { mensagem: 'Preencha todos os campos.' });
    }

    const caminhoImagem = path.join('../Imagens/Notes', imagem.name);

    connection.query(
        'INSERT INTO notes (title, description, imagem, colorFont, colorBackground, idUser) VALUES (?, ?, ?, ?, ?, ?)',

        [title, description, caminhoImagem, colorFont, colorbackground, userId],
        (error) => {
            if (error) return res.status(500).send('Erro ao cadastrar nota.');

            imagem.mv(caminhoImagem, (err) => {
                if (err) return res.status(500) .send('Erro ao salvar imagem.');
                res.redirect('/notes');
            });
        }
    );
});

app.post('/cadastrar', (req, res) => {
    const { nome, email, senha } = req.body;
    const imagem = req.files?.imagem;

    if (!nome || !email || !senha || !imagem) {
        return res.render('cadastros/cadastrar', { mensagem: 'Preencha todos os campos.' });
    }

    const name = nome.toLowerCase().trim();
    const caminhoImagem = path.join('../Imagens/Enviadas', imagem.name);

    connection.query('SELECT * FROM users WHERE name = ?', [name], (error, results) => {
        if (error) return res.status(500).send('Erro ao verificar usuário.');

        if (results.length > 0) {
            return res.render('cadastros/cadastrar', { mensagem: 'Usuário já existe.' });
        }

        connection.query('INSERT INTO users (name, email, password, imagem) VALUES (?, ?, ?, ?)',
            [name, email, senha, imagem.name],
            (error) => {
                if (error) return res.status(500).send('Erro ao cadastrar usuário.');

                imagem.mv(caminhoImagem, (err) => {
                    if (err) return res.status(500).send('Erro ao salvar imagem.');
                    res.redirect('/logar');
                });
            }
        );
    });
});

app.post('/logar', (req, res) => {
    const { nome, senha } = req.body;

    connection.query('SELECT * FROM users WHERE name = ? AND password = ?', [nome, senha], (error, results) => {
        if (error || results.length === 0) {
            return res.render('cadastros/logar', { mensagem: 'Usuário ou senha inválidos.' });
        }

        req.session.user = {
            idUser: results[0].id,
            nome: results[0].name,
            imagem: results[0].imagem
        };

        res.redirect('/helloscreen');
    });
});

// Iniciar o servidor
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
