// importando modulo express
const express = require('express');

// Importando modulo express-handlebars
const { engine } = require('express-handlebars');

//importar modulo fileupload
const fileUpload = require('express-fileupload');

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
    res.render('registrar');
});

app.get('/helloscreen', function(req, res) {
    res.render('helloscreen');
})

// Rota Principal cadastrar
app.post('/cadastrar', function(req, res) {
    // enviar dados para a tabela do MySQL
    let name = req.body.nome;
    let email = req.body.email;
    let password = req.body.senha;
    let imagem = req.files.imagem.name;

    let sql = `INSERT INTO users(name, email, password, imagem) VALUES('${name}', '${email}', '${password}', '${imagem}')`;     
    
    
    connection.query(sql, function(erro,retorno) {
        if (erro) throw erro;

        req.files.imagem.mv('../Imagens/Enviadas/' + req.files.imagem.name);
        
        console.log(retorno);
    });
    // return para rota principal tela*

    app.get('/logar', function(req, res) {
        res.render('logar');
    });
    res.redirect('/logar');
    res.end();
});

app.post('/logar', function(req, res) {
    let nome = req.body.nome.trim();
    let password = req.body.senha;

    let sql = 'SELECT name, imagem FROM users WHERE name = ? AND password = ?';

    connection.query(sql, [nome, password], function(erro, retorno) {
        if (erro) {
            console.error('Erro na consulta:', erro);
            return res.status(500).send('Erro interno no servidor');
        }

        if (retorno.length > 0) {
            // Login bem-sucedido - Renderiza a tela e passa o nome
            return res.render('helloscreen', { nome: retorno[0].name, imagem: retorno[0].imagem });
        } else {
            // Login falhou
            return res.render('logar', { mensagem: 'Usuário ou senha inválidos' });
        }
    });
});

app.listen(8080);