const getUserByEmail = function(email, dataBase) {
  const keys = Object.keys(dataBase);
  for (const user of keys) {
    if (dataBase[user].email === email) {
      return dataBase[user].id;
    }
  }
  return false;
};

module.exports = {
  getUserByEmail
}