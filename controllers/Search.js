const Search = require("../models/Search");

exports.getSearch = async (req, res) => {
  try {
    // Filtre de requête pour extraire les données, ajustez selon vos besoins
    const { startCity, endCity, month, year, type, userId } = req.query;

    const filter = {};
    if (startCity) filter.startCity = startCity;
    if (endCity) filter.endCity = endCity;
    if (month) filter.month = month;
    if (year) filter.year = year;
    if (type) filter.type = type;
    if (userId) filter.userId = userId;

    // Récupération des données
    const data = await Search.find(filter);

    // Transformation en JSON avec les types adaptés
    const formattedData = data.map(item => ({
      _id: item._id,
      startCity: item.startCity,
      endCity: item.endCity,
      month: item.month,
      year: item.year,
      type: item.type,
      userId: item.userId,
      date: item.date.getTime(), // Conversion de la date en timestamp
      __v: item.__v,
    }));

    res.status(200).json(formattedData);
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};