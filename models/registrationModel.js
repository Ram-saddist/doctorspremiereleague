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
    type_of_batsmen:String,
    hitter:String,
    typeOfBowler: String,
    type_of_bowler_side:String,
    crichero:{
        type: String,
        required: false,
        default: "",
    },
    fileUploadPhoto: String,
    fileUploadPayment: String,
    typeOfPayment: String,
    transactionId: String,
    transaction_date:String,
    acceptance:String
});

// Create a model using the schema
const Registration = mongoose.model('Registration', registrationSchema);

// Export the model
module.exports = Registration;
