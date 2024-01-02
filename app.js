const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const app = express();
const port = 8080;
const Registration = require('./models/registrationModel');
const nodemailer = require('nodemailer');
const archiver = require('archiver');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

mongoose.connect("mongodb+srv://doctorspremierleagueseason5:doctorspremierleagueseason5@dsadpl.fa6wr0a.mongodb.net/dplseason5?retryWrites=true&w=majority")
    .then(() => {
        console.log("database connected successfully")
    })
    .catch((error) => {
        console.log(error)
    })

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        console.log(uploadDir, "upload dir path")
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        console.log("file path", file.fieldname + '-' + Date.now() + path.extname(file.originalname))
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'ejs');
// Serve static files (like CSS, images, etc.) from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Define a route to render the registration form
app.get('/', (req, res) => {
    res.render('home');
});

app.get("/index", (req, res) => {
    res.render("index")
})

app.get("/termsdpl", (req, res) => {
    res.render("termsdpl")
})

app.get("/existingemail", (req, res) => {
    res.render("existingemail")
})

// Define a route to handle form submission with file uploads
app.post('/register', upload.fields([
    { name: 'fileUploadPhoto', maxCount: 1 },
    { name: 'fileUploadPayment', maxCount: 1 }
]), async (req, res) => {
    // Access uploaded files using req.files
    const { fileUploadPhoto, fileUploadPayment } = req.files;

    // Use req.body to access other form fields
    const formData = {
        fname: req.body.fname,
        lname: req.body.lname,
        email: req.body.email,
        dob: req.body.dob,
        age: req.body.age,
        phone: req.body.phone,
        hospital: req.body.hospital,
        consent: req.body.flexRadioDefault,
        bmaIma: req.body.bma_ima,
        tshirtSize: req.body.tshirt,
        trouserSize: req.body.trouser,
        nameOnTshirt: req.body.name_on_tshirt,
        numberOnTshirt: req.body.number_on_tshirt,
        previousSeasons: req.body.previous_seasons,
        playerProfile: req.body.player_profile,
        specializedPosition: req.body.specialized_position,
        type_of_batsmen: req.body.type_of_batsmen,
        hitter: req.body.hitter,
        typeOfBowler: req.body.type_of_bowler,
        type_of_bowler_side: req.body.type_of_bowler_side,
        crichero: req.body.crichero,
        fileUploadPhoto: fileUploadPhoto ? '/uploads/' + fileUploadPhoto[0].filename : null,
        fileUploadPayment: fileUploadPayment ? '/uploads/' + fileUploadPayment[0].filename : null,
        typeOfPayment: req.body.typeOfPayment,
        transactionId: req.body.transaction_id,
        transaction_date: req.body.transaction_date,
        acceptance: "true"
    };

    try {

        const existingRegistration = await Registration.findOne({ email: formData.email });
        if (existingRegistration) {
            // If email exists, flash an error message
            res.render('existingemail') // Redirect to the registration page or another page as needed
        }

        // Retrieve the latest registration number from the database
        const latestRegistration = await Registration.findOne({}, {}, { sort: { 'registrationNumber': -1 } });
        const latestRegistrationNumber = latestRegistration ? latestRegistration.registrationNumber : 5000;

        // Increment the registration number and save the data
        formData.registrationNumber = latestRegistrationNumber + 1;
        const registration = new Registration(formData);
        await registration.save();

        res.render('successpage');
    } catch (error) {
        console.error(error);
        //res.status(500).send('Internal Server Error');
    }
});


app.get('/dashboard', async (req, res) => {
    try {
        const registrations = await Registration.find();
        console.log(registrations)
        res.render('dashboard', { registrations });
    } catch (error) {
        console.error(error);
    }
});

