var mongoose = require("mongoose");
var moment = require("moment");
var Schema = mongoose.Schema;

var AuthorSchema = new Schema(
    {
        first_name: {type: String, required: true, max: 100},
        family_name: {type: String, required: true, max: 100},
        date_birth: {type: Date},
        date_death: Date
    }
);

//Virtual for author's full name
AuthorSchema.virtual('name')
.get(function()
{
    return this.family_name + ' ' + this.first_name;
});

//Virtual for author's lifespan
AuthorSchema.virtual('lifespan')
.get(function()
{
    let ded = this.date_death;
    let today = new Date(Date.now());
    let now = ded ? ded.getYear() : today.getYear();
    let birth = this.date_birth ? this.date_birth.getYear() : now;
    return this.date_birth_formatted + " - " + this.date_death_formatted + " (" + (now - birth).toString() + ") ";
});

//Virtual for author's URL
AuthorSchema.virtual('url')
.get(function()
{
    return '/catalog/author/' + this._id;
});

//Virtual for author's formatted date_birth
AuthorSchema.virtual('date_birth_formatted')
.get(function()
{
    return this.date_birth ? moment(this.date_birth).format('YYYY/MM/DD') : '';
})

//Virtual for author's formatted date_death
AuthorSchema.virtual('date_death_formatted')
.get(function()
{
    return this.date_death ? moment(this.date_death).format('YYYY/MM/DD') : '';
})

//Export model
module.exports = mongoose.model("Author", AuthorSchema);