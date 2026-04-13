const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const users = {};

io.on('connection', (socket) => {
  socket.on('join', (userId) => {
    users[String(userId)] = socket.id;
    console.log('✅ joined:', userId, '| socket:', socket.id);
    console.log('All users:', users);
  });

  socket.on('call_initiate', (data) => {
    const target = users[String(data.receiverId)];
    console.log('call_initiate → to:', data.receiverId, '| socket:', target);
    if (target) io.to(target).emit('call_incoming', {
      callerId: data.callerId,
      callType: data.callType,
      callerInfo: { id: data.callerId, name: 'User ' + data.callerId }
    });
  });

  socket.on('call_accept', (data) => {
    const target = users[String(data.callerId)];
    console.log('call_accept → to:', data.callerId, '| socket:', target);
    if (target) io.to(target).emit('call_accepted', {
      receiverId: data.receiverId
    });
  });

  socket.on('call_decline', (data) => {
    const target = users[String(data.callerId)];
    if (target) io.to(target).emit('call_declined');
  });

  socket.on('call_end', (data) => {
    const t1 = users[String(data.receiverId)];
    const t2 = users[String(data.callerId)];
    if (t1) io.to(t1).emit('call_ended', { reason: 'ended_by_user' });
    if (t2) io.to(t2).emit('call_ended', { reason: 'ended_by_user' });
  });

  socket.on('webrtc_offer', (data) => {
    const target = users[String(data.receiverId)];
    console.log('webrtc_offer → to:', data.receiverId, '| socket:', target);
    if (target) io.to(target).emit('webrtc_offer', {
      senderId: data.senderId,
      sdp: data.sdp
    });
  });

  socket.on('webrtc_answer', (data) => {
    const target = users[String(data.callerId)];
    console.log('webrtc_answer → to:', data.callerId, '| socket:', target);
    if (target) io.to(target).emit('webrtc_answer', {
      senderId: data.senderId,
      sdp: data.sdp
    });
  });

  socket.on('webrtc_ice', (data) => {
    const target = users[String(data.peerId)];
    console.log('webrtc_ice → to:', data.peerId, '| socket:', target);
    if (target) io.to(target).emit('webrtc_ice', {
      candidate:     data.candidate,
      sdpMid:        data.sdpMid,
      sdpMLineIndex: data.sdpMLineIndex
    });
  });

  socket.on('disconnect', () => {
    Object.keys(users).forEach(k => {
      if (users[k] === socket.id) {
        console.log('disconnected:', k);
        delete users[k];
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('✅ Server running on port', PORT));
