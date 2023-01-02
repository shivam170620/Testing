var socket = io();
function scrollToBottom() {
    // Selectors
    var messages = $('#messages');
    var newMessage = messages.children('li:last-child')
    // Heights
    var clientHeight = messages.prop('clientHeight');
    var scrollTop = messages.prop('scrollTop');
    var scrollHeight = messages.prop('scrollHeight');
    var newMessageHeight = $('#messages li').last().innerHeight();
    var lastMessageHeight = $('#messages li:nth-last-child(2)').innerHeight();
    if (clientHeight + scrollTop + newMessageHeight + lastMessageHeight >= scrollHeight) {
        messages.scrollTop(scrollHeight);
    }
}

socket.on('connect', function () {
    // console.log('Connected to server');
    var params = jQuery.deparam(window.location.search);
    socket.emit('join', params, function (err) {
        if (err) {
            alert(err);
            window.location.href = '/';
        } else {
            console.log('No error')

        }
    })
})
socket.on('disconnect', function () {
    console.log('Disconnected from server')
})
socket.on('updateUserList', function (users) {
    var ol = $('<ol></ol>');
    users.forEach(function (user) {
        ol.append($('<li></li>').text(user));
    })
    $('#users').html(ol);
    console.log('Users List', users)
})
socket.on('newMessage', function (message) {
    console.log('Got new Message', message);
    var formattedTime = moment(message.createdAt).format('h:mm a');
    var template = $('#message-template').html();
    var html = Mustache.render(template, {
        from: message.from,
        text: message.text,
        createdAt: formattedTime
    });
    $('#messages').append(html);
    scrollToBottom();
})
socket.on('newLocationMessage', function (message) {
    console.log('Got new Location', message);
    var formattedLocationTime = moment(message.createdAt).format('h:mm a');
    console.log(formattedLocationTime);
    var template = $('#location-message-template').html();
    var html = Mustache.render(template, {
        from: message.from,
        url: message.url,
        createdAt: formattedLocationTime
    });
    $('#messages').append(html);
    scrollToBottom();
})

$('#message-form').on('submit', function (event) {
    event.preventDefault();
    var messageTextbox = $('[name=message]');
    socket.emit('createMessage', {
        text: messageTextbox.val()
    }, function () {
        messageTextbox.val("");
    })
})
var locationButton = $("#send-location");
locationButton.on('click', function () {

    if (!navigator.geolocation) {
        return alert('Geolocation not supported by your browser');
    }
    locationButton.attr('disabled', 'disabled').text('Sending location ...');
    navigator.geolocation.getCurrentPosition(function (position) {

        locationButton.removeAttr('disabled').text('Send location');
        socket.emit('createLocationMessage', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        })
    }, function () {
        locationButton.removeAttr('disabled').text('Send location');
        alert('Unable to fetch location');
    })
});