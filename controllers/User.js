const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Au-dela de ce nombre d'essais rates, le code a 6 chiffres est invalide :
// sans cela il serait brute-forcable pendant toute sa duree de validite.
const MAX_CODE_ATTEMPTS = 5;
const Contact = require("../models/Contact");
const Announcement = require("../models/Announcement");
const Message = require("../models/Messages");
const Notification = require("../models/Notification");
const DeviceToken = require("../models/DeviceToken"); 

const transporter = nodemailer.createTransport({
  host: 'mail.groupingpro.com',
  secure: true, 
  port: 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }, 
  logger: true,
  debug: true,
});

 exports.contactUs = async (req, res) => {

    console.log(req.body); 

    const userName = req.body.name; 
    const userEmail = req.body.mail; 
    const message = req.body.message; 
    const object = req.body.object

    try{

      await transporter.sendMail({
        from: `"Grouping Contact" <noreply@groupingpro.com>`,
        to: "contacts@groupingpro.com",
        replyTo: userEmail, // <-- super important
        subject: `Contact - ${userName}`,
        html: `
          <p><b>Nom:</b> ${userName}</p>
          <p><b>Email:</b> ${userEmail}</p>
           <p><b>Objet:</b> ${object}</p>
          <p><b>Message:</b><br/>${message}</p>
        `,
      });
      
      const contact = new Contact({
          userId: req.auth.userId, 
          message, 
          object
      })

      await contact.save(); 

      res.status(201).json({status: 0, message: "Votre message nus a été transmis avec succès"});

    }catch(err){

      console.log(err); 
      res.status(505).json({err  })
    }

}

