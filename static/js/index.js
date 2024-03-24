var iceServer = {
    "iceServers": [{
        "url": "stun:stun.l.google.com:19302"
    }, {
        "url": "turn:numb.viagenie.ca",
        "username": "webrtc@live.com",
        "credential": "muazkh"
    }]
};

// 创建pc实例
var pc = new RTCPeerConnection(iceServer);

// pc状态变更事件
pc.addEventListener("statechange", (event) => {
    console.log(event);
});

// 监听ice事件
pc.addEventListener("icecandidate", onIcecandidate);

// 监听媒体数据
pc.addEventListener("track", onTrack);

// 连接信令服务器
var ws = io();

// 进入共享事件
ws.on("joined", ({ roomId, userId, userName, userNum }) => {
    showMessage(`${userName}加入共享，当前房间人数${userNum}`);
    if (userNum == 1) {
        master = true;
        waitReady();
    }
    if (userNum >= 2) {
        ready = true;
        onReady();
    }
});

// 退出共享事件
ws.on("leave", ({ roomId, userId, userName, userNum }) => {
    showMessage(`${userName}退出房间，当前房间人数${userNum}`);
    if (userNum == 1) {
        ready = false;
    }
});

// 同步sdp事件
ws.on("offer", (sdp) => {
    handleOffer(pc, sdp);
});

// 同步sdp事件
ws.on("answer", (sdp) => {
    handleAnswer(pc, sdp);
});

// 同步candidate事件
ws.on("candidate", (candidate) => {
    handleCandidate(pc, candidate);
});

// 发送信令
function sendSignal(ws, roomId, data) {
    ws.emit(data.type, {
        roomId: roomId,
        data: data
    });
}

// 监听ice事件
function onIcecandidate(event) {
    console.log("监听到icecandidate事件", event);
    const candidate = event.candidate;
    if (candidate) {
        // 发送本地ice到远端
        sendSignal(ws, roomId, {
            type: "candidate",
            candidate: candidate.candidate,
            sdpMid: candidate.sdpMid,
            sdpMLineIndex: candidate.sdpMLineIndex
        });
    }
}

// 监听媒体数据
function onTrack(event) {
    console.log("监听媒体数据", event);
    srcVideo.srcObject = event.streams[0];
}

// 创建本地sdp，发起方
function createOffer(pc) {
    pc.createOffer().then((offer) => {
        console.log("创建本地offer", offer);

        // 绑定本地sdp
        pc.setLocalDescription(offer);

        // 发送本地sdp到远端
        sendSignal(ws, roomId, {
            type: "offer",
            sdp: offer.sdp
        });
    }).catch((err) => {
        console.error(err);
    });
}

// 处理远端offer
function handleOffer(pc, offer) {
    console.log("收到远端offer", offer);

    // 绑定远端sdp
    pc.setRemoteDescription(offer);

    // pc.addStream(srcVideo.srcObject);

    // 创建本地sdp
    pc.createAnswer().then((answer) => {
        console.log("创建本地answer", answer);

        // 绑定本地sdp
        pc.setLocalDescription(answer);

        // 发送本地sdp到远端
        sendSignal(ws, roomId, {
            type: "answer",
            sdp: answer.sdp
        });
    }).catch((err) => {
        console.error(err);
    });
}

// 处理远端answer
function handleAnswer(pc, answer) {
    console.log("收到远端answer", answer);

    // 绑定远端sdp
    pc.setRemoteDescription(answer);
}

// 处理远端的candidate
function handleCandidate(pc, candidate) {
    console.log("收到远端candidate", candidate);

    // 绑定远端ice
    if (candidate.candidate) {
        pc.addIceCandidate(candidate).catch((err) => {
            console.log(err);
        });
    }
}

const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

// 随机字符串
function randomString(length) {
    var result = '';
    for (var i = length; i > 0; --i) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

function showMessage(msg) {
    $("#message-body").html(msg);
    $("#message").addClass("show");
    setTimeout(function () {
        hideMessage();
    }, 1500);
}

function hideMessage() {
    $("#message").removeClass("show");
}