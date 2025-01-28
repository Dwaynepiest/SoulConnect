const mysql = require('mysql2');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcrypt');
faker.locale = 'nl';  // Ensure the locale is set to Dutch

// Create database connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'soulconnect'
});

// Custom Dutch categories for replacement
const dutchJobs = [
  'Verkoper', 'Boer', 'Visser', 'Ingenieur', 'Onderwijzer', 'Hovenier', 'Dokter', 'Verpleger', 'Chef-kok', 'Brandweerman'
];

const dutchHobbies = [
  'Fietsen', 'Lezen', 'Wandelen', 'Koken', 'Schilderen', 'Reizen', 'Muziek luisteren', 'Fotografie', 'Gamen', 'Vissen'
];

const dutchEducation = [
  'VWO', 'MBO', 'HBO', 'WO', 'PhD', 'LBO', 'Technische School', 'Vakschool'
];

const dutchAboutYou = [
  'Ik ben een hardwerkende en ambitieuze persoon.',
  'Ik hou van avontuur en ben altijd op zoek naar nieuwe ervaringen.',
  'Ik ben een creatief persoon die graag nieuwe dingen leert.',
  'Ik ben sociaal en vind het leuk om tijd door te brengen met vrienden.',
  'Mijn passie ligt in technologie en innovatie.'
];

const dutchOneLiners = [
  'Hallo, ik ben een gepassioneerde programmeur.',
  'Ik houd van reizen en nieuwe culturen ontdekken.',
  'Mijn favoriete maaltijd is stamppot met worst.',
  'Ik ben op zoek naar een gezellige partner.',
  'Lezen is mijn favoriete bezigheid in de avond.',
  'Ik ben erg sociaal en houd van uitgaan met vrienden.',
  'Ik zoek een avontuur in mijn leven.',
  'De toekomst is vol mogelijkheden.',
  'Technologie fascineert mij elke dag.',
  'Ik ben een sportieve persoon en hou van hardlopen.'
];

// Example of generating a random Dutch sentence from each category
const generateOneLiner = () => faker.helpers.arrayElement(dutchOneLiners);
const generateJob = () => faker.helpers.arrayElement(dutchJobs);
const generateHobby = () => faker.helpers.arrayElement(dutchHobbies);
const generateEducation = () => faker.helpers.arrayElement(dutchEducation);
const generateAboutYou = () => faker.helpers.arrayElement(dutchAboutYou);

// Function to hash passwords
const hashPassword = async (password) => {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};

// Generate random Dutch names and info for users
const generateUsers = async (count) => {  // Mark this function as async
  const users = [];
  for (let i = 1; i <= count; i++) {
    const gender = faker.helpers.arrayElement(['male', 'female']);
    const nickname = faker.internet.username();  // updated to avoid deprecation warning
    const email = faker.internet.email();
    const password = faker.internet.password();
    const birth_date = faker.date.between({ from: '1980-01-01', to: '2005-12-31' }).toISOString().split('T')[0];
    const zip_code = faker.location.zipCode('####');
    const foto = `profile${i}.jpg`;
    const admin = i === 1 ? 1 : 2; // Admin for the first user, others as regular
    const is_verified = 1; // All users are verified for simplicity

    // Hash the password before adding it to the user object
    const hashedPassword = await hashPassword(password);

    users.push({
      nickname,
      email,
      password: hashedPassword, // Store the hashed password
      birth_date,
      zip_code,
      gender,
      accept_service: 1, // Assume all users accept services
      payment: 0, // Payment not yet made
      foto,
      admin,
      verification_token: null,
      is_verified,
      is_blocked: 0,
    });
  }
  return users;
};

// Generate extra data for users with fitting Dutch content
const generateExtra = (userId) => {
  return {
    user_id: userId,
    education: generateEducation(),  // Replace with Dutch education
    hobby: generateHobby(),          // Replace with Dutch hobby
    about_you: generateAboutYou(),   // Replace with Dutch about_you
    job: generateJob(),              // Replace with Dutch job title
  };
};

// Generate relationship data for users with Dutch sentences
const generateRelationship = (userId) => {
  const preferences = ['male', 'female'];
  const relations = ['or', 'cr', 'fwb'];
  return {
    user_id: userId,
    preference: faker.helpers.arrayElement(preferences),
    one_liner: generateOneLiner(),  // Use custom Dutch one-liner
    relation: faker.helpers.arrayElement(relations),
    location: faker.number.int({ min: 1, max: 50 }), // Random number between 1 and 50
  };
};

// Seed users, extra, and relationship
const seedDatabase = async () => {
  const userCount = 100;  // You can increase this count as needed
  
  const users = await generateUsers(userCount); // Await to hash passwords before inserting

  // Insert users into the `users` table and then insert extra and relationship data
  for (const user of users) {
    try {
      // Insert user into `users` table
      const userResult = await new Promise((resolve, reject) => {
        const sql = `INSERT INTO users (nickname, email, password, birth_date, zip_code, gender, accept_service, payment, foto, admin, verification_token, is_verified, is_blocked)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        connection.query(sql, Object.values(user), (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });

      const userId = userResult.insertId; // Get the last inserted user ID

      // Insert extra data into `extra` table
      const extraData = generateExtra(userId);
      await new Promise((resolve, reject) => {
        const extraSql = `INSERT INTO extra (user_id, education, hobby, about_you, job) VALUES (?, ?, ?, ?, ?)`;
        connection.query(extraSql, Object.values(extraData), (err) => {
          if (err) return reject(err);
          resolve();
        });
      });

      // Insert relationship data into `relationship` table
      const relationshipData = generateRelationship(userId);
      await new Promise((resolve, reject) => {
        const relationshipSql = `INSERT INTO relationship (user_id, preference, one_liner, relation, location) VALUES (?, ?, ?, ?, ?)`;
        connection.query(relationshipSql, Object.values(relationshipData), (err) => {
          if (err) return reject(err);
          resolve();
        });
      });

    } catch (err) {
      console.error('Error during seeding process:', err);
    }
  }

  console.log('Seeding complete!');
  connection.end();
};

// Run the seed script
seedDatabase();
