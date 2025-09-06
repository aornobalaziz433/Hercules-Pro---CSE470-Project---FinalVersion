const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// MySQL setup
const db = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
});

db.connect((err) => {
  if (err) {
    console.error('MySQL connection error:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL');
  db.query(`CREATE TABLE IF NOT EXISTS codes (
    email VARCHAR(255) PRIMARY KEY,
    code VARCHAR(10) NOT NULL,
    created_at BIGINT NOT NULL
  )`);
  db.query(`CREATE TABLE IF NOT EXISTS users (
    email VARCHAR(255) PRIMARY KEY,
    password VARCHAR(255),
    is_active TINYINT DEFAULT 0,
    activation_code VARCHAR(10),
    created_at BIGINT
  )`);
});

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send code endpoint
app.post('/send-code', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const now = Date.now();
  db.query(
    `REPLACE INTO codes (email, code, created_at) VALUES (?, ?, ?)`,
    [email, code, now],
    async (err) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Your Verification Code',
          text: `Your verification code is: ${code}`
        });
        res.json({ success: true });
      } catch (err) {
        res.status(500).json({ error: 'Failed to send email' });
      }
    }
  );
});

// Verify code endpoint
app.post('/verify-code', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Email and code required' });
  db.query(
    `SELECT code, created_at FROM codes WHERE email = ?`,
    [email],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (!results.length) return res.status(400).json({ error: 'No code found for this email' });
      const row = results[0];
      const now = Date.now();
      if (now - row.created_at > 10 * 60 * 1000) {
        db.query(`DELETE FROM codes WHERE email = ?`, [email]);
        return res.status(400).json({ error: 'Code expired' });
      }
      if (row.code === code) {
        db.query(`DELETE FROM codes WHERE email = ?`, [email]);
        return res.json({ success: true });
      }
      res.status(400).json({ error: 'Invalid code' });
    }
  );
});

// Registration endpoint (example, you may need to adapt to your frontend)
app.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const activation_code = Math.floor(100000 + Math.random() * 900000).toString();
  const now = Date.now();
  db.query(
    `INSERT INTO users (email, password, is_active, activation_code, created_at) VALUES (?, ?, 0, ?, ?)
     ON DUPLICATE KEY UPDATE password=VALUES(password), is_active=0, activation_code=VALUES(activation_code), created_at=VALUES(created_at)`,
    [email, password, activation_code, now],
    async (err) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Your Account Activation Code',
          text: `Your activation code is: ${activation_code}`
        });
        res.json({ success: true });
      } catch (err) {
        res.status(500).json({ error: 'Failed to send activation email' });
      }
    }
  );
});

// Send activation code (resend)
app.post('/send-activation-code', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const activation_code = Math.floor(100000 + Math.random() * 900000).toString();
  db.query(
    `UPDATE users SET activation_code = ? WHERE email = ?`,
    [activation_code, email],
    async (err, result) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Your Account Activation Code',
          text: `Your activation code is: ${activation_code}`
        });
        res.json({ success: true });
      } catch (err) {
        res.status(500).json({ error: 'Failed to send activation email' });
      }
    }
  );
});

// Verify activation code
app.post('/verify-activation-code', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Email and code required' });
  db.query(
    `SELECT activation_code FROM users WHERE email = ?`,
    [email],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (!results.length) return res.status(404).json({ error: 'User not found' });
      if (results[0].activation_code === code) {
        db.query(`UPDATE users SET is_active = 1, activation_code = NULL WHERE email = ?`, [email]);
        return res.json({ success: true });
      }
      res.status(400).json({ error: 'Invalid code' });
    }
  );
});

// Example login endpoint (only allow if is_active=1)
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  db.query(
    `SELECT * FROM users WHERE email = ? AND password = ? AND is_active = 1`,
    [email, password],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (!results.length) return res.status(401).json({ error: 'Invalid credentials or account not activated' });
      res.json({ success: true, user: results[0] });
    }
  );
});

// ===== FITNESS EVENTS API ENDPOINTS =====

