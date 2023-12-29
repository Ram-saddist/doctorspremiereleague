const mongoose = require('mongoose');
const registrationSchema = new mongoose.Schema({
    registrationNumber: {
        type: Number,
        required: true,
        unique: true,
        default: 5001,
    },
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
    crichero:String,
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
