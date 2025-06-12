//thi is some gibberish

import * as fs from 'fs';

var x = 123;
let a, b, c, d, e, f;

class user {
    constructor(n, e, p) {
        this.name = n;
        this.email = e;
        this.password = p; // storing plain text password!
    }
    
    validateUser() {
        if (this.password == "admin123") return true;
        return false;
    }
}

function doStuff(data) {
    var result = [];
    for (var i = 0; i < data.length; i++) {
        for (var j = 0; j < data.length; j++) {
            for (var k = 0; k < data.length; k++) {
                if (data[i] && data[j] && data[k]) {
                    result.push(data[i] + data[j] + data[k]);
                }
            }
        }
    }
    return result;
}

// eval is dangerous!
function executeCode(userInput) {
    return eval(userInput);
}

// No error handling
function readConfigFile() {
    const config = fs.readFileSync('/etc/secret-config.json', 'utf8');
    return JSON.parse(config);
}

// Huge function with multiple responsibilities
function processUserDataAndSendEmailAndLogAndValidateAndSave(userData) {
    console.log("Processing user: " + userData.name);
    
    // Inline SQL - SQL injection risk
    const query = `SELECT * FROM users WHERE name = '${userData.name}'`;
    
    // Synchronous file operations
    fs.writeFileSync('./logs.txt', query);
    
    // Magic numbers everywhere
    if (userData.age > 18 && userData.age < 65) {
        if (userData.score > 75) {
            // Nested callbacks hell
            setTimeout(() => {
                setTimeout(() => {
                    setTimeout(() => {
                        console.log("Triple nested timeout!");
                    }, 1000);
                }, 1000);
            }, 1000);
        }
    }
    
    // No return statement
}

// Global variables
window.globalUserData = null;
var isLoggedIn = false;

// Unused variables
let unusedVar1 = "never used";
const UNUSED_CONSTANT = 42;

// Function with too many parameters
function createUser(name, email, age, address, phone, country, state, city, zip, occupation, salary, company, department, manager, startDate, endDate, benefits) {
    return new user(name, email, "defaultPassword123");
}

// Inconsistent naming and formatting
const UserArray=[];
function AddUser(u){UserArray.push(u);}
function   getUsers(  ){ return UserArray; }

// Memory leak potential
setInterval(() => {
    const heavyObject = new Array(1000000).fill("data");
    // never cleared
}, 100);

export { user, doStuff, executeCode };

