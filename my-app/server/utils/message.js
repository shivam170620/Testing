const chatForm = document.getElementById('chat-form');






const chatMessages = document.querySelector('.chat-messages');


const roomName = document.getElementById('room-name');


const userList = document.getElementById('users');







// Get username and room from URL


const { username, room } = Qs.parse(location.search, {


 ignoreQueryPrefix: true,


});







const socket = io();







// Join chatroom


socket.emit('joinRoom', { username, room });







// Get room and users


socket.on('roomUsers', ({ room, users }) => {


 outputRoomName(room);


 outputUsers(users);


});







// Message from server


socket.on('message', (message) => {


 console.log(message);


 outputMessage(message);







 // Scroll down


 chatMessages.scrollTop = chatMessages.scrollHeight;


});







// Message submit


chatForm.addEventListener('submit', (e) => {


 e.preventDefault();







 // Get message text


 let msg = e.target.elements.msg.value;







 msg = msg.trim();







 if (!msg) {


   return false;


 }







 // Emit message to server


 socket.emit('chatMessage', msg);







 // Clear input


 e.target.elements.msg.value = '';


 e.target.elements.msg.focus();


});







// Output message to DOM


function outputMessage(message) {


 const div = document.createElement('div');


 div.classList.add('message');


 const p = document.createElement('p');


 p.classList.add('meta');


 p.innerText = message.username;


 p.innerHTML += `<span>${message.time}</span>`;


 div.appendChild(p);


 const para = document.createElement('p');


 para.classList.add('text');


 para.innerText = message.text;


 div.appendChild(para);


 document.querySelector('.chat-messages').appendChild(div);


}







// Add room name to DOM


function outputRoomName(room) {


 roomName.innerText = room;


}







// Add users to DOM


function outputUsers(users) {


 userList.innerHTML = '';


 users.forEach((user) => {


   const li = document.createElement('li');


   li.innerText = user.username;


   userList.appendChild(li);


 });


}







//Prompt the user before leave chat room


document.getElementById('leave-btn').addEventListener('click', () => {


 const leaveRoom = confirm('Are you sure you want to leave the chatroom?');


 if (leaveRoom) {


   window.location = '../index.html';


 } else {


 }


});

Server.js


const path = require("path");




const http = require("http");


const express = require("express");


const socketio = require("socket.io");


const formatMessage = require("./utils/messages");


const createAdapter = require("@socket.io/redis-adapter").createAdapter;


const redis = require("redis");


require("dotenv").config();


const { createClient } = redis;


const {


 userJoin,


 getCurrentUser,


 userLeave,


 getRoomUsers,


} = require("./utils/users");







const app = express();


const server = http.createServer(app);


const io = socketio(server);







// Set static folder


app.use(express.static(path.join(__dirname, "public")));







const botName = "ChatCord Bot";







(async () => {


 pubClient = createClient({ url: "redis://127.0.0.1:6379" });


 await pubClient.connect();


 subClient = pubClient.duplicate();


 io.adapter(createAdapter(pubClient, subClient));


})();







// Run when client connects


io.on("connection", (socket) => {


 console.log(io.of("/").adapter);


 socket.on("joinRoom", ({ username, room }) => {


   const user = userJoin(socket.id, username, room);







   socket.join(user.room);







   // Welcome current user


   socket.emit("message", formatMessage(botName, "Welcome to ChatCord!"));







   // Broadcast when a user connects


   socket.broadcast


     .to(user.room)


     .emit(


       "message",


       formatMessage(botName, `${user.username} has joined the chat`)


     );







   // Send users and room info


   io.to(user.room).emit("roomUsers", {


     room: user.room,


     users: getRoomUsers(user.room),


   });


 });







 // Listen for chatMessage


 socket.on("chatMessage", (msg) => {


   const user = getCurrentUser(socket.id);







   io.to(user.room).emit("message", formatMessage(user.username, msg));


 });







 // Runs when client disconnects


 socket.on("disconnect", () => {


   const user = userLeave(socket.id);







   if (user) {


     io.to(user.room).emit(


       "message",


       formatMessage(botName, `${user.username} has left the chat`)


     );







     // Send users and room info


     io.to(user.room).emit("roomUsers", {


       room: user.room,


       users: getRoomUsers(user.room),


     });


   }


 });


});







const PORT = process.env.PORT || 3000;







server.listen(PORT, () => console.log(`Server running on port ${PORT}`));


