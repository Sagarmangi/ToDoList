require('dotenv').config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const https = require('https');
const date = require(__dirname + '/date.js');
const _ = require('lodash');

// add docs section in todolist to show how to use it


app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"))
app.set("view engine", "ejs");

mongoose.set('strictQuery', false);

mongoose.connect(process.env.MONGODB, {
  useNewUrlParser: true
});

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "can't be empty"]
  }
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to your todo list"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
});

const List = mongoose.model("List", listSchema)

const day = date.getDate();

app.get("/", function(req, res) {


  Item.find({}, function(err, foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    };

  });

});


app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });

});


app.post("/", function(req, res) {
  const itemName = req.body.item;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }

});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listTitle = req.body.listName;
  if (listTitle === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err) {
      console.log(err);
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listTitle}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
        console.log(err);
      });

    res.redirect("/" + listTitle);
  }
});



app.get("/about", function(req, res) {
  res.render("about");
});


app.listen(3000, function() {
  console.log("Server started on port 3000.");
});
