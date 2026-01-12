import multiavatar from "@multiavatar/multiavatar";

const generateAvatar = (userId = "default") => {
  try {
    // Usar el userId para generar un avatar único y consistente
    const uniqueId = String(userId).trim() || "default";
    const avatarSVG = multiavatar(uniqueId);
    return `data:image/svg+xml;base64,${btoa(avatarSVG)}`;
  } catch (error) {
    console.error("Error generando avatar multiavatar:", error);
    // Fallback a avatares consistentes basados en hash
    return getFallbackAvatar(userId);
  }
};

const getFallbackAvatar = (userId) => {
  const colors = [
    "FF6B6B",
    "4ECDC4",
    "45B7D1",
    "96CEB4",
    "FFEAA7",
    "DDA0DD",
    "98D8C8",
    "F7DC6F",
    "BB8FCE",
    "85C1E9",
  ];

  // Crear un hash simple del userId para color consistente
  const getColorIndex = (id) => {
    if (!id) return 0;
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % colors.length;
  };

  const colorIndex = getColorIndex(userId);
  const name = userId ? userId.slice(0, 2).toUpperCase() : "US";

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=${colors[colorIndex]}&color=fff&bold=true`;
};

export { generateAvatar };
