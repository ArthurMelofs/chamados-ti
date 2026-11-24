const path = require('path');
const express = require('express');
const authRoutes = require('./routes/authRoutes');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const { DataTypes } = require('sequelize');
const { sequelize } = require('./models');
const routes = require('./routes');
const locals = require('./middlewares/locals');
const seed = require('./seeders/seed');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(locals);

// Rotas
app.use(authRoutes);
app.use(routes);

// Página não encontrada
app.use((req, res) => {
  res.status(404).render('404', {
    title: 'Página não encontrada'
  });
});

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).render('error', {
    title: 'Erro',
    error: err
  });
});

// Inicialização do servidor
(async () => {
  try {
    await sequelize.sync();

    // Atualização da tabela de chamados
    const queryInterface = sequelize.getQueryInterface();

    const colunas = await queryInterface.describeTable('chamados');

    if (!colunas.usuarioUid) {
      await queryInterface.addColumn('chamados', 'usuarioUid', {
        type: DataTypes.STRING(128),
        allowNull: true
      });

      console.log('Coluna usuarioUid adicionada com sucesso!');
    }

    await seed({ onlyIfEmpty: true });

    app.listen(PORT, () => {
      console.log(`\n  HelpDesk TI rodando em http://localhost:${PORT}\n`);
    });

  } catch (err) {
    console.error('Falha ao iniciar a aplicação:', err);
    process.exit(1);
  }
})();