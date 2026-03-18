
let production = true;
export const environment = {
  //exaxm portal server
  apiUrl: production ? 'https://examportalsmartseatbackend.onrender.com' : "http://localhost:8081",
  //code runner backend
  apiUrl2 : production?"https://compilerbackend2.onrender.com":"http://localhost:8083",
};