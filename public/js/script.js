const $ = (sel) => document.querySelector(sel);
const socket = io();

const Bomba = {
  roomName: new URLSearchParams(location.search).get('room'),
  cells: new Array(9).fill(-1),
  playerNo: -1, // 0 ali 1, določi server
  playersNo: 1,
  turn: -1,
  msgAlert: false, // pojavi se za določen čas, če kaj narobe klikneš ipd...

  get msg() {
    if (this.playerNo === -1) return 'GLEDALEC';

    if (this.playersNo < 2) return 'ČAKAM NA NASPROTNIKA...';
    else if (this.winner !== null) return this.winner === this.playerNo ? 'ZMAGA' : 'PORAZ';
    else return this.yourTurn ? 'TVOJA POTEZA' : "NASPROTNIKOVA POTEZA";
  },

  get msgShown() {
    return this.playerNo === -1 || this.playersNo < 2 || this.winner !== null || this.msgAlert;
  },

  get yourTurn() {
    return this.turn !== -1 && this.turn === this.playerNo;
  },

  get disabled() {
    if (this.playerNo === -1) return true;
    return !(this.playersNo > 1 && this.winner === null && this.yourTurn);
  },

  init() {
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
    document.onkeydown = (e) => e.key === 'r' && socket.emit('RESET_GAME', this.roomName);
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

  onClick(index) {
    if (this.playerNo === -1) return console.warn('OBSERVER');

    this.cells[index] = this.playerNo;
    this.turn = 1 - this.turn;

    socket.emit('GAME_STATE', {
      cells: this.cells,
      turn: this.turn,
      winner: this.winner,
    });
  },

  showMsg() {
    this.msgAlert = true && setTimeout(() => (this.msgAlert = false), 2000);
  },
};
