export const sameId = (a, b) => String(a ?? "") === String(b ?? "");

export const currentUserId = (user) => user?.id || user?._id;
