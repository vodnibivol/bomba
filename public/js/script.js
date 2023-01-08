const $ = (sel) => document.querySelector(sel);
const socket = io();

const Bomba = {
  // roomName: new URLSearchParams(location.search).get('room'),
  roomName: window.location.pathname.match(/\/?(.*)\/?/)[1],
  cells: new Array(9).fill(-1),
  playerNo: -1, // 0 ali 1, določi server
  playersNo: 1,
  turn: -1,
  msgAlert: false, // pojavi se za določen čas, če kaj narobe klikneš ipd...

  get msg() {
    if (this.playerNo === -1) return 'GLEDALEC';

    if (this.playersNo < 2) return 'ČAKAM NA NASPROTNIKA...';
    else if (this.winner !== null) return this.winner === this.playerNo ? 'ZMAGA' : 'PORAZ';
    else if (this.draw) return 'NEODLOČENO...';
    else return this.yourTurn ? 'TVOJA POTEZA' : 'NASPROTNIKOVA POTEZA';
  },

  get msgShown() {
    return this.playerNo === -1 || this.playersNo < 2 || this.winner !== null || this.draw || this.msgAlert;
  },

  get yourTurn() {
    return this.turn !== -1 && this.turn === this.playerNo;
  },

  get disabled() {
    if (this.playerNo === -1) return true;
    return !(this.playersNo > 1 && this.winner === null && this.yourTurn);
  },

  init() {
    console.log(this.roomName);
    socket.emit('ACCESS_ROOM', this.roomName);
    socket.on('GRANT_ROOM_ACCESS', ({ playerNo, roomName }) => {
      this.playerNo = playerNo;
    });
    socket.on('GAME_STATE', ({ cells, turn, playersNo }) => {
      this.turn = turn;
      this.cells = cells;
      this.playersNo = playersNo;
    });

    // --- events
    document.onclick = (e) => e.target.matches('#board, .cell') || this.showMsg();
  },

  get winner() {
    const WINS = ['012', '345', '678', '036', '147', '258', '048', '246'];
    let w = null;
    [0, 1].forEach((playerNo) => {
      if (WINS.some((combo) => [...combo].every((index) => this.cells[index] === playerNo))) w = playerNo;
    });
    return w;
  },

  get draw() {
    return !this.winner && this.cells.every((c) => c !== -1);
  },

  cellClick(index) {
    this.cells[index] = this.playerNo;
    this.turn = 1 - this.turn; // 1 <=> 0

    socket.emit('GAME_STATE', {
      cells: this.cells,
      turn: this.turn,
      winner: this.winner,
    });
  },

  reset() {
    socket.emit('RESET_GAME', { roomName: this.roomName, winner: this.winner });
  },

  showMsg() {
    this.msgAlert = true && setTimeout(() => (this.msgAlert = false), 2000);
  },
};
