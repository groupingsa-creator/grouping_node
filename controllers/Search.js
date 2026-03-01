const Search = require("../models/Search");

exports.addSearch = async (req, res) => {
  try {
    const { startCity, endCity, month, year, status } = req.body;

    const search = new Search({
      startCity,
      endCity,
      month,
      year,
      status,
      userId: req.auth.userId,
      date: new Date(),
      done: false,
    });

    await search.save();
    res.status(201).json({ status: 0 });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la recherche :', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

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