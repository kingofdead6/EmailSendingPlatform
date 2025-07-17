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
const mongoUrl = 'mongodb+srv://nykahlouche:74jBDeqo0Xd4phL5@cluster0.xzhv1pf.mongodb.net/?retryWrites=true&w=majority';
mongoose.connect(mongoUrl)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Mongoose Schemas
const userSchema = new mongoose.Schema({}, { strict: false });
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

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'tedxuniversityofalgiers@gmail.com',
    pass: 'kspa xsof hlgc iwre', // Replace with valid app-specific password
  },
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Error fetching users: ' + error.message);
  }
});

// Get CSV headers
app.get('/api/headers', async (req, res) => {
  try {
    const headerDoc = await Header.findOne().sort({ createdAt: -1 });
    res.json(headerDoc || { headers: [] });
  } catch (error) {
    console.error('Error fetching headers:', error);
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
    await User.deleteMany({});
    await Header.deleteMany({});
    if (results.length > 0) {
      await User.insertMany(results);
      await Header.create({ headers });
    }
    fs.unlinkSync(req.file.path);
    res.status(200).send('Users uploaded successfully');
  } catch (error) {
    console.error('Error processing CSV:', error);
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
    console.error('Error deleting users:', error);
    res.status(500).send('Error deleting users: ' + error.message);
  }
});

// Send email to all users with QR code
app.post('/api/email/send', async (req, res) => {
  const { subject, body, isHtml } = req.body;
  try {
    const users = await User.find({});
    console.log(`Found ${users.length} users for email sending`);

    // Log sample user data to inspect field names
    if (users.length > 0) {
      console.log('Sample user fields:', Object.keys(users[0].toObject()));
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validUsers = users.filter(user => {
      const email = user.Email ? user.Email.trim() : '';
      return email && emailRegex.test(email);
    });
    console.log(`Valid users with Email field: ${validUsers.length}`);

    // Log invalid users for debugging
    const invalidUsers = users.filter(user => {
      const email = user.Email ? user.Email.trim() : '';
      return !email || !emailRegex.test(email);
    });
    invalidUsers.forEach(user => {
      console.log(`Invalid user: ${user["Full Name"]} with Email: ${user.Email || 'missing'}`);
    });

    if (validUsers.length === 0) {
      return res.status(400).send('No users with valid email addresses found');
    }

    const errors = [];
    for (const user of validUsers) {
      try {
        // Generate QR code
        const qrData = JSON.stringify(user.toObject());
        const qrCodeBuffer = await QRCode.toBuffer(qrData, { type: 'png' });
        console.log(`QR code generated for user: ${user.Email}`);

        // Prepare email content
        const mailOptions = {
          from: 'tedxuniversityofalgiers@gmail.com',
          to: user.Email.trim(),
          subject,
          [isHtml ? 'html' : 'text']: body,
          attachments: [
            { filename: 'user-qr-code.png', content: qrCodeBuffer, contentType: 'image/png' },
          ],
        };

        // Send email
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to: ${user.Email}`);
      } catch (error) {
        console.error(`Error sending email to ${user.Email}:`, error);
        errors.push(`Failed to send email to ${user.Email}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      return res.status(207).send(`Some emails failed to send: ${errors.join('; ')}`);
    }

    res.status(200).send('Emails sent successfully');
  } catch (error) {
    console.error('Error in email route:', error);
    res.status(500).send('Error sending emails: ' + error.message);
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err.stack);
  res.status(500).send('Something went wrong: ' + err.message);
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});