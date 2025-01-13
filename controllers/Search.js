const Search = require("../models/Search");

exports.getSearch = async (req, res) => {
  try {
    // Filtre pour exclure les documents ayant status à true
    const data = await Search.find({ status: { $ne: true } });
    res.status(200).json(data); // Renvoie les données au client
  } catch (error) {
    console.error('Erreur lors de la récupération des données :', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};