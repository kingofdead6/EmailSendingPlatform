import express from 'express';
import cors from 'cors';
import multer from 'multer';
import csvParser from 'csv-parser';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import fs from 'fs';
import { pipeline } from 'stream/promises';

const app = express();
const port = 5000;

// MongoDB setup with Mongoose
const mongoUrl = 'mongodb+srv://nykahlouche:74jBDeqo0Xd4phL5@cluster0.xzhv1pf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // Replace with your MongoDB connection string
mongoose.connect(mongoUrl)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Mongoose Schemas
const userSchema = new mongoose.Schema({
}, { strict: false });

const headerSchema = new mongoose.Schema({
  headers: [String],
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
const Header = mongoose.model('Header', headerSchema);

// Middleware
app.use(cors());
app.use(express.json());

// CSV upload configuration
const upload = multer({ dest: 'uploads/' });

// Nodemailer transporter (configure with your SMTP settings)
const transporter = nodemailer.createTransport({
  service: 'gmail', // Replace with your email service
  auth: {
    user: 'tedxuniversityofalgiers@gmail.com', // Replace with your email
    pass: 'kspa xsof hlgc iwre', // Replace with your app-specific password
  },
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    res.status(500).send('Error fetching users: ' + error.message);
  }
});

// Get CSV headers
app.get('/api/headers', async (req, res) => {
  try {
    const headerDoc = await Header.findOne().sort({ createdAt: -1 });
    res.json(headerDoc || { headers: [] });
  } catch (error) {
    res.status(500).send('Error fetching headers: ' + error.message);
  }
});

// Upload CSV
app.post('/api/users/upload', upload.single('file'), async (req, res) => {
  const results = [];
  let headers = [];
  try {
    await pipeline(
      fs.createReadStream(req.file.path),
      csvParser(),
      async function* (source) {
        let isFirstRow = true;
        for await (const data of source) {
          if (isFirstRow) {
            headers = Object.keys(data);
            isFirstRow = false;
          }
          results.push(data);
        }
      }
    );
    // Clear existing users and headers
    await User.deleteMany({});
    await Header.deleteMany({});
    // Insert new users and headers
    if (results.length > 0) {
      await User.insertMany(results);
      await Header.create({ headers });
    }
    fs.unlinkSync(req.file.path); // Clean up uploaded file
    res.status(200).send('Users uploaded successfully');
  } catch (error) {
    res.status(500).send('Error processing CSV: ' + error.message);
  }
});

// Delete all users
app.delete('/api/users/delete-all', async (req, res) => {
  try {
    await User.deleteMany({});
    await Header.deleteMany({});
    res.status(200).send('All users deleted successfully');
  } catch (error) {
    res.status(500).send('Error deleting users: ' + error.message);
  }
});

// Send email to all users with QR code
app.post('/api/email/send', async (req, res) => {
  const { subject, body, isHtml } = req.body;
  try {
    const users = await User.find({});
    for (const user of users) {
      // Generate QR code with user data
      const qrData = JSON.stringify(user.toObject());
      const qrCodeBuffer = await QRCode.toBuffer(qrData, { type: 'png' });

      // Prepare email content
      const mailOptions = {
        from: 'tedxuniversityofalgiers@gmail.com', // Replace with your email
        to: user.email,
        subject,
        [isHtml ? 'html' : 'text']: isHtml
          ? `${body}<br><br><p>Please find your QR code attached, you will enter to the event using it.</p>`
          : `${body}\n\nPlease find your QR code attached, you will enter to the event using it.`,
        attachments: [
          { filename: 'user-qr-code.png', content: qrCodeBuffer, contentType: 'image/png' },
        ],
      };

      await transporter.sendMail(mailOptions);
    }
    res.status(200).send('Emails sent successfully');
  } catch (error) {
    res.status(500).send('Error sending emails: ' + error.message);
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});