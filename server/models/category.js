const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        default: 'No Name'
    },
    slug: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
        default: "no description"
    },
    color: {
        type: String,
        required: true,
        default: "primary-color"
    },
    text_color: {
        type: String,
        default: "white"
    }
})

module.exports = mongoose.model('Category', categorySchema, 'categories')