const sendResetCode = async (email, name, code) => {
  try {
    await transporter.sendMail({
      from: `"Grouping" <noreply@groupingpro.com>`,
      to: email,
      subject: "Code de réinitialisation de votre mot de passe Grouping",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a1a2e;">Réinitialisation de votre mot de passe</h2>
          <p>Bonjour <b>${name || ""}</b>,</p>
          <p>Saisissez ce code dans l'application Grouping pour choisir un nouveau mot de passe :</p>
          <p style="font-size: 28px; letter-spacing: 6px; font-weight: bold; color: #1a1a2e;">${code}</p>
          <p>Ce code est valable 30 minutes.</p>
          <p style="color: #888; font-size: 13px; margin-top: 30px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : votre mot de passe reste inchangé.</p>
          <p>Cordialement,<br><strong>L'équipe Grouping</strong></p>
        </div>
      `
    });
  } catch (err) {
    console.error("sendResetCode:", err);
  }
};


exports.goToEmail = async (req, res) => {
  const email = (req.body.email || "").toLowerCase().trim();

  if (!email) {
    return res.status(400).json({ status: 1, message: "Adresse e-mail requise." });
  }

  // Reponse volontairement identique dans tous les cas : on ne revele pas
  // si une adresse correspond a un compte.
  const genericResponse = { status: 0 };

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");

    await User.updateOne(
      { _id: user._id },
      { $set: { resetCode: code, resetCodeExpires: new Date(Date.now() + 30 * 60 * 1000), resetAttempts: 0 } }
    );

    await sendResetCode(user.email, user.name, code);

    res.status(200).json(genericResponse);
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: 1, message: "Erreur lors de l'envoi du code." });
  }
};

// Reinitialisation effective : exige le code recu par e-mail.
exports.resetPassword = async (req, res) => {
  const email = (req.body.email || "").toLowerCase().trim();
  const { code, password } = req.body;

  if (!email || !code || !password) {
    return res.status(400).json({ status: 1, message: "Email, code et nouveau mot de passe requis." });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ status: 1, message: "Le mot de passe doit contenir au moins 6 caractères." });
  }

  try {
    const user = await User.findOne({ email });

    const resetCodeValid =
      user &&
      user.resetCode &&
      user.resetCode === String(code).trim() &&
      user.resetCodeExpires &&
      user.resetCodeExpires >= new Date();

    if (!resetCodeValid) {
      if (user && user.resetCode) {
        const attempts = (user.resetAttempts || 0) + 1;

        if (attempts >= MAX_CODE_ATTEMPTS) {
          // Trop d'essais : on invalide le code, il faut en redemander un.
          await User.updateOne(
            { _id: user._id },
            { $set: { resetCode: null, resetCodeExpires: null, resetAttempts: 0 } }
          );
        } else {
          await User.updateOne({ _id: user._id }, { $set: { resetAttempts: attempts } });
        }
      }

      return res.status(400).json({ status: 1, message: "Code invalide ou expiré." });
    }

    const hash = await bcrypt.hash(password, 10);

    await User.updateOne(
      { _id: user._id },
      { $set: { password: hash, resetCode: null, resetCodeExpires: null, resetAttempts: 0 } }
    );

    res.status(200).json({ status: 0, message: "Mot de passe mis à jour." });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: 1, message: "Erreur lors de la réinitialisation." });
  }
};

exports.changeName = async (req, res) => {
  
    try{
      
      await User.updateOne({_id: req.auth.userId}, {$set: {name: req.body.name}}); 
      
      res.status(200).json({status: 0})
      
    }catch(err){
      
        console.log(err); 
        res.status(505).json({err})
    }
}

exports.changePhoto = async (req, res) => {
  
    try{
      
      
      let photo; 
      
      if(req.file){
      
        photo = req.file.path
          
      }
      
      await User.updateOne({_id: req.auth.userId}, {$set: {photo}})
      
     res.status(200).json({status: 0, photo});
      
    }catch(err){
      
        console.log(err); 
        res.status(505).json({err})
    }
    
}


 exports.updateFcmToken = async (req, res) => {

  console.log("On est prêt")

   try{

      const {fcmToken, deviceId} = req.body;

      // Rejeter les appels avec fcmToken ou deviceId manquant/vide
      if (!fcmToken || !deviceId) {
        return res.status(400).json({status: 1, message: "fcmToken et deviceId sont requis."});
      }

      const userId = req.auth.userId;

        const user = await User.findById(userId);

        if (!user) {
          return res.status(404).json({status: 1, message: "Utilisateur introuvable."});
        }

       user.fcmToken = user.fcmToken ? user.fcmToken : [];

       // Supprimer l'ancien token pour ce device ET supprimer les doublons de ce fcmToken sur d'autres devices
       user.fcmToken = user.fcmToken.filter(t => t.deviceId !== deviceId && t.fcmToken !== fcmToken);

       user.fcmToken.push({ fcmToken, deviceId });


       await user.save();

       res.status(200).json({status: 0, message: "Mise à jour effectuée avec succès", user});



   }catch(err){

       console.log(err);
       res.status(505).json({err})
   }

}
 
 
 

/**
 * Migration : initialise fcmToken à [] pour tous les users qui ont fcmToken undefined/null.
 * A appeler une seule fois via POST /api/user/migrateFcmTokens (protégé par auth).
 */
exports.migrateFcmTokens = async (req, res) => {
  try {
    const result = await User.updateMany(
      { $or: [{ fcmToken: { $exists: false } }, { fcmToken: null }] },
      { $set: { fcmToken: [] } }
    );

    res.status(200).json({
      status: 0,
      message: `Migration terminée. ${result.modifiedCount} utilisateur(s) mis à jour.`
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: 99, message: "Erreur lors de la migration", err });
  }
};

const genererCode = () => {
  var code = "";
  for (var i = 0; i < 4; i++) {
    code += Math.floor(Math.random() * 10); // Générer un chiffre aléatoire entre 0 et 9
  }
  return code;
};
const sendEmail = (email) => {
  const code = genererCode();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: "Grouping: Validation d'adresse email",
    html: `
    
    <html>  
       <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f0f0f0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #fff;
              border-radius: 10px;
              padding: 20px;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            h1 {
              color: #333;
            }
            p {
              color: #666;
            }
          </style>
        </head>
         <body>
          <div class="container">
            <h1>Validation par code OTP</h1>
            <p>Veuillez saisir le code ci-dessous dans l'application Grouping pour valider votre adresse email :</p>
            <h2>${code}</h2>
          </div>
        </body>
    </html>
  
  `,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);

      return false;
    } else {
      console.log("Email sent: " + info.response);
      return true;
    }
  });
};

exports.signInWithGoogle = (req, res) => {
  console.log(req.body);
  User.findOne({
    email: req.body.email,
  }).then(
    (user) => {
      if (user) {
        //delete user._id
        // Vérifier si l'utilisateur est bloqué
        if (user.locked) {
          return res.status(401).json({
            status: 0,
            message: "Utilisateur non autorisé, compte bloqué",
          });
        }

        res.status(201).json({
          status: 1,
          user: user,
          message: "Utilisateur connecté avec succès",
          token: jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET
          ),
        });
      } else {
        bcrypt.hash(req.body.password, 10).then(
          async (hash) => {
            const newUser = User({
              email: req.body.email,
              name: req.body.name,
              password: hash,
              date: new Date(),
              photo: req.body.photo,
            });

            const _id = await newUser.save().then(async (uss) => {
              return uss._id;
            });

            User.findOne({ _id }).then(
              (use) => {
                delete use._id;

                res.status(201).json({
                  status: 0,
                  user: use,
                  message: "Utilisateur ajouté avec succès",
                  token: jwt.sign(
                    { userId: _id },
                    process.env.JWT_SECRET
                  ),
                });
              },
              (err) => {
                res.status(505).json({ err });
              }
            );
          },
          (err) => {
            res.status(505).json({ err });
          }
        );
      }
    },
    (err) => {
      res.status(505).json({ err });
    }
  );
};

exports.signInWithGoogleAdmin = (req, res) => {
  console.log(req.body);

  // Recherche de l'utilisateur par email
  User.findOne({ email: req.body.email }).then(
    (user) => {
      // Si l'utilisateur existe
      if (user) {
        console.log(user);
        // Vérification du rôle dans l'objet utilisateur
        const allowedRoles = ["superUser", "admin1", "admin2"];
        console.log("Role utilisateur :", user.role);
        console.log("Rôles autorisés :", allowedRoles);

        if (
          req.body.typeconnexion === "admin" &&
          (!user.role || !allowedRoles.includes(user.role))
        ) {
          return res.status(401).json({
            status: 0,
            message: "Accès non autorisé pour ce rôle.",
          });
        }
        
        // Vérifier si l'utilisateur est bloqué
        if (user.locked) {
          return res.status(401).json({
            status: 0,
            message: "Utilisateur non autorisé, compte bloqué",
          });
        }

        // Si le rôle est valide ou si typeconnexion n'est pas "admin"
        res.status(201).json({
          status: 1,
          user: user,
          message: "Utilisateur connecté avec succès",
          token: jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET
          ),
        });
      } else {
        // Si typeconnexion est "admin" et l'utilisateur n'existe pas
        if (req.body.typeconnexion === "admin") {
          return res.status(401).json({
            status: 0,
            message: "Utilisateur non autorisé.",
          });
        }

        // Création d'un nouvel utilisateur si typeconnexion n'est pas "admin"
        bcrypt.hash(req.body.password, 10).then(
          async (hash) => {
            const newUser = new User({
              email: req.body.email,
              name: req.body.name,
              password: hash,
              date: new Date(),
              photo: req.body.photo,
            });

            const _id = await newUser.save().then(async (uss) => {
              return uss._id;
            });

            User.findOne({ _id }).then(
              (use) => {
                delete use._id;

                res.status(201).json({
                  status: 0,
                  user: use,
                  message: "Utilisateur ajouté avec succès",
                  token: jwt.sign(
                    { userId: _id },
                    process.env.JWT_SECRET
                  ),
                });
              },
              (err) => {
                res.status(505).json({ err });
              }
            );
          },
          (err) => {
            res.status(505).json({ err });
          }
        );
      }
    },
    (err) => {
      res.status(505).json({ err });
    }
  );
};

exports.signUpp = (req, res) => {
  User.findOne({ email: req.body.email }).then((user) => {
    if (user) {
      res.status(201).json({ status: 1, message: "Adresse déjà utilisée" });
    } else {
      bcrypt.hash(req.body.password, 10).then(
        async (hash) => {
          const newUser = User({
            email: req.body.email,
            name: req.body.name,
            password: hash,
            date: new Date(),
          });

          const _id = await newUser.save().then(async (uss) => {
            return uss._id;
          });

          User.findOne({ _id }).then(
            (use) => {
              delete use.password;

              res.status(201).json({
                status: 0,
                user: use,
                message: "Utilisateur ajouté avec succès",
                token: jwt.sign(
                  { userId: _id },
                  process.env.JWT_SECRET
                ),
              });
            },
            (err) => {
              res.status(505).json({ err });
            }
          );
        },
        (err) => {
          res.status(505).json({ err });
        }
      );
    }
  });
};

exports.Register = (req, res) => {
  console.log(req.body);
  const code = genererCode();

  User.findOne({ email: req.body.email }).then(
    (user) => {
      if (user) {
        res.status(201).json({ status: 1, message: "Adresse déjà utilisée" });
      } else {
        res.status(201).json({
          status: 0,
          message: "Email clean",
          code,
        });
      }
    },
    (err) => {
      console.log(err);
      res.status(500).json({ err });
    }
  );
};

exports.signUp = (req, res) => {
  User.findOne({ phone: req.body.email }).then(
    (user) => {
      if (user) {
        res.status(201).json({ status: 1, message: "Adresse déjà utilisée" });
      } else {
        bcrypt.hash(req.body.password, 10).then(
          async (hash) => {
            const newUser = User({
              email: req.body.email,
              name: req.body.name,
              password: hash,
              date: new Date(),
            });

            const _id = await newUser.save().then(async (uss) => {
              return uss._id;
            });

            res.status(201).json({
              status: 0,
              message: "Utilisateur ajouté avec succès",
              token: jwt.sign(
                { userId: _id },
                process.env.JWT_SECRET
              ),
            });
          },
          (err) => {
            res.status(505).json({ err });
          }
        );
      }
    },
    (err) => {
      res.status(505).json({ err });
    }
  );
};

exports.changePassword = (req, res) => {
  
                console.log("Le new pass", req.body.newPass);
              console.log("last", req.body.last);
  
  User.findOne({ _id: req.auth.userId }).then(
    (user) => {
      if (!user) {
        res.status(200).json({
          status: 1,
          message: "Utilisateur non trouvé",
        });
      }
      else {
        
        // Vérifier si l'utilisateur est bloqué
        if (user.locked) {
          return res.status(200).json({
            status: 1,
            message: "Utilisateur non autorisé, compte bloqué",
          });
        }
        bcrypt.compare(req.body.last, user.password).then(
          async (valid) => {
            if (!valid) {
              res.status(200).json({
                status: 1,
                message: "Ancien mot de passe incorrect",
              });
            } else {
 

              
            const hash =   await  bcrypt.hash(req.body.newPass, 10); 
              
              await User.updateOne({_id: user._id}, {$set: {password: hash}})

              res.status(200).json({
                status: 0,
              });
            }
          },
          (err) => {
            console.log(err);
            res.status(505).json({ err });
          }
        );
      }
    },
    (err) => {
      console.log(err);
      res.status(505).json({ err });
    }
  );
};

exports.signIn = (req, res) => {
  User.findOne({ email: req.body.email }).then(
    (user) => {
      if (!user) {
        res.status(200).json({
          status: 1,
          message: "Utilisateur et/ou mot de passe incorrect",
        });
      }
      else {
        
        // Vérifier si l'utilisateur est bloqué
        if (user.locked) {
          return res.status(200).json({
            status: 1,
            message: "Utilisateur non autorisé, compte bloqué",
          });
        }
        bcrypt.compare(req.body.password, user.password).then(
          (valid) => {
            if (!valid) {
              res.status(200).json({
                status: 1,
                message: "Utilisateur et/ou mot de passe incorrect",
              });
            } else {
              const _id = user._id;

              delete user._id;

              res.status(200).json({
                status: 0,
                user,
                token: jwt.sign(
                  { userId: _id },
                  process.env.JWT_SECRET
                ),
              });
            }
          },
          (err) => {
            console.log(err);
            res.status(505).json({ err });
          }
        );
      }
    },
    (err) => {
      console.log(err);
      res.status(505).json({ err });
    }
  );
};

exports.signInAdmin = (req, res) => {
  // Vérification du type de connexion
  if (req.body.typeconnexion && req.body.typeconnexion === "admin") {
    User.findOne({ email: req.body.email }).then(
      (user) => {
        // Si l'utilisateur n'existe pas
        if (!user) {
          return res.status(401).json({
            status: 1,
            message: "Utilisateur non trouvé ou non autorisé.",
          });
        }
        if(user.locked){
          return res.status(401).json({
            status: 1,
            message: "Utilisateur bloqué.",
          });
          
        }

        // Vérification du rôle de l'utilisateur
        const allowedRoles = ["superUser", "admin1", "admin2"];
        if (!user.role || !allowedRoles.includes(user.role)) {
          return res.status(403).json({
            status: 1,
            message: "Accès non autorisé pour ce rôle.",
          });
        }

        // Vérification du mot de passe
        bcrypt.compare(req.body.password, user.password).then(
          (valid) => {
            if (!valid) {
              return res.status(401).json({
                status: 1,
                message: "Utilisateur et/ou mot de passe incorrect",
              });
            }

            // Suppression de l'ID de l'utilisateur dans la réponse
            const _id = user._id;
            delete user._id;

            // Réponse avec l'utilisateur et le token
            return res.status(200).json({
              status: 0,
              user,
              token: jwt.sign(
                { userId: _id },
                process.env.JWT_SECRET
              ),
            });
          },
          (err) => {
            console.error(err);
            return res.status(500).json({ err });
          }
        );
      },
      (err) => {
        console.error(err);
        return res.status(500).json({ err });
      }
    );
  } else {
    return res.status(400).json({
      status: 1,
      message: "Type de connexion invalide ou non défini.",
    });
  }
};

exports.getAllUsers = (req, res) => {
  console.log(req.body);
  if (!req.body || !["superUser", "admin1", "admin2"].includes(req.body.role)) {
    return res.status(403).json({
      status: 1,
      message: "Accès non autorisé",
    });
  }

  User.find()
    .lean() // Convertir les documents Mongoose en objets JavaScript simples
    .then((users) => {
      // Supprimer le champ password pour chaque utilisateur
      const sanitizedUsers = users.map((user) => {
        delete user.password; // Supprime la clé 'password'
        return user;
      });

      res.status(200).json({
        status: 0,
        users: sanitizedUsers,
        message: "Liste des utilisateurs récupérée avec succès",
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({
        status: 1,
        message: "Erreur lors de la récupération des utilisateurs",
        error: err,
      });
    });
};

exports.appleInfo = (req, res) => {
  console.log(req.body);
  res.status(201).json({ status: 0, message: "Thank You!" });
};

exports.toggleLockStatus = async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: "ID utilisateur manquant." });
  }

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    // Vérification et mise à jour de la propriété 'locked'
    if (typeof user.locked === "undefined") {
      user.locked = true; // Ajout de la propriété si elle n'existe pas
    } else {
      user.locked = !user.locked; // Inversion de la valeur actuelle
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { locked: user.locked },
      { new: true } // Retourne l'utilisateur mis à jour
    );

    res.status(200).json({
      message: `Le statut 'locked' a été ${
        user.locked ? "activé" : "désactivé"
      }.`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut 'locked' :", error);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

exports.connectWithApple = async (req, res) => {
  try {
    if (req.body.email) {
      const user = await User.findOne({ email: req.body.email });

      if (user) {
        if (!user.appleId) {
          await User.updateOne(
            { _id: user._id },
            { $set: { appleId: req.body.appleId } }
          );
        }

        res.status(200).json({
          status: 0,
          user,
          token: jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET
          ),
        });
      } else {
        const newUser = User({
          email: req.body.email,
          name: req.body.name,
          appleId: req.body.appleId,
          date: new Date(),
        });

        const _id = await newUser.save().then(async (uss) => {
          return uss._id;
        });

        res.status(201).json({
          status: 0,
          message: "Utilisateur ajouté avec succès",
          token: jwt.sign(
            { userId: _id },
            process.env.JWT_SECRET
          ),
        });
      }
    } else {
      const user = await User.findOne({ appleId: req.body.appleId });

      if (user) {
        res.status(200).json({
          status: 0,
          user,
          token: jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET
          ),
        });
      } else {
        res
          .status(200)
          .json({ status: 2, message: "Email ou mot de passe incorrect" });
      }
    }
  } catch (e) {
    console.log(e);
    res.status(505).json({ err: e });
  }
};

exports.addUser = async (req, res) => {
  try {
    let draft = [];

    // Traitement des fichiers s'ils existent
    if (req.file) {
      
        draft.push(
          req.file.path
        );
      
    }

    const userId = req.auth.userId; // ID de l'utilisateur qui ajoute
    const { email, name, password, role } = req.body;

    // Vérifier les droits
    const adminUser = await User.findById(userId);
    if (
      !adminUser ||
      !["superUser", "admin1", "admin2"].includes(adminUser.role)
    ) {
      return res.status(403).json({
        status: 1,
        message: "Accès non autorisé.",
      });
    }

    // Vérifier si l'email est déjà utilisé
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        status: 1,
        message: "Cet email est déjà utilisé.",
      });
    }

      // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer un nouvel utilisateur
    const newUser = new User({
      email,
      name,
      password: hashedPassword,
      role: role || null,
      photo: draft[0] || null, // Utilise la première photo si présente, sinon null
      date: new Date(),
      addUserId: userId, // ID de l'utilisateur qui a ajouté
    });

    // Sauvegarde dans la base de données
    const savedUser = await newUser.save();

    res.status(201).json({
      status: 0,
      message: "Utilisateur ajouté avec succès.",
      user: savedUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: 1,
      message: "Erreur serveur.",
      error: err.message,
    });
  }
};


// ==================== PARRAINAGE / REFERRAL ====================

// Générer un code de parrainage unique (format: GRP-XXXXXX)
const generateReferralCode = async () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans I, O, 0, 1 pour éviter confusion
  let code;
  let exists = true;
  while (exists) {
    let random = '';
    for (let i = 0; i < 6; i++) {
      random += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    code = `GRP-${random}`;
    exists = await User.findOne({ referralCode: code });
  }
  return code;
};

// Récupérer le code de parrainage de l'utilisateur (le générer si nécessaire)
exports.getReferralCode = async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId);
    if (!user) {
      return res.status(404).json({ status: 1, message: "Utilisateur introuvable." });
    }

    // Si l'utilisateur n'a pas encore de code, en générer un
    if (!user.referralCode) {
      user.referralCode = await generateReferralCode();
      await user.save();
    }

    res.status(200).json({
      status: 0,
      referralCode: user.referralCode,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 1, message: "Erreur serveur." });
  }
};

// Appliquer un code de parrainage (lier le nouvel utilisateur à son parrain)
exports.applyReferral = async (req, res) => {
  try {
    const { referralCode } = req.body;

    if (!referralCode) {
      return res.status(400).json({ status: 1, message: "Code de parrainage requis." });
    }

    // Chercher le parrain
    const sponsor = await User.findOne({ referralCode: referralCode.trim().toUpperCase() });
    if (!sponsor) {
      return res.status(200).json({ status: 1, message: "Code de parrainage invalide." });
    }

    // Vérifier que l'utilisateur ne se parraine pas lui-même
    if (String(sponsor._id) === String(req.auth.userId)) {
      return res.status(200).json({ status: 1, message: "Vous ne pouvez pas utiliser votre propre code." });
    }

    // Vérifier que l'utilisateur n'a pas déjà un parrain
    const currentUser = await User.findById(req.auth.userId);
    if (!currentUser) {
      return res.status(404).json({ status: 1, message: "Utilisateur introuvable." });
    }

    if (currentUser.referredBy) {
      return res.status(200).json({ status: 1, message: "Vous avez déjà un parrain." });
    }

    // Lier le parrain
    currentUser.referredBy = sponsor._id;
    await currentUser.save();

    res.status(200).json({
      status: 0,
      message: "Parrainage enregistré avec succès.",
      sponsor: { name: sponsor.name },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 1, message: "Erreur serveur." });
  }
};

// Demande de suppression de compte (Google Play requirement)
// --- Suppression de compte -------------------------------------------------

// Supprime l'utilisateur et toutes les donnees qui lui sont rattachees.
const purgeUserData = async (user) => {
  const userId = user._id.toString();

  await Announcement.deleteMany({ userId });
  await Message.deleteMany({ $or: [{ user1Id: userId }, { user2Id: userId }] });
  await Notification.deleteMany({ $or: [{ receiverId: userId }, { authorId: userId }] });
  await DeviceToken.deleteMany({ userId });
  await User.updateMany({ referredBy: user._id }, { $set: { referredBy: null } });
  await User.findByIdAndDelete(user._id);
};

const sendDeletionDoneEmails = async (email, fullname, reason) => {
  await transporter.sendMail({
    from: '"Grouping" <noreply@groupingpro.com>',
    to: email,
    subject: "Confirmation de suppression de votre compte Grouping",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a2e;">Suppression de compte confirmée</h2>
        <p>Bonjour ${fullname},</p>
        <p>Nous vous confirmons que votre compte Grouping associé à l'adresse <strong>${email}</strong> a été supprimé avec succès.</p>
        <p>Les données suivantes ont été définitivement supprimées :</p>
        <ul>
          <li>Votre profil et informations personnelles</li>
          <li>Vos annonces (conteneurs et kilos)</li>
          <li>Vos messages et conversations</li>
          <li>Vos notifications</li>
          <li>Votre code de parrainage</li>
        </ul>
        <p style="color: #888; font-size: 13px; margin-top: 30px;">Si vous n'êtes pas à l'origine de cette demande, veuillez nous contacter immédiatement à contacts@groupingpro.com</p>
        <p>Cordialement,<br><strong>L'équipe Grouping</strong></p>
      </div>
    `
  });

  await transporter.sendMail({
    from: '"Grouping" <noreply@groupingpro.com>',
    to: "contacts@groupingpro.com",
    subject: `Suppression de compte - ${fullname}`,
    html: `
      <p><strong>Demande de suppression traitée automatiquement</strong></p>
      <p>Utilisateur : ${fullname}</p>
      <p>Email : ${email}</p>
      <p>Motif : ${reason || "Non spécifié"}</p>
      <p>Date : ${new Date().toLocaleString("fr-FR")}</p>
    `
  });
};

// Suppression depuis l'application : l'utilisateur est deja authentifie.
exports.deleteMyAccount = async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId);

    if (!user) {
      return res.status(404).json({ status: 1, message: "Compte introuvable." });
    }

    const { email, name } = user;

    await purgeUserData(user);

    if (email) {
      sendDeletionDoneEmails(email, name || email, req.body.reason)
        .catch((err) => console.error("Email suppression compte:", err));
    }

    res.status(200).json({ status: 0, message: "Compte supprimé avec succès." });
  } catch (err) {
    console.error("Erreur suppression compte:", err);
    res.status(500).json({ status: 1, message: "Erreur lors de la suppression du compte." });
  }
};

