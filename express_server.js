const bodyParser = require("body-parser");

const express = require("express");
const app = express();
const PORT = 8080;
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const { getUserByEmail } = require('./helper.js');
const { request } = require("express");
const salt = bcrypt.genSaltSync(10);
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

app.use(cookieSession({
  name: 'session',
  keys: ['key1'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

// Database objects

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: bcrypt.hashSync("1234", salt)
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: bcrypt.hashSync("abcd", salt)
  }
};

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

// URLs, new, short, id, delete, login, logout, register, functions

app.get("/urls", (req, res) => {
  const user_ID = req.session.user_ID;
  const user = users[user_ID];
  const templateVars = {
    urls: urlsForUser(req.session.user_ID),
    user: user
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const userID = req.session.user_ID;
  console.log(req.body); 
  const shortURL = generateRandomString(6);
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = {longURL, userID}; 
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {
  const user_ID = req.session.user_ID;
  const user = users[user_ID];
  const templateVars = {
    user: user};
    if (req.session.user_ID) {
      res.render("urls_new", templateVars)
    } else {
      res.render("urls_login", templateVars)
    };
});

app.get("/u/:shortURL", (req, res)=> {
  let shortURL = req.params['shortURL'];
  console.log(req.params);
  urlDatabase[shortURL] // {userID: ???, longURL: ????}
  res.redirect(urlDatabase[shortURL].longURL);
});

app.get("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const user_ID = req.session.user_ID;
  const user = users[user_ID];
  if(urlDatabase[shortURL].userID === user_ID) {
    const templateVars = { 
      shortURL, 
      longURL: urlDatabase[shortURL].longURL, 
      user
    };
    res.render("urls_show", templateVars);
  } else if (!user) {
  res.status(403).send("You are not logged In!")
  } else {
    res.status(403).send("This isn't yours!")
  }
});
app.set("_header", "/views/partials/_header.ejs");

app.post("/urls/:id", (req, res) => {
  if (req.session.user_ID === urlDatabase[req.params.id].userID) {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect(`/urls/${req.params.id}`);
  } else {
    res.status(550).send("You can't do that");
  }
});

app.post("/urls/:id/delete", (req, res) => {
  if (req.session.user_ID === urlDatabase[req.params.id].userID) {
    delete urlDatabase[req.params.id]
    res.redirect("/urls")
  } else {
    res.status(550).send("You can't do that");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/login", (req, res) => {
  const user_ID = req.session.user_ID;
  const templateVars = {
    user: users[user_ID]
  };
  if (user_ID) {
    res.redirect("/urls")
  } else {
    res.render("urls_login", templateVars)
  };
});

app.post("/login", (req, res) => {
let user = emailTaken(req.body['email']);
  if (!user) {
    console.log("403 error");
    res.status(403).send("Email has already been registered!");
  } else if (!bcrypt.compareSync(req.body.password, user.password)) {
    console.log("403 error");
    res.status(403).send("Invalid email and password");
  } else {
    req.session.user_ID = user.id;
  res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  req.session.user_ID = null;
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const user_ID = req.session.user_ID;
  const user = users[user_ID];
  const templateVars = {
    user: user
  };
res.render("urls_register", templateVars)
});

app.post("/register", (req, res) => {
  const user_ID = generateRandomString(6);
  const userEmail = req.body['email'];
  const userPassword = bcrypt.hashSync(req.body.password, salt);
  const newUser = {
    "id": user_ID,
    "email": userEmail,
    "password": userPassword
  };
  if (!req.body.email || !req.body.password) {
    console.log("400 error");
    res.status(400).send("Invalid email and password");
  } else if (emailTaken(userEmail)) {
    console.log("400 error");
    res.status(400).send("Email has already been registered!");
  } else {
    req.session.user_ID = newUser.id;
    users[user_ID] = newUser;
    res.redirect("/urls");
  }
});

function emailTaken(email) {
  for (let user_ID in users) {
    if (email === users[user_ID].email) {
      return users[user_ID];
    }
  }
  return false;
};

function urlsForUser(id) {
  let userURLs = {};
  for (var urlKey in urlDatabase) {
    if ( id === urlDatabase[urlKey].userID) {
      userURLs[urlKey] = urlDatabase[urlKey];
    }
  }
  return userURLs;
};

const generateRandomString = function (data) {
  let string = ""
  let alphaNum = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvxyz0123456789";
  for (let i = 0; i < data; i++) { 
  string += alphaNum[Math.floor(Math.random() * 62)];
  }
  return string;
};

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
