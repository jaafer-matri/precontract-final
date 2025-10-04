// server.js
require('dotenv').config();

const express   = require('express');
const cors      = require('cors');
const morgan    = require('morgan');
const mongoose  = require('mongoose');
const connectDB = require('./config/db');

const app = express();

/* ---------- Middlewares globaux ---------- */
const corsOptions = {
  origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

/* ---------- Routes de debug (optionnel) ---------- */
app.get('/_debug/status', (req, res) => {
  const required = ['MONGO_URI','JWT_SECRET','RESET_PASSWORD_KEY','CLIENT_URL','MAILGUN_DOMAIN','MAILGUN_API_KEY'];
  const missing = required.filter(k => !process.env[k]);
  res.json({
    envMissing: missing,                       // doit idéalement être []
    mongoReadyState: mongoose.connection.readyState // 1 = connecté
  });
});

app.post('/_email/test', async (req, res) => {
  try {
    const { sendMail } = require('./utils/mailer');
    const r = await sendMail({
      to: req.body.to,
      subject: 'Test Mailgun',
      text: 'OK',
      html: '<b>OK</b>'
    });
    res.json({ ok: true, result: r });
  } catch (e) {
    console.error('Email test error:', e);
    res.status(500).json({ error: e.message });
  }
});

/* ---------- Routes API ---------- */
app.use('/api/students', require('./routes/students'));
app.use('/api/schools', require('./routes/schools'));  // Routes pour les écoles
const precontractsRoutes = require('./routes/precontracts');
app.use('/api/precontracts', precontractsRoutes);
// Alias direct explicite pour compatibilité
const precontractsController = require('./controllers/precontractsControllers');
app.get('/api/precontrat/:id', precontractsController.getPreContract);
app.put('/api/precontrat/:id', precontractsController.updatePreContract);
app.use('/api/contracts', require('./routes/contracts'));
const emailRoutes = require('./routes/email');
app.use('/api', emailRoutes);
console.log('📮 Route email montée sur /api/send-email');

// Health at app level to validate wiring quickly
app.get('/api/send-email/health', (_req, res) => res.json({ ok: true, source: 'server.js' }));

/* ---------- Redirection publique vers le frontend ---------- */
// Exemple: http://localhost:3000/:idFiche  ->  http://localhost:4200/form/:idFiche
app.get('/:idFiche', (req, res, next) => {
  const { idFiche } = req.params;
  // Évite de prendre /_debug, /_email, etc.
  if (['api', '_debug', '_email', 'favicon.ico'].includes(idFiche)) return next();
  const target = `http://localhost:4200/form/${idFiche}`;
  res.redirect(302, target);
});



/* ---------- Handler d'erreurs global ---------- */
app.use((err, _req, res, _next) => {
  console.error('🔥 Unhandled error:', err);
  const dev = process.env.NODE_ENV !== 'production';
  res.status(500).json({ message: 'Erreur serveur.', ...(dev && { detail: err.message }) });
});

/* ---------- Démarrage après connexion DB ---------- */
const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await connectDB(); // attend la connexion
    console.log('✅ MongoDB connecté');
    app.listen(PORT, () => {
      console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Echec connexion MongoDB :', err);
    process.exit(1);
  }
})();

/* ---------- Sécurité process ---------- */
process.on('unhandledRejection', (reason) => {
  console.error('🧨 Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('🧨 Uncaught Exception:', err);
  process.exit(1);
});
