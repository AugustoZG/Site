// importando modulo express
const express = require('express');

// Importando modulo express-handlebars
const { engine } = require('express-handlebars');

//importar modulo fileupload
const fileUpload = require('express-fileupload');

// importando express session
const session = require('express-session');


//importando modulo mysql
const mysql = require('mysql2');

const app = express();

//habilitando upload de arquivos
app.use(fileUpload());

// adicionando Bootsrap
app.use('/bootstrap', express.static('../node_modules/bootstrap/dist'));

// Adicionando Css
app.use('/css', express.static('../CSS'));

// servindo imagens e outros arquivos estáticos
app.use('/Imagens', express.static('../Imagens'));

// criando seção para autenticar usuário
app.use(session({
    secret: 'admin', // Troque por algo seguro em produção
    resave: false,
    saveUninitialized: true
}));

// config do expreess-handlebars
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', '../views');

// manipulação de dados via rotas
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//config conexão
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'G@T0PR3T0o',
    database: 'projeto_site'
})

//test conection
connection.connect(function(erro){
    if (erro) throw erro;
    console.log('Conectado ao banco de dados');
})

// Rota Principal
app.get('/logar', function(req, res) {
    res.render('logar');
});

app.get('/cadastrar', function(req, res) {
    res.render('cadastrar');
});

app.get('/helloscreen', function(req, res) {
    res.render('helloscreen');
})

app.get('/adminlist', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/logar'); 
    }

    res.render('adminlist', {
        nome: req.session.user.nome,
        imagem: req.session.user.imagem
    });
});

// Rota Principal cadastrar
const path = require('path');

// Rota Principal cadastrar
app.post('/cadastrar', function(req, res) {
    // Obter dados do formulário
    let name = req.body.nome;
    let email = req.body.email;
    let password = req.body.senha;
    let imagem = req.files ? req.files.imagem : null;  // Verificar se o arquivo foi enviado

    // Verificar se algum campo está vazio
    if (!name || !email || !password || !imagem) {
        return res.render('cadastrar', { mensagem: 'É necessário preencher todos os campos' });  // Retorna resposta caso algum campo esteja vazio
    }

    // Verificar se o nome de usuário já existe no banco de dados
    let sqlVerificarUsuario = 'SELECT * FROM users WHERE name = ?';
    
    connection.query(sqlVerificarUsuario, [name], function(erro, resultados) {
        if (erro) {
            console.error('Erro ao verificar nome de usuário:', erro);
            return res.status(500).send('Erro ao verificar nome de usuário.');
        }

        if (resultados.length > 0) {
            return res.render('cadastrar', { mensagem: 'Usuário já cadastrado. Tente outro nome.' });
        }

        let caminhoImagem = path.join('../Imagens/Enviadas', imagem.name);

        // Inserir novo usuário no banco de dados
        let sqlInserirUsuario = 'INSERT INTO users(name, email, password, imagem) VALUES(?, ?, ?, ?)';
        
        connection.query(sqlInserirUsuario, [name, email, password, imagem.name], function(erro, retorno) {
            if (erro) {
                console.error('Erro ao inserir no banco:', erro);
                return res.status(500).send('Erro ao cadastrar usuário.');
            }

            imagem.mv(caminhoImagem, function(err) {
                if (err) {
                    console.error('Erro ao salvar imagem:', err);
                    return res.status(500).send('Erro ao salvar imagem.');
                }

                console.log('Usuário cadastrado:', retorno);
                return res.redirect('/logar');
            });
        });
    });
});


// app.post('/cadastrar', function(req, res) {
//     // Enviar dados para a tabela do MySQL
//     let name = req.body.nome;
//     let email = req.body.email;
//     let password = req.body.senha;
//     let imagem = req.files ? req.files.imagem : null;  // Verificar se o arquivo foi enviado

//     // Verificar se algum campo está vazio
//     if (!name || !email || !password || !imagem) {
//         return res.render('cadastrar', { mensagem: 'É necessário preencher todos os campos' });  // Retorna resposta caso algum campo esteja vazio
//     }

//     // Caminho para salvar a imagem
//     let caminhoImagem = path.join('../Imagens/Enviadas', imagem.name);

//     // Inserir no banco de dados
//     let sql = 'INSERT INTO users(name, email, password, imagem) VALUES(?, ?, ?, ?)';
    
//     connection.query(sql, [name, email, password, imagem.name], function(erro, retorno) {
//         if (erro) {
//             console.error('Erro ao inserir no banco:', erro);
//             return res.status(500).send('Erro ao cadastrar usuário.');
//         }

//         // Salvar a imagem no servidor
//         imagem.mv(caminhoImagem, function(err) {
//             if (err) {
//                 console.error('Erro ao salvar imagem:', err);
//                 return res.status(500).send('Erro ao salvar imagem.');
//             }

//             console.log('Usuário cadastrado:', retorno);
//             // Redirecionar para a tela de login após o cadastro
//             return res.redirect('/logar');
//         });
//     });
// });


app.post('/logar', function(req, res) {
    let nome = req.body.nome;
    let password = req.body.senha;

    let sql = 'SELECT name, imagem FROM users WHERE name = ? AND password = ?';

    connection.query(sql, [nome, password], function(erro, retorno) {
        if (erro) {
            console.error('Erro na consulta:', erro);
            return res.status(500).send('Erro interno no servidor');
        }

        if (retorno.length === 0) {
            return res.render('logar', { mensagem: 'Usuário ou senha inválidos' });
        }

        // Armazenar nome e imagem na sessão
        req.session.user = {
            nome: retorno[0].name,
            imagem: retorno[0].imagem
        };

        // Verificar se é admin e redirecionar
        if (nome === 'admin') {
            return res.redirect('/adminlist');
        } else {
            return res.render('helloscreen', {
                nome: retorno[0].name,
                imagem: retorno[0].imagem
            });
        }
    });
});

app.listen(8080);