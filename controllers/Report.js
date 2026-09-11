const Report = require("../models/Report");

exports.submitReport = async (req, res) => {
  try {
    const reporterId = req.auth.userId;
    const { reportedUserId, annonceId } = req.body;

    if (!reportedUserId || !annonceId) {
      return res.status(400).json({ status: 1, message: "Données manquantes" });
    }

    if (reporterId === reportedUserId) {
      return res.status(400).json({ status: 2, message: "Vous ne pouvez pas vous signaler vous-même" });
    }

    const existing = await Report.findOne({ reporterId, annonceId });
    if (existing) {
      return res.status(200).json({ status: 3, message: "Vous avez déjà signalé cette annonce" });
    }

    await Report.create({ reporterId, reportedUserId, annonceId });

    res.status(201).json({ status: 0 });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err });
  }
};

exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .sort({ date: -1 })
      .lean();

    res.status(200).json({ status: 0, reports });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err });
  }
};

exports.updateReportStatus = async (req, res) => {
  try {
    const { reportId, status } = req.body;

    if (!["reviewed", "dismissed"].includes(status)) {
      return res.status(400).json({ status: 1, message: "Statut invalide" });
    }

    await Report.updateOne({ _id: reportId }, { $set: { status, seen: true } });

    res.status(200).json({ status: 0 });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err });
  }
};

exports.countUnseen = async (req, res) => {
  try {
    const count = await Report.countDocuments({ seen: false });
    res.status(200).json({ status: 0, count });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err });
  }
};