// Get all active events
app.get('/api/events', (req, res) => {
  const { type, limit = 20, offset = 0 } = req.query;
  
  let query = `
    SELECT fe.*, 
           COUNT(DISTINCT ep.user_id) as participant_count,
           COUNT(DISTINCT el.user_id) as likes_count
    FROM fitness_events fe
    LEFT JOIN event_participants ep ON fe.id = ep.event_id AND ep.status = 'registered'
    LEFT JOIN event_likes el ON fe.id = el.event_id
    WHERE fe.is_active = 1 AND fe.event_date > NOW()
  `;
  
  const params = [];
  
  if (type) {
    query += ' AND fe.event_type = ?';
    params.push(type);
  }
  
  query += ' GROUP BY fe.id ORDER BY fe.event_date ASC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching events:', err);
      return res.status(500).json({ error: 'Failed to fetch events' });
    }
    res.json({ success: true, events: results });
  });
});

// Get single event by ID
app.get('/api/events/:id', (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT fe.*, 
           COUNT(DISTINCT ep.user_id) as participant_count,
           COUNT(DISTINCT el.user_id) as likes_count
    FROM fitness_events fe
    LEFT JOIN event_participants ep ON fe.id = ep.event_id AND ep.status = 'registered'
    LEFT JOIN event_likes el ON fe.id = el.event_id
    WHERE fe.id = ? AND fe.is_active = 1
    GROUP BY fe.id
  `;
  
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error fetching event:', err);
      return res.status(500).json({ error: 'Failed to fetch event' });
    }
    if (!results.length) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ success: true, event: results[0] });
  });
});

// Create new event (Professional users only)
app.post('/api/events', (req, res) => {
  const { title, description, event_date, location, event_type, image_url, trainer_id, trainer_name, max_participants, registration_fee } = req.body;
  
  // Validate required fields
  if (!title || !description || !event_date || !location || !event_type || !trainer_id || !trainer_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Validate event date is in the future
  const eventDateTime = new Date(event_date);
  const now = new Date();
  if (eventDateTime <= now) {
    return res.status(400).json({ error: 'Event date must be in the future' });
  }
  
  const query = `
    INSERT INTO fitness_events 
    (title, description, event_date, location, event_type, image_url, trainer_id, trainer_name, max_participants, registration_fee)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [title, description, event_date, location, event_type, image_url, trainer_id, trainer_name, max_participants || null, registration_fee || 0.00];
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error('Error creating event:', err);
      return res.status(500).json({ error: 'Failed to create event' });
    }
    res.json({ success: true, eventId: result.insertId });
  });
});

// Update event (Professional users only - must be the creator)
app.put('/api/events/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, event_date, location, event_type, image_url, max_participants, registration_fee, trainer_id } = req.body;
  
  // First check if event exists and user is the creator
  const checkQuery = 'SELECT trainer_id FROM fitness_events WHERE id = ? AND is_active = 1';
  db.query(checkQuery, [id], (err, results) => {
    if (err) {
      console.error('Error checking event:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!results.length) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (results[0].trainer_id != trainer_id) {
      return res.status(403).json({ error: 'Not authorized to update this event' });
    }
    
    // Update the event
    const updateQuery = `
      UPDATE fitness_events 
      SET title = ?, description = ?, event_date = ?, location = ?, event_type = ?, 
          image_url = ?, max_participants = ?, registration_fee = ?, updated_at = NOW()
      WHERE id = ?
    `;
    
    const params = [title, description, event_date, location, event_type, image_url, max_participants, registration_fee, id];
    
    db.query(updateQuery, params, (err, result) => {
      if (err) {
        console.error('Error updating event:', err);
        return res.status(500).json({ error: 'Failed to update event' });
      }
      res.json({ success: true });
    });
  });
});

