const MaxUserNum = 2;
const userInfo = {};
const roomsInfo = {};
const userRoomInfo = {};

// 加入房间
function onJoin(socket, { roomId, userName }) {
    if (!roomId || !userName) {
        return;
    }
    console.log(`${userName} join ${roomId}`);

    // 登记房间用户
    if (!roomsInfo[roomId]) {
        roomsInfo[roomId] = {};
    }
    // 检查房间人数
    let userNum = Object.keys(roomsInfo[roomId]).length;
    if (userNum >= MaxUserNum) {
        socket.emit('full', { roomId, userNum });
        return;
    }
    roomsInfo[roomId][socket.id] = socket;
    socket.join(roomId);

    //登记用户房间，双向映射
    if (!userRoomInfo[socket.id]) {
        userRoomInfo[socket.id] = [];
    }
    userRoomInfo[socket.id].push(roomId);

    // 记录用户信息
    userInfo[socket.id] = userName;

    userNum = Object.keys(roomsInfo[roomId]).length;
    if (userNum > 1) {
        // 给其他人发
        socket.to(roomId).emit('joined', {
            roomId: roomId,
            userId: socket.id,
            userName: userName,
            userNum: userNum
        });
    }
    // 给自己发
    socket.emit('joined', {
        roomId: roomId,
        userId: socket.id,
        userName: userName,
        userNum: userNum
    });
}

// 同步sdp
function onOffer(socket, { roomId, data }) {
    socket.to(roomId).emit('offer', data);
}

// 同步sdp
function onAnswer(socket, { roomId, data }) {
    socket.to(roomId).emit('answer', data);
}

// 同步candidate
function onCandidate(socket, { roomId, data }) {
    socket.to(roomId).emit('candidate', data);
}

// 断开连接事件
function onDisconnect(socket, data) {
    // 清理用户和房间池映射
    delete userInfo[socket.id];
    delete userRoomInfo[socket.id];

    // 遍历当前用户所在的所有房间，通知房间中的其他用户
    let rooms = userRoomInfo[socket.id] || [];
    rooms.forEach((roomId, i) => {
        // 将当前用户从房间中移除
        delete roomsInfo[roomId][socket.id];
        let userNum = Object.keys(roomsInfo[roomId]).length;
        socket.to(roomId).emit('joined', {
            roomId: roomId,
            userId: socket.id,
            userName: userName,
            userNum: userNum
        });
        socket.leave(roomId);
    });
}

function handler(socket, call) {
    return function (data) {
        call(socket, data);
    }
}

exports.initEvent = function (socket) {
    socket.on("disconnect", handler(socket, onDisconnect));
    socket.on("join", handler(socket, onJoin));
    socket.on("offer", handler(socket, onOffer));
    socket.on("answer", handler(socket, onAnswer));
    socket.on("candidate", handler(socket, onCandidate));
}