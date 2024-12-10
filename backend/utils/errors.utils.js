module.exports.signUpErrors = (err) => {
  let errors = { pseudo: '', email: '', password: '' };


  // Vérifie les messages d'erreur
  if (err.message.includes('pseudo')) {
    errors.pseudo = 'Pseudo incorrect ou déjà pris';
  }

  if (err.message.includes('email')) {
    errors.email = 'Email incorrect ou déjà utilisé';
  }

  if (err.message.includes('password')) {
    errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
  }



  // Vérifie les erreurs de duplication (code 11000)
  if (err.code === 11000) {
    if (err.keyValue.pseudo) {
      errors.pseudo = 'Ce pseudo est déjà enregistré';
    }
    if (err.keyValue.email) {
      errors.email = 'Cet email est déjà enregistré';
    }
  }

  return errors;
};


// Gere les erreur de connexion
module.exports.signInErrors = (err) => {
  let errors = {email: '', password: ''}

  if (err.message.includes("email"))
    errors.email = 'Email inconnu'


  if (err.message.includes('password'))
    errors.password = "le mots de passe ne correspond pas "

  return errors
}