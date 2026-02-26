const Announcement = require("../models/Announcement");
const City = require("../models/City");
const Country = require("../models/Country");
const User = require("../models/User");
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");
const View = require("../models/View");
const Notification = require("../models/Notification")
const Search = require("../models/Search");
const { sendNotificationToUser } = require("../utils/fcm");

exports.modifierUneAnnonceKilo = async (req, res) => {
  
  
    try{
      
          let body = req.body; 
          const {_id} = req.body; 

          delete body._id; 

          await Announcement.updateOne({_id}, {$set: body}); 

          res.status(200).json({status: 0, message: 1}); 
      
      
    }catch(err){
      
        console.log(err); 
        res.status(500).json({err  })
    }
  
    
}


exports.ajouterUnConteneur = (req, res) => {
  
    res.status(200).json({status: 0, message: 1})
}

exports.avoirLesAnnonces = async (req, res) => {

  const startAt = req.body.startAt ? parseInt(req.body.startAt) : 0;

  try {
    const { status } = req.body;
    const filter = {
      active: true,
      status: status === "c" ? "container" : "kilos",
      dateOfDeparture: { $gte: new Date() },
    };

    // 🔹 Agrégation pour annonces + utilisateurs
    const result = await Announcement.aggregate([
      { $match: filter },
      {
        $addFields: { userObjectId: { $toObjectId: "$userId" } }, // convertir String → ObjectId
      },
      {
        $lookup: {
          from: "users",
          localField: "userObjectId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" }, // pour avoir un seul objet user
      {
        $facet: {
          total: [{ $count: "count" }],
          annonces: [
            { $sort: { date: -1 } },
            { $skip: startAt },
            { $limit: 10 },
          ],
        },
      },
    ]);

    const total = result[0]?.total[0]?.count || 0;
    const annonces = result[0]?.annonces || [];

    // 🔹 Enrichir avec les informations des villes
    const cityNames = [
      ...new Set([
        ...annonces.map((c) => c.startCity),
        ...annonces.map((c) => c.endCity),
      ]),
    ];

    const cities = await City.find({ name: { $in: cityNames } }).lean();
    const cityMap = new Map(cities.map((city) => [city.name, city]));

    annonces.forEach((annonce) => {
      annonce.startCity2 = cityMap.get(annonce.startCity) || null;
      annonce.endCity2 = cityMap.get(annonce.endCity) || null;
    });

    // 🔹 Réponse
    res.status(200).json({
      status: 0,
      annonces,
      total,
      startAt: annonces.length === 10 ? startAt + 10 : null,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err });
  }
};

/*
exports.addAnnouncementWithPdf = (req, res) => {
  
 
  const draft = [`${req.protocol}s://${req.get("host")}/pdf_documents/${req.file.filename}`];
  
   const dateOfDeparture = new Date(req.body.dateOfDeparture);  
  // Conversion de coords en objet JSON
  const coords = req.body.coords ? JSON.parse(req.body.coords) : null;
  
       const announcement = new Announcement({
        startCity: req.body.startCity, 
        endCity: req.body.endCity, 
        dateOfDeparture: dateOfDeparture, 
        draft,
        pieds: req.body.pieds,
        description: req.body.description, 
        userId: req.auth.userId, 
        status: "container", 
        date: new Date(), 
        active: false,
        coords: coords
    })
       
    announcement.save().then(() => {
      
      res.status(201).json({status: 0});
        
    }, (err) => {
      
        console.log(err); 
      res.status(505).json({err})
    })
      
  
}


exports.addAnnouncementWithImages = (req, res) => {
       // Vérification que req.files existe et est un tableau
    if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ error: 'Aucun fichier téléchargé' });
    }
  
  
      let draft = []; 
  
      for(let file of req.files){
        
          draft.push(`${req.protocol}s://${req.get("host")}/images/${file.filename}`)
      }
  
  const dateOfDeparture = new Date(req.body.dateOfDeparture);
  // Conversion de coords en objet JSON
  const coords = req.body.coords ? JSON.parse(req.body.coords) : null;
  
       const announcement = new Announcement({
       
        startCity: req.body.startCity, 
        endCity: req.body.endCity, 
        dateOfDeparture: dateOfDeparture, 
        draft,
        pieds: req.body.pieds,
        description: req.body.description, 
        userId: req.auth.userId, 
        status: "container", 
        date: new Date(), 
        active: false,
        coords: coords
        
    })
       
    announcement.save().then(() => {
      
      res.status(201).json({status: 0});
        
    }, (err) => {
      
        console.log(err); 
      res.status(505).json({err})
    })
  
      
}


exports.addAnnouncement = (req, res) => {
 
  if (req.body.status === "kilos") {
    

    // Convertir dateOfDeparture en objet Date
    const dateOfDeparture = new Date(req.body.dateOfDeparture);

    const announcement = new Announcement({
      startCity: req.body.startCity,
      endCity: req.body.endCity,
      startCity2: req.body.startCity2,
      endCity2: req.body.endCity2,
      dateOfDeparture: dateOfDeparture, // Convertir en Date
      kilosCount: req.body.kilosCount,
      kiloPrice: req.body.kiloPrice,
      company: req.body.company,
      description: req.body.description,
      pieds: req.body.pieds,
      userId: req.auth.userId,
      status: req.body.status,
      date: new Date(), // Date actuelle
      active: true,
      priceKilo: req.body.priceKilo || null, // Par défaut à null si non fourni
      coords: req.body.coords || null
    });

    announcement.save()
      .then(() => {
      
        res.status(201).json({ status: 0});
      
      })
      .catch((err) => {
        console.error("Erreur lors de la sauvegarde de l'annonce:", err);
        res.status(500).json({ error: err.message });
      });
  } else {
  }
}; */


exports.getAnnoncess = async (req, res) => {
  try {
    const currentDate = new Date();
    const limit = req.body.three ? 3 : 60;

    // Récupérer les annonces de conteneurs et de kilos
    const containers = await Announcement.find({
      active: true,
      status: "container",
      dateOfDeparture: { $gte: currentDate },
    })
      .sort({ date: 1 })
      .limit(limit);


    const kilos = await Announcement.find({
      active: true,
      status: "kilos",
      dateOfDeparture: { $gte: currentDate },
    })
      .sort({ date: -1 })
      .limit(limit);

    // Récupérer toutes les villes nécessaires
    const cityNames = [
      ...new Set([
        ...containers.map((c) => c.startCity),
        ...containers.map((c) => c.endCity),
        ...kilos.map((k) => k.startCity),
        ...kilos.map((k) => k.endCity),
      ]),
    ];

    const cities = await City.find({ name: { $in: cityNames } });
    const cityMap = new Map(cities.map((city) => [city.name, city]));

    // Ajouter les informations de ville aux conteneurs et kilos
    containers.forEach((container) => {
      container.startCity2 = cityMap.get(container.startCity);
      container.endCity2 = cityMap.get(container.endCity);
    });

    kilos.forEach((kilo) => {
      kilo.startCity2 = cityMap.get(kilo.startCity);
      kilo.endCity2 = cityMap.get(kilo.endCity);
    });

    // Répondre avec les données traitées
    res.status(200).json({ status: 0, kilos, containers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAnnoncee = async (req, res) => {
  try {
    const annonce = await Announcement.findOne({ _id: req.body.id, active: true }).lean();

    if(!annonce) return res.status(200).json({status: 1});

    // Fire-and-forget : tracking de vue (ne bloque pas la reponse)
    View.findOne({announcementId: req.body.id, phoneId: req.body.phoneId}).then(view => {
      if (!view) {
        new View({announcementId: req.body.id, phoneId: req.body.phoneId, date: new Date()}).save();
        Announcement.updateOne({_id: req.body.id}, {$inc: {views: 1}}).exec();
      }
    });

    annonce.views = (annonce.views || 0) + 1;

    const [startCity2, endCity2, user, sum] = await Promise.all([
      City.findOne({name: annonce.startCity}).lean(),
      City.findOne({name: annonce.endCity}).lean(),
      User.findOne({_id: annonce.userId}).select('-password').lean(),
      Announcement.countDocuments({userId: annonce.userId, active: true}),
    ]);

    annonce.startCity2 = startCity2;
    annonce.endCity2 = endCity2;

    res.status(200).json({ status: 0, annonce, sum, user });

  } catch (e) {
    console.log(e);
    res.status(505).json({ e });
  }
};

/*function monthNameToNumber(monthName) {
  const monthNames = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];

  const monthIndex = monthNames.indexOf(monthName.toLowerCase());
  return monthIndex >= 0 ? monthIndex + 1 : null;
}

*/

exports.annoncesRecherche = async (req, res) => {
  let month = monthNameToNumber(req.body.month);
  let year = req.body.year;

  let startDate;
  if (year === new Date().getFullYear() && month - 1 === new Date().getMonth()) {
    startDate = new Date();
  } else {
    startDate = new Date(year, month - 1, 1);
  }
  const endDate = new Date(year, month, 1);

  try {
    let start = req.body.start;
    let end = req.body.end;
    let finalStartCities;
    let finalEndCities;

    if(req.body.type === "container"){
      const [startCountry, endCountry] = await Promise.all([
        Country.findOne({name: start}).lean(),
        Country.findOne({name: end}).lean(),
      ]);

      const [startCities, endCities] = await Promise.all([
        City.find({country_id: startCountry._id}).lean(),
        City.find({country_id: endCountry._id}).lean(),
      ]);

      finalStartCities = [...startCities.map(item => item.name), start];
      finalEndCities = [...endCities.map(item => item.name), end];
    }

    const query = {
      startCity: req.body.type === 'container' ? {$in: finalStartCities} : req.body.start,
      endCity: req.body.type === 'container' ? {$in: finalEndCities} : req.body.end,
      dateOfDeparture: { $gte: startDate, $lt: endDate },
      status: req.body.type,
      active: true,
    };

    const [annoncesCount, annonces] = await Promise.all([
      Announcement.countDocuments(query),
      Announcement.find(query).sort({date: 1}).skip(req.body.startAt).limit(10).lean(),
    ]);

    const cityNames = [...new Set([...annonces.map(a => a.startCity), ...annonces.map(a => a.endCity)])];
    const cities = await City.find({name: {$in: cityNames}}).lean();
    const cityMap = new Map(cities.map(c => [c.name, c]));
    annonces.forEach(a => {
      if (a.status === 'container') {
        a.startCity2 = cityMap.get(a.startCity) || { name: a.startCity, country: a.startCity, code: '' };
        a.endCity2 = cityMap.get(a.endCity) || { name: a.endCity, country: a.endCity, code: '' };
      } else {
        a.startCity2 = cityMap.get(a.startCity) || null;
        a.endCity2 = cityMap.get(a.endCity) || null;
      }
    });

    if(annonces.length === 0){
      const newSearch = Search({
        startCity: req.body.start,
        endCity: req.body.end,
        month,
        year,
        status: req.body.type,
        userId: req.auth.userId,
        date: new Date()
      })
      await newSearch.save();
    }

    res.status(200).json({
      status: 0,
      annonces,
      count: annoncesCount,
      startAt: annonces.length === 10 ? parseInt(req.body.startAt) + 10 : null,
    });
  } catch (e) {
    console.log(e);
    res.status(505).json({ e });
  }
};

//version admin

exports.getValidAnnouncements = async (req, res) => {
  try {
    // Récupérer la date actuelle
    const currentDate = new Date();

    // Trouver toutes les annonces avec une date de départ valide
    const validAnnouncements = await Announcement.find({
      dateOfDeparture: { $gt: currentDate }, // Filtrer les annonces avec une date de départ future
    });

    res.status(200).json({
      status: 0,
      announcements: validAnnouncements,
      message: "Annonces valides récupérées avec succès",
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des annonces valides :",
      error
    );
    res.status(500).json({
      status: 1,
      message: "Erreur lors de la récupération des annonces valides",
      error,
    });
  }
};

exports.getFalseContainer = async (req, res) => {
  try {
    const currentDate = new Date(); // Date actuelle

    // Récupérer les annonces avec status "container", active à false, et date de départ valide
    const inactiveContainers = await Announcement.find({
      status: "container",
      active: false,
      dateOfDeparture: { $gt: currentDate }, // Vérifie que la date est future
    });

    res.status(200).json({
      status: 0,
      announcements: inactiveContainers,
      message:
        "Annonces inactives 'container' avec des dates valides récupérées avec succès",
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des annonces inactives :",
      error
    );
    res.status(500).json({
      status: 1,
      message: "Erreur lors de la récupération des annonces inactives",
      error,
    });
  }
};

exports.getFalseKilo = async (req, res) => {
  try {
    const currentDate = new Date(); // Date actuelle

    // Récupérer les annonces avec status "kilos", active à false, et date de départ valide
    const inactiveKilo = await Announcement.find({
      status: "kilos",
      active: false,
      dateOfDeparture: { $gt: currentDate }, // Vérifie que la date est future
    });

    res.status(200).json({
      status: 0,
      announcements: inactiveKilo,
      message:
        "Annonces inactives 'kilos' avec des dates valides récupérées avec succès",
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des annonces inactives :",
      error
    );
    res.status(500).json({
      status: 1,
      message: "Erreur lors de la récupération des annonces inactives",
      error,
    });
  }
};

exports.getConversionRate = async (req, res) => {
  try {
    // Récupérer le nombre total d'utilisateurs
    const totalUsers = await User.countDocuments();

    // Récupérer le nombre d'utilisateurs ayant posté au moins une annonce
    const usersWithAnnouncements = await Announcement.distinct("userId");

    // Calculer le taux de conversion
    const conversionRate =
      totalUsers > 0
        ? ((usersWithAnnouncements.length / totalUsers) * 100).toFixed(2)
        : 0;

    res.status(200).json({
      status: 0,
      conversionRate: `${conversionRate}`,
      totalUsers,
      usersWithAnnouncements: usersWithAnnouncements.length,
      message: "Taux de conversion calculé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors du calcul du taux de conversion :", error);
    res.status(500).json({
      status: 1,
      message: "Erreur lors du calcul du taux de conversion",
      error,
    });
  }
};

exports.toggleActiveStatus = async (req, res) => {
  try {
    const { id } = req.body;

    // Vérifier si l'ID est fourni
    if (!id) {
      return res.status(400).json({
        status: 1,
        message: "L'identifiant de l'annonce est requis.",
      });
    }

    // Utiliser `findByIdAndUpdate` pour réduire le nombre d'opérations
    const announcement = await Announcement.findById(id);

    // Vérifier si l'annonce existe
    if (!announcement) {
      return res.status(404).json({
        status: 1,
        message: "Annonce non trouvée.",
      });
    }

    const update = {};
    if (announcement.active) {
      // Si active est true, on le passe à false et on ajoute locked
      update.active = false;
      update.locked = true;
    } else {
      // Si active est false, on le passe à true et on retire locked
      update.active = true;
      update.$unset = { locked: "" }; // Utiliser $unset pour supprimer `locked`
    }

    // Appliquer les modifications
    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      id,
      update,
      { new: true } // Retourner l'objet mis à jour
    );

    res.status(200).json({
      status: 0,
      message: "Statut 'active' mis à jour avec succès.",
      announcement: updatedAnnouncement,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut 'active' :", error);
    res.status(500).json({
      status: 1,
      message: "Erreur lors de la mise à jour du statut 'active'.",
      error,
    });
  }
};

exports.addAnnouncementWithPdf = async (req, res) => {
  
  
  try{
  const draft = [
    `${req.protocol}s://${req.get("host")}/pdf_documents/${req.file.filename}`,
  ];

  const dateOfDeparture = new Date(req.body.dateOfDeparture);
    
    
  // Conversion de coords en objet JSON
  const coords = req.body.coords ? JSON.parse(req.body.coords) : null;

  const announcement = new Announcement({
    startCity: req.body.startCity,
    endCity: req.body.endCity,
    dateOfDeparture: dateOfDeparture,
    draft,
    pieds: req.body.pieds,
    description: req.body.description,
    userId: req.auth.userId,
    fileName: req.body.fileName, 
    fileType: req.body.fileType,
    status: "container",
    date: new Date(),
    active: false,
    coords: coords,
    bookingReference: req.body.bookingReference || null,
  });
    
 
    
      
    
  announcement.save().then(
    async (annoncee) => {
      
      res.status(201).json({ status: 0 });
    },
    (err) => {
      console.log(err);
      res.status(505).json({ err });
    }
  );
    
  }catch(err){
    
      console.log(err); 
      
  }
}; 

exports.modifierAnnonceImage = async (req, res) => {
  
     
  
      try{
              if ((!req.files || !Array.isArray(req.files)) && !req.file) {
                return res.status(400).json({ error: "Aucun fichier téléchargé" });
            }


            let draft = [];
        
              
        
            if(req.file){
              
              
                draft.push(`${req.protocol}s://${req.get("host")}/pdf_documents/${req.file.filename}`);
               
              
            }else{
              
              
              for (let file of req.files) {
                draft.push(`${req.protocol}s://${req.get("host")}/images/${file.filename}`);
              }
              
              
              
            }


        
            let body = req.body; 
            const {_id} = req.body; 
           
        
            body = {...body, active: false, draft, modifyDate: new Date()}
        
        
            delete body._id; 
        
            await Announcement.updateOne({_id}, {$set: body}); 
        
            res.status(200).json({status: 0})

      }catch(err){
        
          console.log(err); 
          res.status(505).json({err})
      }
  

}

exports.addAnnouncementWithImages = (req, res) => {
  // Vérification que req.files existe et est un tableau
  if (!req.files || !Array.isArray(req.files)) {
    return res.status(400).json({ error: "Aucun fichier téléchargé" });
  }


  let draft = [];

  for (let file of req.files) {
    draft.push(`${req.protocol}s://${req.get("host")}/images/${file.filename}`);
  }

  const dateOfDeparture = new Date(req.body.dateOfDeparture);
  // Conversion de coords en objet JSON
  const coords = req.body.coords ? JSON.parse(req.body.coords) : null;

  const announcement = new Announcement({
    startCity: req.body.startCity,
    endCity: req.body.endCity,
    dateOfDeparture: dateOfDeparture,
    draft,
    pieds: req.body.pieds,
    description: req.body.description,
    userId: req.auth.userId,
    status: "container",
    fileName: req.body.fileName, 
    fileType: req.body.fileType,
    date: new Date(),
    active: false,
    coords: coords,
    bookingReference: req.body.bookingReference || null,
  });

  announcement.save().then(
    () => {
      res.status(201).json({ status: 0 });
    },
    (err) => {
      console.log(err);
      res.status(505).json({ err });
    }
  );
};

exports.addAnnouncement = (req, res) => {
  
  if (req.body.status === "kilos") {

    // Convertir dateOfDeparture en objet Date
    const dateOfDeparture = new Date(req.body.dateOfDeparture);
    

    const announcement = new Announcement({
      startCity: req.body.startCity,
      endCity: req.body.endCity,
      startCity2: req.body.startCity2,
      endCity2: req.body.endCity2,
      dateOfDeparture: dateOfDeparture, // Convertir en Date
      kilosCount: req.body.kilosCount,
      kiloPrice: req.body.kiloPrice,
      company: req.body.company,
      description: req.body.description,
      pieds: req.body.pieds,
      userId: req.auth.userId,
      status: req.body.status,
      date: new Date(), // Date actuelle
      active: true,
      devise: req.body.devise,
      priceKilo: req.body.priceKilo || null, // Par défaut à null si non fourni
      coords: req.body.coords || null,
    });

    announcement
      .save()
      .then(async (annoncee) => {
      
      
          const search = await Search.findOne({startCity: req.body.startCity, endCity: req.body.endCity, status: "kilos",
          year: new Date(dateOfDeparture).getFullYear().toString(), $or: [{month: (new Date(dateOfDeparture).getMonth()).toString()}, {month: (new Date(dateOfDeparture).getMonth() + 1).toString()}]});

      
      
  if(search){
    
      const userr = await User.findOne({_id: search.userId});
     
      
      const newNotif = Notification({
        
        title: "Bonne nouvelle", 
        body: "Un container correspondant à une de vos recherche a été trouvé", 
        date: new Date(), 
        read: false, 
        view: false,
        receiverId: userr._id, 
        authorId: "grouping", 
        annonceId: annoncee._id
      })
      
      await newNotif.save();

     const badgee = await Notification.countDocuments({read: false, receiverId: userr._id})

      await sendNotificationToUser(userr._id, "Bonne nouvelle", "Un container correspondant à une de vos recherche a été trouvé", badgee, {annonceId: String(annoncee._id), "status": `1`, "badge": `${badgee}`});

  }

        res.status(201).json({ status: 0 });
      })
      .catch((err) => {
        console.error("Erreur lors de la sauvegarde de l'annonce:", err);
        res.status(500).json({ error: err.message });
      });
  } else {
  }
};

exports.getAnnouncementsById = async (req, res) => {
  try {
    const userId = req.auth.userId;

    const [, , containers, kilos] = await Promise.all([
      Announcement.updateMany({userId, active: true}, {$set: {read: true}}),
      Notification.updateMany({receiverId: userId, title: "Félicitations"}, {$set: {read: true}}),
      Announcement.find({userId, active: true, status: "container"}).sort({date: -1}).limit(6).lean(),
      Announcement.find({userId, active: true, status: "kilos"}).sort({date: -1}).limit(6).lean(),
    ]);

    const cityNames = [...new Set([
      ...containers.map(c => c.startCity), ...containers.map(c => c.endCity),
      ...kilos.map(k => k.startCity), ...kilos.map(k => k.endCity),
    ])];
    const cities = await City.find({name: {$in: cityNames}}).lean();
    const cityMap = new Map(cities.map(c => [c.name, c]));

    containers.forEach(c => {
      c.startCity2 = cityMap.get(c.startCity) || { name: c.startCity, country: c.startCity, code: '' };
      c.endCity2 = cityMap.get(c.endCity) || { name: c.endCity, country: c.endCity, code: '' };
    });
    kilos.forEach(k => { k.startCity2 = cityMap.get(k.startCity) || null; k.endCity2 = cityMap.get(k.endCity) || null; });

    res.status(200).json({
      status: 0,
      kilos,
      containers,
      startAt: containers.length == 6 ? 6 : null,
      startBt: kilos.length == 6 ? 6 : null,
    });
  } catch (err) {
    console.log(err);
    res.status(505).json({ err });
  }
};

exports.moreAnnouncements = async (req, res) => {
  try {
    const annonces = await Announcement.find({
      userId: req.auth.userId,
      active: true,
      status: req.body.status,
    })
      .sort({ date: -1 })
      .skip(req.body.skip)
      .limit(6)
      .lean();

    const cityNames = [...new Set([...annonces.map(a => a.startCity), ...annonces.map(a => a.endCity)])];
    const cities = await City.find({name: {$in: cityNames}}).lean();
    const cityMap = new Map(cities.map(c => [c.name, c]));
    annonces.forEach(a => {
      if (a.status === 'container') {
        a.startCity2 = cityMap.get(a.startCity) || { name: a.startCity, country: a.startCity, code: '' };
        a.endCity2 = cityMap.get(a.endCity) || { name: a.endCity, country: a.endCity, code: '' };
      } else {
        a.startCity2 = cityMap.get(a.startCity) || null;
        a.endCity2 = cityMap.get(a.endCity) || null;
      }
    });

    res.status(200).json({
      status: 0,
      annonces,
      skip: annonces.length === 6 ? parseInt(req.body.skip) + 6 : null,
      z: annonces.length,
    });
  } catch (e) {
    console.log(e);
    res.status(505).json({ e });
  }
};


exports.getAnnonces = async (req, res) => {
  try {
    const currentDate = new Date();
    const limit = req.body.three ? 3 : 60;

    // 1️⃣ Récupérer les annonces de conteneurs et de kilos
    const [containers, kilos] = await Promise.all([
      Announcement.find({active: true, status: "container", dateOfDeparture: { $gte: currentDate }}).sort({date: -1}).limit(limit).lean(),
      Announcement.find({active: true, status: "kilos", dateOfDeparture: { $gte: currentDate }}).sort({date: -1}).limit(limit).lean(),
    ]);

    // 2️⃣ Récupérer toutes les villes nécessaires
    const cityNames = [
      ...new Set([
        ...containers.map(c => c.startCity),
        ...containers.map(c => c.endCity),
        ...kilos.map(k => k.startCity),
        ...kilos.map(k => k.endCity),
      ]),
    ];
    const cities = await City.find({ name: { $in: cityNames } }).lean();
    const cityMap = new Map(cities.map(c => [c.name, c]));

    containers.forEach(c => {
      c.startCity2 = cityMap.get(c.startCity) || { name: c.startCity, country: c.startCity, code: '' };
      c.endCity2 = cityMap.get(c.endCity) || { name: c.endCity, country: c.endCity, code: '' };
    });
    kilos.forEach(k => {
      k.startCity2 = cityMap.get(k.startCity) || null;
      k.endCity2 = cityMap.get(k.endCity) || null;
    });

    // 3️⃣ Récupérer tous les utilisateurs des annonces
    const allUserIds = [
      ...new Set([...containers.map(c => c.userId), ...kilos.map(k => k.userId)])
    ];

    const users = await User.find({ _id: { $in: allUserIds } }).select('-password').lean();
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    containers.forEach(c => { c.user = userMap.get(c.userId) || null; });
    kilos.forEach(k => { k.user = userMap.get(k.userId) || null; });

    res.status(200).json({ status: 0, kilos, containers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


exports.getAnnonce = async (req, res) => {
  try {
    const annonce = await Announcement.findOne({ _id: req.body.id }).lean();

    const [startCity2, endCity2, user, sum] = await Promise.all([
      City.findOne({name: annonce.startCity}).lean(),
      City.findOne({name: annonce.endCity}).lean(),
      User.findOne({_id: annonce.userId}).select('-password').lean(),
      Announcement.countDocuments({userId: annonce.userId, active: true}),
    ]);

    if (annonce.status === 'container') {
      annonce.startCity2 = startCity2 || { name: annonce.startCity, country: annonce.startCity, code: '' };
      annonce.endCity2 = endCity2 || { name: annonce.endCity, country: annonce.endCity, code: '' };
    } else {
      annonce.startCity2 = startCity2;
      annonce.endCity2 = endCity2;
    }

    res.status(200).json({ status: 0, annonce, sum, user });
  } catch (e) {
    console.log(e);
    res.status(505).json({ e });
  }
};

function monthNameToNumber(monthName) {
  const monthNames = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ];

  const monthIndex = monthNames.indexOf(monthName.toLowerCase());
  return monthIndex >= 0 ? monthIndex + 1 : null;
}

/*
exports.annoncesRecherche = async (req, res) => {
  


  let month = monthNameToNumber(req.body.month);
  let year = req.body.year;

  let startDate;


  if (
    year === new Date().getFullYear() &&
    month - 1 === new Date().getMonth()
  ) {
    startDate = new Date();
  } else {
    startDate = new Date(year, month - 1, 1);
  }

  const endDate = new Date(year, month, 1);

  try {
    const annoncesCount = await Announcement.countDocuments({
      startCity: req.body.start,
      endCity: req.body.end,
      dateOfDeparture: {
        $gte: startDate,
        $lt: endDate,
      },
      status: req.body.type,
      active: true,
    });

    const annonces = await Announcement.find({
      startCity: req.body.start,
      endCity: req.body.end,
      dateOfDeparture: {
        $gte: startDate,
        $lt: endDate,
      },
      status: req.body.type,
      active: true,
    })
      .sort({ date: 1 })
      .skip(req.body.startAt)
      .limit(10);

    for (let kilo of annonces) {
      kilo.startCity2 = await City.findOne({ name: kilo.startCity });
      kilo.endCity2 = await City.findOne({ name: kilo.endCity });
    }
    
    if(annonces.length === 0){
      
        const newSearch = Search({
           startCity: req.body.start,
            endCity: req.body.end,
            month,
            year,
            status: req.body.type,
            userId: req.auth.userId, 
            date: new Date()
        })
        
        await newSearch.save();
    }

    res.status(200).json({
      status: 0,
      annonces,
      count: annoncesCount,
      startAt: annonces.length === 10 ? parseInt(req.body.startAt) + 10 : null,
    });

  } catch (e) {
    console.log(e);
    res.status(505).json({ e });
  }
}; 
*/
//version admin

exports.getValidAnnouncements = async (req, res) => {
  try {
    // Récupérer la date actuelle
    const currentDate = new Date();

    // Trouver toutes les annonces avec une date de départ valide
    const validAnnouncements = await Announcement.find({
      dateOfDeparture: { $gt: currentDate }, // Filtrer les annonces avec une date de départ future
    });

    res.status(200).json({
      status: 0,
      announcements: validAnnouncements,
      message: "Annonces valides récupérées avec succès",
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des annonces valides :",
      error
    );
    res.status(500).json({
      status: 1,
      message: "Erreur lors de la récupération des annonces valides",
      error,
    });
  }
};

exports.getFalseContainer = async (req, res) => {
  try {
    const currentDate = new Date(); // Date actuelle

    // Récupérer les annonces avec status "container", active à false, et date de départ valide
    const inactiveContainers = await Announcement.find({
      status: "container",
      active: false,
      dateOfDeparture: { $gt: currentDate }, // Vérifie que la date est future
    });

    res.status(200).json({
      status: 0,
      announcements: inactiveContainers,
      message:
        "Annonces inactives 'container' avec des dates valides récupérées avec succès",
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des annonces inactives :",
      error
    );
    res.status(500).json({
      status: 1,
      message: "Erreur lors de la récupération des annonces inactives",
      error,
    });
  }
};

exports.getFalseKilo = async (req, res) => {
  try {
    const currentDate = new Date(); // Date actuelle

    // Récupérer les annonces avec status "kilos", active à false, et date de départ valide
    const inactiveKilo = await Announcement.find({
      status: "kilos",
      active: false,
      dateOfDeparture: { $gt: currentDate }, // Vérifie que la date est future
    });

    res.status(200).json({
      status: 0,
      announcements: inactiveKilo,
      message:
        "Annonces inactives 'kilos' avec des dates valides récupérées avec succès",
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des annonces inactives :",
      error
    );
    res.status(500).json({
      status: 1,
      message: "Erreur lors de la récupération des annonces inactives",
      error,
    });
  }
};

exports.getConversionRate = async (req, res) => {
  try {
    // Récupérer le nombre total d'utilisateurs
    const totalUsers = await User.countDocuments();

    // Récupérer le nombre d'utilisateurs ayant posté au moins une annonce
    const usersWithAnnouncements = await Announcement.distinct("userId");

    // Calculer le taux de conversion
    const conversionRate =
      totalUsers > 0
        ? ((usersWithAnnouncements.length / totalUsers) * 100).toFixed(2)
        : 0;

    res.status(200).json({
      status: 0,
      conversionRate: `${conversionRate}`,
      totalUsers,
      usersWithAnnouncements: usersWithAnnouncements.length,
      message: "Taux de conversion calculé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors du calcul du taux de conversion :", error);
    res.status(500).json({
      status: 1,
      message: "Erreur lors du calcul du taux de conversion",
      error,
    });
  }
};



exports.toggleActiveStatus = async (req, res) => {
  try {
    const { id, transitaire } = req.body;

    // Vérifier si l'ID est fourni
    if (!id) {
      return res.status(400).json({
        status: 1,
        message: "L'identifiant de l'annonce est requis.",
      });
    }

    // Utiliser `findByIdAndUpdate` pour réduire le nombre d'opérations
    const announcement = await Announcement.findById(id);

    // Vérifier si l'annonce existe
    if (!announcement) {
      return res.status(404).json({
        status: 1,
        message: "Annonce non trouvée.",
      });
    }

    const update = {};
    if (announcement.active) {
      // Si active est true, on le passe à false et on ajoute locked
      update.active = false;
      update.locked = true;
    } else {
      // Si active est false, on le passe à true et on retire locked
      update.active = true;
      update.$unset = { locked: "" }; // Utiliser $unset pour supprimer `locked`

      // Ajouter le transitaire si fourni
      if (transitaire) {
        update.transitaire = transitaire;
      }
      
      const user = await User.findOne({_id: announcement.userId}); 
      
        const search = await Search.findOne({startCity: announcement.startCity, endCity: announcement.endCity, status: announcement.status,
          year: new Date(announcement.dateOfDeparture).getFullYear().toString(), $or: [{month: new Date(announcement.dateOfDeparture).getMonth().toString()}, {month: (new Date(announcement.dateOfDeparture).getMonth() + 1).toString()}]});

      
      
  if(search){

      const userr = await User.findOne({_id: search.userId});
      const badgee = await Notification.countDocuments({read: false, receiverId: userr._id})

      const newNotif = Notification({
        title: "Bonne nouvelle",
        body: "Un container correspondant à une de vos recherche a été trouvé",
        date: new Date(),
        read: false,
        view: false,
        receiverId: userr._id,
        authorId: "grouping",
        annonceId: announcement._id
      })

      await newNotif.save();

      try {
        await sendNotificationToUser(userr._id, "Bonne nouvelle", "Un container correspondant à une de vos recherche a été trouvé", badgee, {annonceId: String(announcement._id), "status": `1`, "badge": `${badgee}`});
      } catch (pushErr) {
        console.error("Erreur push notification (recherche):", pushErr.message);
      }

  }
      const newNotification = Notification({

          title: "Félicitations",
          body: "L'annonce sur votre conteneur est désormais active et visible pour tous. Retrouvez là dans vos annonces",
          date: new Date(),
          read: false,
          view: false,
          authorId: "grouping",
          receiverId: user._id
      })

      await newNotification.save();

      const badge = await Notification.countDocuments({receiverId: user._id, read: false});

      try {
        await sendNotificationToUser(user._id, "Félicitations",
          "L'annonce sur votre conteneur est désormais active et visible pour tous. Retrouvez-la dans vos annonces",
          badge, {"status": `0`, "badge": `${badge}`});
      } catch (pushErr) {
        console.error("Erreur push notification (activation):", pushErr.message);
      }

    }

    // Appliquer les modifications
    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      id,
      update,
      { new: true } // Retourner l'objet mis à jour
    );

    res.status(200).json({
      status: 0,
      message: "Statut 'active' mis à jour avec succès.",
      announcement: updatedAnnouncement,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut 'active' :", error);
    res.status(500).json({
      status: 1,
      message: "Erreur lors de la mise à jour du statut 'active'.",
      error,
    });
  }
};

exports.updateTransitaire = async (req, res) => {
  try {
    const { id, transitaire } = req.body;

    if (!id || !transitaire) {
      return res.status(400).json({
        status: 1,
        message: "L'identifiant de l'annonce et le nom du transitaire sont requis.",
      });
    }

    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      id,
      { transitaire: transitaire.trim() },
      { new: true }
    );

    if (!updatedAnnouncement) {
      return res.status(404).json({
        status: 1,
        message: "Annonce non trouvée.",
      });
    }

    res.status(200).json({
      status: 0,
      message: "Transitaire mis à jour avec succès.",
      announcement: updatedAnnouncement,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du transitaire :", error);
    res.status(500).json({
      status: 1,
      message: "Erreur lors de la mise à jour du transitaire.",
      error,
    });
  }
};
