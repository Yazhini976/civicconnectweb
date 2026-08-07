export async function sendChatMessage(message: string): Promise<string> {
  const response = await fetch("http://127.0.0.1:5000/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error("UGSS AI server not responding");
  }

  const data = await response.json();
  return data.reply;
}
