
let production = false;
export const environment = {
  //exaxm portal server
  apiUrl: production ? 'https://proxy-0xaq.onrender.com/api2' : "http://localhost:8081",
  //code runner backend
  apiUrl2 : production?"https://compilerbackend2.onrender.com":"http://localhost:8083",
};