app.post('/confirm-email/:email', async (req, res) => {
    const email = req.params.email;
    try {
        const userRegistration = await Registration.findOne({ email });

        if (!userRegistration) {
            return res.status(404).json({ error: 'User not found' });
        }
        await Registration.updateOne({ email }, { $set: { acceptance: 'false' } });
        const registrationNumber = userRegistration.registrationNumber;

        // Generate a random OTP (e.g., a 6-digit number)
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "doctorspremierleagueseason5@gmail.com", // Your Gmail email address
                pass: "aquskzzzdbrxkhtq", // Your Gmail password
            },
        });
        transporter
            .verify()
            .then(() => console.log("Connected to email server"))


        const text = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Registration Confirmation</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0 auto;
                    max-width: 600px;
                    padding: 20px;
                    background-color: rgba(206, 238, 255, 0.5);
                }
                h1 {
                    text-align: center;
                }
                img {
                    display: block;
                    margin: 0 auto;
                    max-width: 100%;
                }
                .otp {
                    color: #323596;
                    font-weight: bold;
                    font-size: 30px;
                }
            </style>
        </head>
        <body>
            <h1>Welcome to Doctors Premier League Season 5</h1>
            <p>Greetings from Doctors Premier League! We are thrilled to have received your registration. We hereby confirm your registration, and your registration ID is <span class="otp">DPL${registrationNumber}</span>.</p>
        
            <p>New Players assessment: Jan 10 and 11</p>
            <p>Tournament days: Feb 11 - 18</p>
            <p>Enjoy the Fun and Fellowship</p>
        
            <p>Warm regards,</p>
            <p>Organizing Committee</p>
        </body>
        </html>
        
        `
        const mailOptions = {
            from: "doctorspremierleagueseason5@gmail.com", // Sender address
            to: email, // Recipient address
            subject: "Confirmation of Registration", // Subject line
            html: text
        };

        // Send email
        await transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                //res.status(500).send('Internal Server Error');
            } else {
                console.log('Email sent:', info.response);
                res.status(200).send('Email sent successfully!');
            }
        });

    } catch (error) {
        console.log("An error occurred while sending the email.");
    }
});

//for downloading the folders

app.get('/archive', (req, res) => {
    const actualPath = path.dirname(require.main.filename);

    const folderPath = path.join(actualPath, 'uploads');
    const zipFilename = 'archive.zip';
    console.log("actual pathhhhhhh", actualPath, folderPath)
    const output = fs.createWriteStream(zipFilename);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
        res.download(zipFilename, (err) => {
            if (err) {
                console.error(err);
            }
            fs.unlinkSync(zipFilename);
        });
    });

    archive.pipe(output);

    archive.directory(folderPath, false);

    archive.finalize();
});

/*
app.get("/download", async (req, res) => {
    try {
      // Fetch data from MongoDB
      const registrations = await Registration.find();
  
      // Define the ZIP file path
      const zipFilePath = "data.zip";
      const csvFilePath = "data.csv";
  
      // Create a CSV writer with the specified header
      const csvWriter = createCsvWriter({
        path: csvFilePath,
        header: [
            { id: "registrationNumber", title: "Registration Number" },
            { id: "fname", title: "First Name" },
            { id: "lname", title: "Last Name" },
            { id: "email", title: "Email" },
            { id: "dob", title: "Date of Birth" },
            { id: "age", title: "Age" },
            { id: "phone", title: "Phone" },
            { id: "hospital", title: "Hospital" },
            { id: "consent", title: "Consent" },
            { id: "bmaIma", title: "BMA/IMA" },
            { id: "tshirtSize", title: "T-Shirt Size" },
            { id: "trouserSize", title: "Trouser Size" },
            { id: "nameOnTshirt", title: "Name on T-Shirt" },
            { id: "numberOnTshirt", title: "Number on T-Shirt" },
            { id: "previousSeasons", title: "Previous Seasons" },
            { id: "playerProfile", title: "Player Profile" },
            { id: "specializedPosition", title: "Specialized Position" },
            { id: "type_of_batsmen", title: "Type of Batsmen" },
            { id: "hitter", title: "Hitter" },
            { id: "crichero", title: "CricHero" },
            { id: "fileUploadPhoto", title: "File Upload Photo" },
            { id: "fileUploadPayment", title: "File Upload Payment" },
            { id: "typeOfPayment", title: "Type of Payment" },
            { id: "transactionId", title: "Transaction ID" },
            { id: "transaction_date", title: "Transaction Date" },
            { id: "acceptance", title: "Acceptance" },
        ],
        fieldDelimiter: ',',
        alwaysQuote: true,
    });
  
      // Convert certain fields to strings in the JSON data
      const jsonData = registrations.map(registration => ({
        registrationNumber: registration.registrationNumber,
        fname: registration.fname,
        lname: registration.lname,
        email: registration.email,
        dob: registration.dob,
        age: registration.age,
        phone: String(registration.phone), // Convert phone number to string
        hospital: registration.hospital,
        consent: registration.consent,
        bmaIma: registration.bmaIma,
        tshirtSize: registration.tshirtSize,
        trouserSize: registration.trouserSize,
        nameOnTshirt: registration.nameOnTshirt,
        numberOnTshirt: registration.numberOnTshirt,
        previousSeasons: registration.previousSeasons,
        playerProfile: registration.playerProfile,
        specializedPosition: registration.specializedPosition,
        type_of_batsmen: registration.type_of_batsmen,
        hitter: registration.hitter,
        crichero: registration.crichero,
        fileUploadPhoto: registration.fileUploadPhoto,
        fileUploadPayment: `https://www.doctorssportsacademy.com/${registration.fileUploadPayment}`,
        typeOfPayment: registration.typeOfPayment,
        transactionId: registration.transactionId,
        transaction_date: registration.transaction_date,
        acceptance: registration.acceptance,
    }));

  
      // Write data to the CSV file
      await csvWriter.writeRecords(jsonData);
  
      console.log(`CSV file written to ${csvFilePath}`);
  
      // Create a ZIP archive
      const output = fs.createWriteStream(zipFilePath);
      const archive = archiver("zip", {
        zlib: { level: 9 }, // compression level
      });
  
      archive.pipe(output);
  
      // Add the CSV file to the archive
      archive.file(csvFilePath, { name: "data.csv" });
  
      // Add images to the archive
      registrations.forEach(registration => {
        const imagePath = path.join(__dirname, "uploads", registration.typeOfPayment);
        if (fs.existsSync(imagePath)) {
          archive.file(imagePath, { name: `uploads/${registration.typeOfPayment}` });
        }
      });
  
      // Finalize the ZIP archive
      await archive.finalize();
  
      console.log(`ZIP archive written to ${zipFilePath}`);
  
      // Set the response headers for downloading the ZIP archive
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename=${zipFilePath}`);
  
      // Create a readable stream from the ZIP archive and pipe it to the response
      const zipFileStream = fs.createReadStream(zipFilePath);
      zipFileStream.pipe(res);
  
      // Remove the ZIP archive and CSV file after streaming them to the response
      zipFileStream.on("end", () => {
        fs.unlinkSync(zipFilePath);
        fs.unlinkSync(csvFilePath);
        console.log(`${zipFilePath} and ${csvFilePath} removed`);
      });
    } catch (error) {
      console.error("Error fetching data from MongoDB:", error);
      res.status(500).send("Internal Server Error");
    }
  });
*/


app.get("/download", async (req, res) => {
    // Sample JSON data
    const registrations = await Registration.find();

    // Define the CSV file path
    const csvFilePath = "data.csv";
    

    // Create a CSV writer with the specified header
    const csvWriter = createCsvWriter({
        path: csvFilePath,
        header: [
            { id: "registrationNumber", title: "Registration Number" },
            { id: "fname", title: "First Name" },
            { id: "lname", title: "Last Name" },
            { id: "email", title: "Email" },
            { id: "dob", title: "Date of Birth" },
            { id: "age", title: "Age" },
            { id: "phone", title: "Phone" },
            { id: "hospital", title: "Hospital" },
            { id: "consent", title: "Consent" },
            { id: "bmaIma", title: "BMA/IMA" },
            { id: "tshirtSize", title: "T-Shirt Size" },
            { id: "trouserSize", title: "Trouser Size" },
            { id: "nameOnTshirt", title: "Name on T-Shirt" },
            { id: "numberOnTshirt", title: "Number on T-Shirt" },
            { id: "previousSeasons", title: "Previous Seasons" },
            { id: "playerProfile", title: "Player Profile" },
            { id: "specializedPosition", title: "Specialized Position" },
            { id: "type_of_batsmen", title: "Type of Batsmen" },
            { id: "hitter", title: "Hitter" },
            { id: "crichero", title: "CricHero" },
            { id: "fileUploadPhoto", title: "File Upload Photo" },
            { id: "fileUploadPayment", title: "File Upload Payment" },
            { id: "typeOfPayment", title: "Type of Payment" },
            { id: "transactionId", title: "Transaction ID" },
            { id: "transaction_date", title: "Transaction Date" },
            { id: "acceptance", title: "Acceptance" },
        ],
        fieldDelimiter: ',',
        alwaysQuote: true,
    });

    const jsonData = registrations.map(registration => ({
        registrationNumber: registration.registrationNumber,
        fname: registration.fname,
        lname: registration.lname,
        email: registration.email,
        dob: registration.dob,
        age: registration.age,
        phone: String(registration.phone), // Convert phone number to string
        hospital: registration.hospital,
        consent: registration.consent,
        bmaIma: registration.bmaIma,
        tshirtSize: registration.tshirtSize,
        trouserSize: registration.trouserSize,
        nameOnTshirt: registration.nameOnTshirt,
        numberOnTshirt: registration.numberOnTshirt,
        previousSeasons: registration.previousSeasons,
        playerProfile: registration.playerProfile,
        specializedPosition: registration.specializedPosition,
        type_of_batsmen: registration.type_of_batsmen,
        hitter: registration.hitter,
        crichero: registration.crichero,
        fileUploadPhoto:`https://doctorssportsacademy.com${registration.fileUploadPhoto}`,
        fileUploadPayment: `https://doctorssportsacademy.com${registration.fileUploadPayment}`,
        typeOfPayment: registration.typeOfPayment,
        transactionId: registration.transactionId,
        transaction_date: registration.transaction_date,
        acceptance: registration.acceptance,
    }));


    // Write JSON data to the CSV file
    csvWriter.writeRecords(jsonData)
        .then(() => {
            console.log(`CSV file written to ${csvFilePath}`);

            // Set the response headers for downloading the file
            res.setHeader("Content-Type", "text/csv");
            res.setHeader("Content-Disposition", "attachment; filename=playerslist.csv");

            // Create a readable stream from the CSV file and pipe it to the response
            const fileStream = fs.createReadStream(csvFilePath);
            fileStream.pipe(res);

            // Remove the CSV file after streaming it to the response
            fileStream.on("end", () => {
                fs.unlinkSync(csvFilePath);
                console.log(`${csvFilePath} removed`);
            });
            
        })
        .catch((err) => {
            console.error("Error writing CSV file:", err);
            //res.status(500).send("Internal Server Error");
        });
});



// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
