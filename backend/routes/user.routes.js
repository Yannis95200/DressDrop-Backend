const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const userController = require('../controllers/user.controller');

// Route pour l'enregistrement d'un utilisateur
router.post("/register", authController.signUp);

// Créez une fonction spécifique pour la connexion (login)
router.post("/login", authController.signIn);

// Route pour déconnexion
router.get('/logout', authController.logout);

// Route pour récupérer tous les utilisateurs
router.get('/', userController.getAllUsers);
router.get('/:id', userController.userInfo);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
