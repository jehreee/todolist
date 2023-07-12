const express = require("express");
const serverless = require('serverless-http');
const https = require("https");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.set('view engine', 'ejs');

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb+srv://admin-jerry:jerry24@cluster0.z8cucqu.mongodb.net/todolistDB');

    const itemSchema = new mongoose.Schema({
        name: String,
    });
    
    const Item = mongoose.model("Item", itemSchema);

    const item1 = new Item ({
        name: "Welcome to your todolist",
    });

    const item2 = new Item ({
        name: "Hit the + button to add new items.",
    });

    const item3 = new Item ({
        name: "<-- Hit this to delete an item.",
    });



    const defaultItems = [item1, item2, item3];

    const listSchema = {
        name: String,
        items: [itemSchema]
    };

    const List = mongoose.model("List", listSchema);


    app.get("/", function(req, res){

        Item.find({}).then(function(foundItems){
            if (foundItems.length === 0) {
                Item.insertMany(defaultItems).then(function(){
                    console.log("Succesfully saved default items to DB");
                }).catch(function(err){
                    console.log(err);
                });
                res.redirect("/");
            } else {
                res.render("list", {listTitle: "Today", newListItems: foundItems});
            }
            
        }).catch(function(err){
            console.log(err);
        }); 
    });

    app.get("/:customListName", (req, res) => {
        const customListName = _.capitalize(req.params.customListName);

        List.findOne({name: customListName}).then( (foundList) => {
            if (!foundList) {
                //Create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
        
                list.save();
                res.redirect("/" + customListName);
            }else{
                //Show an existing list
                res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
            }
        }).catch(function(err){
            console.log(err);
        })

        
    })
    
    app.post("/", function(req, res){
        const itemName = req.body.newItem;
        const listName = req.body.list;
        const item = new Item({
            name: itemName,
        });

        if (listName === "Today"){
            item.save();
            res.redirect("/");
        } else{
            List.findOne({name: listName}).then( (foundList) => {
                foundList.items.push(item);
                foundList.save();
                res.redirect("/" + listName);
            }).catch( (err) => {
                console.log(err);
            })
        }

    });

    app.post("/delete", function(req, res){
        const checkedItemId = req.body.checkbox;
        const listName = req.body.listName;

        if (listName === "Today"){
            Item.findByIdAndRemove({_id: checkedItemId}).then(function(){
                console.log("item with ID " + checkedItemId + " has been deleted");
                res.redirect("/");
            }).catch(function(err){
                console.log(err);
            })
        } else {
            List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then( (foundList) => {
                res.redirect("/" + listName);
            })
        }
        
    });

    

    
} 

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];




// app.post("/", function(req, res){
//     const item = req.body.newItem;

//     if (req.body.list === "Work"){
//         workItems.push(item);
//         res.redirect("/work");
//     }else{
//         items.push(item);
//         res.redirect("/");
//     }
// })




app.listen(3000, function(){
    console.log("Server is running on port 3000")
})