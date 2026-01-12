// util/socketInstance.js
let ioInstance = null;

export const setIo = (io) => {
  ioInstance = io;
  console.log("✅ Socket.io instance configurada en socketInstance");
};

export const getIo = () => {
  return ioInstance;
};