// Delete event (Professional users only - must be the creator)
app.delete('/api/events/:id', (req, res) => {
  const { id } = req.params;
  const { trainer_id } = req.body;
  
  // First check if event exists and user is the creator
  const checkQuery = 'SELECT trainer_id FROM fitness_events WHERE id = ? AND is_active = 1';
  db.query(checkQuery, [id], (err, results) => {
    if (err) {
      console.error('Error checking event:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!results.length) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (results[0].trainer_id != trainer_id) {
      return res.status(403).json({ error: 'Not authorized to delete this event' });
    }
    
    // Soft delete the event
    const deleteQuery = 'UPDATE fitness_events SET is_active = 0 WHERE id = ?';
    db.query(deleteQuery, [id], (err, result) => {
      if (err) {
        console.error('Error deleting event:', err);
        return res.status(500).json({ error: 'Failed to delete event' });
      }
      res.json({ success: true });
    });
  });
});

// Register for event
app.post('/api/events/:id/register', (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;
  
  if (!user_id) {
    return res.status(400).json({ error: 'User ID required' });
  }
  
  // Check if event exists and has space
  const checkQuery = `
    SELECT fe.*, COUNT(ep.user_id) as current_participants
    FROM fitness_events fe
    LEFT JOIN event_participants ep ON fe.id = ep.event_id AND ep.status = 'registered'
    WHERE fe.id = ? AND fe.is_active = 1
    GROUP BY fe.id
  `;
  
  db.query(checkQuery, [id], (err, results) => {
    if (err) {
      console.error('Error checking event:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!results.length) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const event = results[0];
    if (event.max_participants && event.current_participants >= event.max_participants) {
      return res.status(400).json({ error: 'Event is full' });
    }
    
    // Register user for event
    const registerQuery = `
      INSERT INTO event_participants (event_id, user_id, status) 
      VALUES (?, ?, 'registered')
      ON DUPLICATE KEY UPDATE status = 'registered'
    `;
    
    db.query(registerQuery, [id, user_id], (err, result) => {
      if (err) {
        console.error('Error registering for event:', err);
        return res.status(500).json({ error: 'Failed to register for event' });
      }
      res.json({ success: true });
    });
  });
});

// Like/Unlike event
app.post('/api/events/:id/like', (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;
  
  if (!user_id) {
    return res.status(400).json({ error: 'User ID required' });
  }
  
  // Check if user already liked this event
  const checkQuery = 'SELECT id FROM event_likes WHERE event_id = ? AND user_id = ?';
  db.query(checkQuery, [id, user_id], (err, results) => {
    if (err) {
      console.error('Error checking like:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length > 0) {
      // Unlike the event
      const unlikeQuery = 'DELETE FROM event_likes WHERE event_id = ? AND user_id = ?';
      db.query(unlikeQuery, [id, user_id], (err, result) => {
        if (err) {
          console.error('Error unliking event:', err);
          return res.status(500).json({ error: 'Failed to unlike event' });
        }
        res.json({ success: true, liked: false });
      });
    } else {
      // Like the event
      const likeQuery = 'INSERT INTO event_likes (event_id, user_id) VALUES (?, ?)';
      db.query(likeQuery, [id, user_id], (err, result) => {
        if (err) {
          console.error('Error liking event:', err);
          return res.status(500).json({ error: 'Failed to like event' });
        }
        res.json({ success: true, liked: true });
      });
    }
  });
});

// Get events created by a professional user
app.get('/api/events/professional/:trainer_id', (req, res) => {
  const { trainer_id } = req.params;
  const { limit = 20, offset = 0 } = req.query;
  
  const query = `
    SELECT fe.*, 
           COUNT(DISTINCT ep.user_id) as participant_count,
           COUNT(DISTINCT el.user_id) as likes_count
    FROM fitness_events fe
    LEFT JOIN event_participants ep ON fe.id = ep.event_id AND ep.status = 'registered'
    LEFT JOIN event_likes el ON fe.id = el.event_id
    WHERE fe.trainer_id = ? AND fe.is_active = 1
    GROUP BY fe.id 
    ORDER BY fe.created_at DESC 
    LIMIT ? OFFSET ?
  `;
  
  db.query(query, [trainer_id, parseInt(limit), parseInt(offset)], (err, results) => {
    if (err) {
      console.error('Error fetching professional events:', err);
      return res.status(500).json({ error: 'Failed to fetch events' });
    }
    res.json({ success: true, events: results });
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 