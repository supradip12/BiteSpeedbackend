const express = require("express");
const bodyParser = require("body-parser");
const { Sequelize, DataTypes } = require("sequelize");

// Create an instance of the web server
const app = express();

// JSON body parser middleware
app.use(bodyParser.json());

// Connect to the database using your MySQL credentials
const sequelize = new Sequelize("supradipsql", "supradip", "94851419Pk@1", {
  host: "db4free.net",
  dialect: "mysql",
});

// Error handling
app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send("Something went Wrong");
});
// Define the 'Contacts' table model
const Contact = sequelize.define("Contact", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  phoneNumber: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
  },
  linkedId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  linkPrecedence: {
    type: DataTypes.ENUM("primary", "secondary"),
  },
  createdAt: {
    type: DataTypes.DATE,
  },
  updatedAt: {
    type: DataTypes.DATE,
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

// Sync the models with the database
sequelize
  .sync()
  .then(() => {
    console.log("Database synced successfully");
  })
  .catch((error) => {
    console.error("Error syncing the database:", error);
  });

// Endpoint for /identify
app.post("/identify", async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    // Check if any existing contact matches the incoming request
    const existingContact = await Contact.findOne({
      where: {
        [Sequelize.Op.or]: [{ email: email }, { phoneNumber: phoneNumber }],
      },
    });

    if (existingContact) {
      // Create a new "secondary" contact
      const newSecondaryContact = await Contact.create({
        phoneNumber: phoneNumber,
        email: email,
        linkedId:
          existingContact.linkPrecedence === "primary"
            ? existingContact.id
            : existingContact.linkedId,
        linkPrecedence: "secondary",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Return the consolidated contact
      res.status(200).json({
        contact: {
          primaryContactId:
            existingContact.linkPrecedence === "primary"
              ? existingContact.id
              : existingContact.linkedId,
          emails: [existingContact.email, email],
          phoneNumbers: [existingContact.phoneNumber, phoneNumber],
          secondaryContactIds: [newSecondaryContact.id],
        },
      });
    } else {
      // Create a new "primary" contact
      const newPrimaryContact = await Contact.create({
        phoneNumber: phoneNumber,
        email: email,
        linkPrecedence: "primary",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Return the new primary contact
      res.status(200).json({
        contact: {
          primaryContactId: newPrimaryContact.id,
          emails: [email],
          phoneNumbers: [phoneNumber],
          secondaryContactIds: [],
        },
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the server
const PORT = 3000; // You can choose any available port
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