// Etape 1 (formulaire web) : on envoie un code de confirmation a l'adresse du compte.
// La reponse est volontairement identique que le compte existe ou non, pour ne pas
// permettre de tester si une adresse est inscrite.
exports.requestDeletion = async (req, res) => {
  const { email, fullname } = req.body;

  if (!email || !fullname) {
    return res.status(400).json({ status: 1, message: "Email et nom complet requis." });
  }

  const genericResponse = {
    status: 0,
    message: "Si un compte est associé à cette adresse, un code de confirmation vient d'y être envoyé."
  };

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");

    await User.updateOne(
      { _id: user._id },
      { $set: { deletionCode: code, deletionCodeExpires: new Date(Date.now() + 30 * 60 * 1000), deletionAttempts: 0 } }
    );

    await transporter.sendMail({
      from: '"Grouping" <noreply@groupingpro.com>',
      to: user.email,
      subject: "Code de confirmation - suppression de votre compte Grouping",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a1a2e;">Confirmez la suppression de votre compte</h2>
          <p>Bonjour ${user.name || fullname},</p>
          <p>Une demande de suppression de votre compte Grouping a été effectuée. Pour la confirmer, saisissez ce code :</p>
          <p style="font-size: 28px; letter-spacing: 6px; font-weight: bold; color: #1a1a2e;">${code}</p>
          <p>Ce code est valable 30 minutes.</p>
          <p style="color: #888; font-size: 13px; margin-top: 30px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : aucune donnée ne sera supprimée.</p>
          <p>Cordialement,<br><strong>L'équipe Grouping</strong></p>
        </div>
      `
    });

    res.status(200).json(genericResponse);
  } catch (err) {
    console.error("Erreur demande de suppression:", err);
    res.status(500).json({ status: 1, message: "Erreur lors de la demande de suppression." });
  }
};

// Etape 2 (formulaire web) : verification du code puis suppression effective.
exports.confirmDeletion = async (req, res) => {
  const { email, code, reason } = req.body;

  if (!email || !code) {
    return res.status(400).json({ status: 1, message: "Email et code de confirmation requis." });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    const deletionCodeValid =
      user &&
      user.deletionCode &&
      user.deletionCode === String(code).trim() &&
      user.deletionCodeExpires &&
      user.deletionCodeExpires >= new Date();

    if (!deletionCodeValid) {
      if (user && user.deletionCode) {
        const attempts = (user.deletionAttempts || 0) + 1;

        if (attempts >= MAX_CODE_ATTEMPTS) {
          await User.updateOne(
            { _id: user._id },
            { $set: { deletionCode: null, deletionCodeExpires: null, deletionAttempts: 0 } }
          );
        } else {
          await User.updateOne({ _id: user._id }, { $set: { deletionAttempts: attempts } });
        }
      }

      return res.status(400).json({ status: 1, message: "Code invalide ou expiré." });
    }

    const { email: userEmail, name } = user;

    await purgeUserData(user);

    sendDeletionDoneEmails(userEmail, name || email, reason)
      .catch((err) => console.error("Email suppression compte:", err));

    res.status(200).json({ status: 0, message: "Compte supprimé avec succès." });
  } catch (err) {
    console.error("Erreur suppression compte:", err);
    res.status(500).json({ status: 1, message: "Erreur lors de la suppression du compte." });
  }
};
