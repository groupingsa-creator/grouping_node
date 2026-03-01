const Like = require("../models/Like");

exports.toggleLike = async (req, res) => {
  try {
    const { announcementId } = req.body;
    const userId = req.auth.userId;

    const existing = await Like.findOne({ announcementId, userId });

    if (existing) {
      await Like.deleteOne({ _id: existing._id });
      const count = await Like.countDocuments({ announcementId });
      return res.status(200).json({ status: 0, liked: false, count });
    }

    await new Like({ announcementId, userId, date: new Date() }).save();
    const count = await Like.countDocuments({ announcementId });
    res.status(200).json({ status: 0, liked: true, count });
  } catch (error) {
    console.error("Erreur toggleLike:", error);
    res.status(500).json({ status: 1, message: "Erreur serveur" });
  }
};

exports.getLikeStatus = async (req, res) => {
  try {
    const { announcementId } = req.body;
    const userId = req.auth.userId;

    const liked = await Like.findOne({ announcementId, userId });
    const count = await Like.countDocuments({ announcementId });

    res.status(200).json({ status: 0, liked: !!liked, count });
  } catch (error) {
    console.error("Erreur getLikeStatus:", error);
    res.status(500).json({ status: 1, message: "Erreur serveur" });
  }
};

exports.getLikeCounts = async (req, res) => {
  try {
    const { announcementIds } = req.body;
    const userId = req.auth.userId;

    const counts = await Like.aggregate([
      { $match: { announcementId: { $in: announcementIds } } },
      { $group: { _id: "$announcementId", count: { $sum: 1 } } },
    ]);

    const userLikes = await Like.find({
      announcementId: { $in: announcementIds },
      userId,
    }).select("announcementId");

    const userLikedSet = new Set(userLikes.map((l) => l.announcementId));
    const countsMap = {};
    counts.forEach((c) => {
      countsMap[c._id] = { count: c.count, liked: userLikedSet.has(c._id) };
    });

    res.status(200).json({ status: 0, likes: countsMap });
  } catch (error) {
    console.error("Erreur getLikeCounts:", error);
    res.status(500).json({ status: 1, message: "Erreur serveur" });
  }
};
