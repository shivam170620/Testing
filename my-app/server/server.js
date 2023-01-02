require('dotenv').config();
const path=require('path');
const http=require('http')
const express=require('express');
const socketIO=require('socket.io');
const {generateMessage,generateLocationMessage}=require('./utils/message')
const {Users}=require('./utils/users')
const {isValidMessage}=require('./utils/validation')
const publicPath=path.join(__dirname,'../public')
const port=process.env.PORT || 3000;
var app=express();
var server=http.createServer(app);
var io=socketIO(server);
var users=new Users();
app.use(express.static(publicPath));
// Socket Represents an individual connection
 // While io represents entire socket group
io.on('connection',(socket)=>{
	console.log('New user connected');
	
	socket.on('join',(params,callback)=>{
		if(!isValidMessage(params.name)|| !isValidMessage(params.room)){
		return callback('Name and Room name required')
	
		}
		socket.join(params.room);
		users.removeUser(socket.id);
		users.addUser(socket.id,params.name,params.room);
		io.to(params.room).emit('updateUserList',users.getUserList(params.room));

		socket.emit('newMessage',generateMessage('Admin','Welcome to the chat app'));
		socket.broadcast.to(params.room).emit('newMessage',generateMessage('Admin',`${params.name} has joined`))
	
	})
	socket.on('createMessage',(message,callback)=>{
		// console.log('New Message',message);
		var user=users.getUser(socket.id);
		if(user && isValidMessage(message.text)){
			io.to(user.room).emit('newMessage',generateMessage(user.name,message.text))
		}
		
		callback();
		
	})
	socket.on('createLocationMessage',(coords)=>{
		console.log('Location',coords);
		var user=users.getUser(socket.id);
		if(user){
			io.to(user.room).emit('newLocationMessage',generateLocationMessage(user.name,coords.latitude,coords.longitude))
		}
		// io.emit('newLocationMessage',generateLocationMessage('Admin',coords.latitude,coords.longitude))
	})
	socket.on('disconnect',()=>{
		// console.log('User was disconnected');
		var user=users.removeUser(socket.id);
		if(user){
			io.to(user.room).emit('updateUserList',users.getUserList(user.room));
			io.to(user.room).emit('newMessage',generateMessage('Admin',`${user.name} has left`));
		}
	})
})

server.listen(port,()=>{
	console.log(`Server is up on ${port}`);
})
