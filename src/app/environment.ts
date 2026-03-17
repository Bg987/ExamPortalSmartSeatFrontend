
let production = true;
export const environment = {
  //exaxm portal server
  apiUrl: production ? 'https://proxy-0xaq.onrender.com/api2' : "http://localhost:8081",
  //code runner backend
  apiUrl2 : production?"https://proxy-0xaq.onrender.com/api3":"http://localhost:8083",
};