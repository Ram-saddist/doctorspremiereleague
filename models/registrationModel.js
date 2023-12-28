const mongoose = require('mongoose');

// Define the schema for the registration data
const registrationSchema = new mongoose.Schema({
    fname: String,
    lname:String,
    email: String,
    dob:String,
    age: String,
    phone: String,
    hospital: String,
    consent: String,
    bmaIma: String,
    tshirtSize: String,
    trouserSize: String,
    nameOnTshirt: String,
    numberOnTshirt: String,
    previousSeasons: [String],
    playerProfile: String,
    specializedPosition: String,
    typeOfBowler: String,
    fileUploadPhoto: String,
    fileUploadPayment: String,
    dietaryRestrictions: String,
    typeOfPayment: String,
    transactionId: String,
});

// Create a model using the schema
const Registration = mongoose.model('Registration', registrationSchema);

// Export the model
module.exports = Registration;
