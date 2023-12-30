const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const app = express();
const port = 3000;
const Registration = require('./models/registrationModel');
const nodemailer = require('nodemailer');
mongoose.connect("mongodb+srv://sivaram:sivaram@cluster0.0u7y0h0.mongodb.net/doctorspremierleague?retryWrites=true&w=majority")
    .then(() => {
        console.log("database connected successfully")
    })
    .catch((error) => {
        console.log(error)
    })

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        console.log(uploadDir,"upload dir path")
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        console.log("file path",file.fieldname + '-' + Date.now() + path.extname(file.originalname))
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

app.get("/index",(req,res)=>{
    res.render("index")
})

app.get("/termsdpl",(req,res)=>{
    res.render("termsdpl")
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
        type_of_batsmen:req.body.type_of_batsmen,
        hitter:req.body.hitter,
        typeOfBowler: req.body.type_of_bowler,
        type_of_bowler_side:req.body.type_of_bowler_side,
        crichero: req.body.crichero,
        fileUploadPhoto: fileUploadPhoto ? '/uploads/' + fileUploadPhoto[0].filename : null,
        fileUploadPayment: fileUploadPayment ? '/uploads/' + fileUploadPayment[0].filename : null,
        typeOfPayment: req.body.typeOfPayment,
        transactionId: req.body.transaction_id,
        transaction_date:req.body.transaction_date
    };

    try {
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

        const registrationNumber = userRegistration.registrationNumber;

        // Generate a random OTP (e.g., a 6-digit number)
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "sivaram@codegnan.com", // Your Gmail email address
                pass: "ypvbrngksqwljnsj", // Your Gmail password
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
            from: "sivaram@codegnan.com", // Sender address
            to: email, // Recipient address
            subject: "Acceptance of Booking", // Subject line
            html: text
        };

        // Send email
        await transporter.sendMail(mailOptions,(error,info)=>{
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


// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
