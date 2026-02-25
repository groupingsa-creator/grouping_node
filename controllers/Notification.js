const Notification = require("../models/Notification");
const Message = require("../models/Messages");
const Announcement = require("../models/Announcement");


exports.viewNotifications = async (req, res) => {
  try {
    await Promise.all([
      Notification.updateMany({receiverId: req.auth.userId}, {$set: {view: true, read: true}}),
      Message.updateMany({user2Id: req.auth.userId, read: false}, {$set: {read: true}}),
    ]);

    res.status(200).json({status: 0});
  } catch(err) {
    console.log(err);
    res.status(505).json({err});
  }
}

exports.getNotReadNotifications = async(req, res) => {
    try {
      const userId = req.auth.userId;

      const [badges, messages, annonces] = await Promise.all([
        Notification.countDocuments({receiverId: userId, read: false}),
        Message.countDocuments({user2Id: userId, read: false}),
        Announcement.countDocuments({userId, read: false, active: true}),
      ]);

      res.status(201).json({status: 0, badges: parseInt(badges) + parseInt(messages), annonces});
    } catch(err) {
      console.log(err);
      res.status(505).json({err});
    }
}

exports.getNotifications = async (req, res) => {
  const startAt = req.body.startAt ? req.body.startAt : 0;
  const userId = req.auth.userId;

    try {
      const pipeline = [
      {
        $match: {
          user2Id: userId,
        },
      },
      {
        $sort: { date: -1 },
      },
      {
        $skip: startAt,
      },
     {
        $addFields: {
          user1ObjectId: { $toObjectId: "$user1Id" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user1ObjectId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $group: {
          _id: "$user._id",
          firstMessage: { $first: "$$ROOT" },
        },
      },
      {
        $limit: 10,
      },
    ];

    const [notifs, result] = await Promise.all([
      Notification.find({receiverId: userId, authorId: "grouping", desactived: false}).sort({date: -1}).limit(3).lean(),
      Message.aggregate(pipeline),
    ]);

    const stopIndex = startAt + result.length;
    const endReached = result.length < 10;

      res.status(200).json({status: 0, notifs, messages: result.map((r) => ({
        user: r.firstMessage.user,
        firstMessage: r.firstMessage,
      })),
      startAt: endReached ? null : stopIndex,});

    } catch(err) {
      console.log(err);
      res.status(505).json({err});
    }
}

exports.deleteNotif = async (req, res) => {
    try {
      console.log("deleteNotif _id:", req.body._id);
      const result = await Notification.updateOne({_id: req.body._id}, {$set: {desactived: true}});
      console.log("deleteNotif result:", result);
      if(result.modifiedCount === 0){
        return res.status(404).json({status: 1, message: "Notification non trouvée"});
      }
      res.status(200).json({status: 0});
    } catch(e) {
      console.log(e);
      res.status(505).json({err: e});
    }
}
