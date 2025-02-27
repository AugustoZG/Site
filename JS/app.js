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
app.get('/', function(req, res) {
    res.render('registrar');
});

// Rota Principal cadastrar
app.post('/cadastrar', function(req, res) {
    console.log(req.body);
    console.log(req.files.imagem.name);

    req.files.imagem.mv('../Imagens/Enviadas/' + req.files.imagem.name);
    res.end();
});

app.listen(8080);