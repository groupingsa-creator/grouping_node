const nodemailer = require("nodemailer");
const NewsletterSubscriber = require("../models/NewsletterSubscriber");

const transporter = nodemailer.createTransport({
  host: "mail.groupingpro.com",
  secure: true,
  port: 465,
  auth: {
    user: "noreply@groupingpro.com",
    pass: process.env.EMAIL_PASS || "wS6-99$EexrqjcM",
  },
});

exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ status: 1, message: "Email is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ status: 2, message: "Invalid email format" });
    }

    const existing = await NewsletterSubscriber.findOne({ email: email.toLowerCase() });
    if (existing) {
      if (!existing.active) {
        existing.active = true;
        await existing.save();
        return res.status(200).json({ status: 0, message: "Re-subscribed successfully" });
      }
      return res.status(200).json({ status: 3, message: "Already subscribed" });
    }

    const subscriber = new NewsletterSubscriber({
      email: email.toLowerCase(),
    });
    await subscriber.save();

    res.status(201).json({ status: 0, message: "Subscribed successfully" });
  } catch (err) {
    console.error("Newsletter subscribe error:", err);
    res.status(500).json({ status: 1, message: "Server error" });
  }
};

exports.getSubscribers = async (req, res) => {
  try {
    const subscribers = await NewsletterSubscriber.find({ active: true })
      .sort({ subscribedAt: -1 })
      .lean();
    res.status(200).json({ status: 0, subscribers });
  } catch (err) {
    console.error("Get subscribers error:", err);
    res.status(500).json({ status: 1, message: "Server error" });
  }
};

exports.sendNewsletter = async (req, res) => {
  try {
    const { subject, content } = req.body;
    if (!subject || !content) {
      return res.status(400).json({ status: 1, message: "Subject and content are required" });
    }

    const subscribers = await NewsletterSubscriber.find({ active: true }).select("email").lean();
    if (subscribers.length === 0) {
      return res.status(200).json({ status: 2, message: "No active subscribers" });
    }

    const emails = subscribers.map((s) => s.email);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #033E8C; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Grouping</h1>
        </div>
        <div style="padding: 30px 20px; background-color: #ffffff;">
          ${content.replace(/\n/g, "<br/>")}
        </div>
        <div style="background-color: #f4f8fc; padding: 15px; text-align: center; font-size: 12px; color: #6c6c6c;">
          <p>Grouping.com - Newsletter</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: '"Grouping" <noreply@groupingpro.com>',
      bcc: emails,
      subject: subject,
      html: htmlContent,
    });

    res.status(200).json({ status: 0, message: "Newsletter sent", count: emails.length });
  } catch (err) {
    console.error("Send newsletter error:", err);
    res.status(500).json({ status: 1, message: "Failed to send newsletter" });
  }
};
